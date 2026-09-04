from datetime import date, datetime, timedelta
from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.centre import ProcurementCentre
from app.models.enums import CentreStatus, SlotStatus
from app.models.queue_entry import QueueEntry
from app.models.slot import Slot
from app.models.user import User

from app.services.booking_service import get_my_booking
from app.services.farmer_service import get_farmer_for_user
from app.services.queue_service import get_average_service_minutes


def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    earth_radius_km = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * asin(sqrt(a))

    return round(
        earth_radius_km * c,
        2,
    )


def normalise_score(
    value: float,
    maximum: float,
) -> float:
    if maximum <= 0:
        return 0

    return max(
        0,
        min(1, value / maximum),
    )


def get_farmer_coordinates(farmer):
    # Use the first farm that has coordinates.
    # If your Farm model uses different field names,
    # adapt latitude/longitude here only.

    farms = getattr(farmer, "farms", [])

    for farm in farms:
        latitude = getattr(farm, "latitude", None)
        longitude = getattr(farm, "longitude", None)

        if latitude is not None and longitude is not None:
            return float(latitude), float(longitude)

    return None, None


def recommend_centres(
    db: Session,
    current_user: User,
    limit: int = 5,
):
    farmer = get_farmer_for_user(
        db,
        current_user,
    )

    farmer_lat, farmer_lon = get_farmer_coordinates(
        farmer
    )

    centres = (
        db.query(ProcurementCentre)
        .filter(
            ProcurementCentre.status == CentreStatus.ACTIVE
        )
        .all()
    )

    today = date.today()
    results = []

    for centre in centres:
        open_slots = (
            db.query(Slot)
            .filter(
                Slot.centre_id == centre.id,
                Slot.slot_date >= today,
                Slot.status == SlotStatus.OPEN,
            )
            .all()
        )

        if not open_slots:
            continue

        total_available_farmer_capacity = 0

        for slot in open_slots:
            available = max(
                0,
                slot.max_farmer_capacity
                - slot.booked_farmer_count,
            )

            total_available_farmer_capacity += available

        today_queue_count = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.centre_id == centre.id,
                QueueEntry.queue_date == today,
            )
            .count()
        )

        avg_service = get_average_service_minutes(
            db,
            centre.id,
            today,
        )

        estimated_wait = round(
            today_queue_count * avg_service
        )

        capacity_score = min(
            1.0,
            total_available_farmer_capacity / 50,
        )

        queue_score = 1.0 - min(
            1.0,
            today_queue_count / 30,
        )

        slot_score = min(
            1.0,
            len(open_slots) / 10,
        )

        distance_km = None
        distance_score = 0.5

        centre_lat = getattr(
            centre,
            "latitude",
            None,
        )

        centre_lon = getattr(
            centre,
            "longitude",
            None,
        )

        if (
            farmer_lat is not None
            and farmer_lon is not None
            and centre_lat is not None
            and centre_lon is not None
        ):
            distance_km = haversine_km(
                farmer_lat,
                farmer_lon,
                float(centre_lat),
                float(centre_lon),
            )

            distance_score = 1.0 - min(
                1.0,
                distance_km / 100,
            )

        final_score = round(
            (
                capacity_score * 35
                + queue_score * 30
                + slot_score * 20
                + distance_score * 15
            ),
            1,
        )

        reasons = []

        if queue_score >= 0.7:
            reasons.append("low queue")

        if capacity_score >= 0.7:
            reasons.append("good capacity")

        if slot_score >= 0.5:
            reasons.append("multiple open slots")

        if distance_km is not None and distance_km <= 25:
            reasons.append("near your farm")

        reason = (
            ", ".join(reasons)
            if reasons
            else "balanced availability and queue conditions"
        )

        results.append(
            {
                "centre_id": centre.id,
                "centre_name": centre.name,
                "district": centre.district,
                "score": final_score,
                "estimated_wait_minutes": estimated_wait,
                "open_slot_count": len(open_slots),
                "available_farmer_capacity": total_available_farmer_capacity,
                "distance_km": distance_km,
                "reason": reason,
            }
        )

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return results[: max(1, min(limit, 10))]


def recommend_slots(
    db: Session,
    centre_id: int,
    limit: int = 5,
):
    today = date.today()

    slots = (
        db.query(Slot)
        .filter(
            Slot.centre_id == centre_id,
            Slot.slot_date >= today,
            Slot.status == SlotStatus.OPEN,
        )
        .order_by(
            Slot.slot_date.asc(),
            Slot.start_time.asc(),
        )
        .all()
    )

    results = []

    for slot in slots:
        available_farmers = max(
            0,
            slot.max_farmer_capacity
            - slot.booked_farmer_count,
        )

        available_quantity = max(
            0,
            slot.max_quantity_capacity
            - slot.booked_quantity,
        )

        if available_farmers <= 0:
            continue

        farmer_capacity_ratio = (
            available_farmers
            / max(slot.max_farmer_capacity, 1)
        )

        quantity_capacity_ratio = (
            available_quantity
            / max(slot.max_quantity_capacity, 1)
        )

        queue_count = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.centre_id == centre_id,
                QueueEntry.queue_date == slot.slot_date,
            )
            .count()
        )

        avg_service = get_average_service_minutes(
            db,
            centre_id,
            slot.slot_date,
        )

        estimated_wait = round(
            queue_count * avg_service
        )

        queue_score = 1.0 - min(
            1.0,
            queue_count / 30,
        )

        final_score = round(
            (
                farmer_capacity_ratio * 35
                + quantity_capacity_ratio * 35
                + queue_score * 30
            ),
            1,
        )

        results.append(
            {
                "slot_id": slot.id,
                "centre_id": slot.centre_id,
                "slot_date": slot.slot_date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "available_farmer_capacity": available_farmers,
                "available_quantity_capacity": available_quantity,
                "recommendation_score": final_score,
                "estimated_wait_minutes": estimated_wait,
                "reason": "Calculated from slot capacity and queue pressure",
            }
        )

    results.sort(
        key=lambda item: item["recommendation_score"],
        reverse=True,
    )

    return results[: max(1, min(limit, 10))]


def get_leave_time(
    db: Session,
    current_user: User,
    booking_id: int,
    travel_minutes: int,
    safety_buffer_minutes: int = 15,
):
    booking = get_my_booking(
        db,
        current_user,
        booking_id,
    )

    slot_start = datetime.combine(
        booking.slot.slot_date,
        booking.slot.start_time,
    )

    recommended_leave = (
        slot_start
        - timedelta(minutes=travel_minutes)
        - timedelta(minutes=safety_buffer_minutes)
    )

    return {
        "booking_id": booking.id,
        "slot_start": slot_start,
        "travel_minutes": travel_minutes,
        "safety_buffer_minutes": safety_buffer_minutes,
        "recommended_leave_time": recommended_leave,
        "message": (
            f"Leave by {recommended_leave.strftime('%I:%M %p')} "
            "to reach the procurement centre comfortably."
        ),
    }