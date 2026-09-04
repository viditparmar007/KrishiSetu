from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.crop import Crop
from app.models.enums import (
    BookingStatus,
    CentreStatus,
    SlotStatus,
)
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.models.slot import Slot
from app.models.user import User

from app.schemas.booking import BookingCreate

from app.services.farmer_service import (
    get_farmer_for_user,
)

from app.utils.token_generator import (
    generate_booking_token,
)
from app.services.officer_service import (
    get_officer_for_user,
)


ACTIVE_BOOKING_STATUSES = {
    BookingStatus.CONFIRMED,
    BookingStatus.CHECKED_IN,
}


def get_owned_crop(
    db: Session,
    current_user: User,
    crop_id: int,
) -> Crop:

    crop = (
        db.query(Crop)
        .join(
            Farm,
            Crop.farm_id == Farm.id,
        )
        .join(
            Farmer,
            Farm.farmer_id == Farmer.id,
        )
        .filter(
            Crop.id == crop_id,
            Farmer.user_id == current_user.id,
        )
        .first()
    )

    if crop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found",
        )

    return crop


def get_slot_for_booking(
    db: Session,
    slot_id: int,
) -> Slot:

    slot = db.query(
        Slot
    ).filter(
        Slot.id == slot_id
    ).first()

    if slot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found",
        )

    if slot.centre is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot has no procurement centre",
        )

    if slot.centre.status != CentreStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Procurement centre is inactive",
        )

    if slot.status != SlotStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot is not open for booking",
        )

    if slot.slot_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a past slot",
        )

    return slot


def ensure_no_active_crop_booking(
    db: Session,
    farmer_id: int,
    crop_id: int,
) -> None:

    existing = (
        db.query(Booking)
        .filter(
            Booking.farmer_id == farmer_id,
            Booking.crop_id == crop_id,
            Booking.status.in_(
                list(ACTIVE_BOOKING_STATUSES)
            ),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This crop already has an active booking",
        )


def ensure_capacity(
    slot: Slot,
    declared_quantity: float,
) -> None:

    if slot.booked_farmer_count >= slot.max_farmer_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot farmer capacity is full",
        )

    remaining_quantity = (
        slot.max_quantity_capacity
        - slot.booked_quantity
    )

    if declared_quantity > remaining_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Declared quantity exceeds remaining slot capacity",
        )


def generate_unique_token(
    db: Session,
    centre_code: str,
) -> str:

    for _ in range(10):
        token = generate_booking_token(
            centre_code
        )

        exists = db.query(
            Booking
        ).filter(
            Booking.token == token
        ).first()

        if not exists:
            return token

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate booking token",
    )


def create_booking(
    db: Session,
    current_user: User,
    payload: BookingCreate,
) -> Booking:

    farmer = get_farmer_for_user(
        db,
        current_user,
    )

    crop = get_owned_crop(
        db,
        current_user,
        payload.crop_id,
    )

    slot = get_slot_for_booking(
        db,
        payload.slot_id,
    )

    ensure_no_active_crop_booking(
        db,
        farmer.id,
        crop.id,
    )

    ensure_capacity(
        slot,
        payload.declared_quantity,
    )

    token = generate_unique_token(
        db,
        slot.centre.code,
    )

    booking = Booking(
        farmer_id=farmer.id,
        crop_id=crop.id,
        centre_id=slot.centre_id,
        slot_id=slot.id,
        declared_quantity=payload.declared_quantity,
        quantity_unit=crop.quantity_unit,
        token=token,
        status=BookingStatus.CONFIRMED,
    )

    try:
        slot.booked_farmer_count += 1
        slot.booked_quantity += payload.declared_quantity

        db.add(booking)

        db.commit()
        db.refresh(booking)

        return booking

    except Exception:
        db.rollback()
        raise


def list_my_bookings(
    db: Session,
    current_user: User,
) -> list[Booking]:

    farmer = get_farmer_for_user(
        db,
        current_user,
    )

    return (
        db.query(Booking)
        .filter(
            Booking.farmer_id == farmer.id
        )
        .order_by(
            Booking.booked_at.desc()
        )
        .all()
    )


def get_my_booking(
    db: Session,
    current_user: User,
    booking_id: int,
) -> Booking:

    farmer = get_farmer_for_user(
        db,
        current_user,
    )

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.farmer_id == farmer.id,
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    return booking


def cancel_booking(
    db: Session,
    current_user: User,
    booking_id: int,
) -> Booking:

    booking = get_my_booking(
        db,
        current_user,
        booking_id,
    )

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed bookings can be cancelled",
        )

    slot = booking.slot

    if slot is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Booking slot could not be found",
        )

    try:
        slot.booked_farmer_count = max(
            slot.booked_farmer_count - 1,
            0,
        )

        slot.booked_quantity = max(
            slot.booked_quantity
            - booking.declared_quantity,
            0.0,
        )

        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = datetime.utcnow()

        db.commit()
        db.refresh(booking)

        return booking

    except Exception:
        db.rollback()
        raise


def build_booking_detail(
    booking: Booking,
) -> dict:

    return {
        "id": booking.id,

        "crop_id": booking.crop_id,
        "crop_name": booking.crop.crop_name,

        "centre_id": booking.centre_id,
        "centre_name": booking.centre.name,
        "centre_code": booking.centre.code,

        "slot_id": booking.slot_id,
        "slot_date": booking.slot.slot_date,
        "start_time": booking.slot.start_time,
        "end_time": booking.slot.end_time,

        "declared_quantity": booking.declared_quantity,
        "quantity_unit": booking.quantity_unit,

        "token": booking.token,
        "status": booking.status,

        "booked_at": booking.booked_at,
        "cancelled_at": booking.cancelled_at,
    }

def list_officer_centre_bookings(
    db: Session,
    current_user: User,
    booking_date: date | None = None,
    booking_status: BookingStatus | None = None,
) -> list[Booking]:

    officer = get_officer_for_user(
        db,
        current_user,
    )

    query = (
        db.query(Booking)
        .join(
            Slot,
            Booking.slot_id == Slot.id,
        )
        .filter(
            Booking.centre_id
            == officer.centre_id
        )
    )

    if booking_date is not None:
        query = query.filter(
            Slot.slot_date == booking_date
        )

    if booking_status is not None:
        query = query.filter(
            Booking.status == booking_status
        )

    return query.order_by(
        Slot.slot_date.asc(),
        Slot.start_time.asc(),
        Booking.booked_at.asc(),
    ).all()


def list_admin_bookings(
    db: Session,
    centre_id: int | None = None,
    booking_date: date | None = None,
    booking_status: BookingStatus | None = None,
) -> list[Booking]:

    query = (
        db.query(Booking)
        .join(
            Slot,
            Booking.slot_id == Slot.id,
        )
    )

    if centre_id is not None:
        query = query.filter(
            Booking.centre_id == centre_id
        )

    if booking_date is not None:
        query = query.filter(
            Slot.slot_date == booking_date
        )

    if booking_status is not None:
        query = query.filter(
            Booking.status == booking_status
        )

    return query.order_by(
        Slot.slot_date.desc(),
        Slot.start_time.asc(),
        Booking.booked_at.asc(),
    ).all()