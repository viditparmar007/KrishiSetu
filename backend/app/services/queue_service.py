from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.enums import BookingStatus, QueueStatus
from app.models.queue_entry import QueueEntry
from app.models.slot import Slot
from app.models.user import User
from app.services.booking_service import get_my_booking
from app.services.centre_service import get_centre_or_404
from app.services.farmer_service import get_farmer_for_user
from app.services.officer_service import get_officer_for_user
from app.models.enums import NotificationType
from app.services.notification_service import create_notification


CHECKIN_EARLY_MINUTES = 60
CHECKIN_GRACE_MINUTES = 30
DEFAULT_SERVICE_MINUTES = 10.0

ACTIVE_QUEUE_STATUSES = {
    QueueStatus.WAITING,
    QueueStatus.CALLED,
    QueueStatus.PROCESSING,
}


def validate_checkin_window(slot: Slot) -> None:
    now = datetime.now()
    slot_start = datetime.combine(slot.slot_date, slot.start_time)
    slot_end = datetime.combine(slot.slot_date, slot.end_time)
    allowed_from = slot_start - timedelta(minutes=CHECKIN_EARLY_MINUTES)
    allowed_until = slot_end + timedelta(minutes=CHECKIN_GRACE_MINUTES)

    if now < allowed_from:
        raise HTTPException(status_code=400, detail="Check-in is not open yet for this slot")
    if now > allowed_until:
        raise HTTPException(status_code=400, detail="Check-in window has closed for this slot")


def get_next_queue_number(db: Session, centre_id: int, queue_date: date) -> int:
    current_max = (
        db.query(func.max(QueueEntry.queue_number))
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.queue_date == queue_date,
        )
        .scalar()
    )
    return (current_max or 0) + 1


def get_average_service_minutes(db: Session, centre_id: int, queue_date: date) -> float:
    completed = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.queue_date == queue_date,
            QueueEntry.status == QueueStatus.COMPLETED,
            QueueEntry.processing_started_at.is_not(None),
            QueueEntry.completed_at.is_not(None),
        )
        .order_by(QueueEntry.completed_at.desc())
        .limit(20)
        .all()
    )

    durations = []
    for entry in completed:
        minutes = (entry.completed_at - entry.processing_started_at).total_seconds() / 60
        if minutes > 0:
            durations.append(minutes)

    if not durations:
        return DEFAULT_SERVICE_MINUTES

    return round(sum(durations) / len(durations), 1)


def get_current_queue_entry(db: Session, centre_id: int, queue_date: date):
    for q_status in (QueueStatus.PROCESSING, QueueStatus.CALLED, QueueStatus.WAITING):
        entry = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.centre_id == centre_id,
                QueueEntry.queue_date == queue_date,
                QueueEntry.status == q_status,
            )
            .order_by(QueueEntry.queue_number.asc())
            .first()
        )
        if entry:
            return entry
    return None


def check_in_booking(db: Session, current_user: User, booking_id: int):
    booking = get_my_booking(db, current_user, booking_id)

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Only confirmed bookings can check in")

    existing = db.query(QueueEntry).filter(QueueEntry.booking_id == booking.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This booking is already checked in")

    validate_checkin_window(booking.slot)

    entry = QueueEntry(
        booking_id=booking.id,
        farmer_id=booking.farmer_id,
        centre_id=booking.centre_id,
        slot_id=booking.slot_id,
        queue_date=booking.slot.slot_date,
        queue_number=get_next_queue_number(db, booking.centre_id, booking.slot.slot_date),
        status=QueueStatus.WAITING,
    )

    try:
        booking.status = BookingStatus.CHECKED_IN
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Queue number conflict. Try again")


def get_active_farmer_queue(db: Session, current_user: User):
    farmer = get_farmer_for_user(db, current_user)
    entry = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.farmer_id == farmer.id,
            QueueEntry.status.in_(list(ACTIVE_QUEUE_STATUSES)),
        )
        .order_by(QueueEntry.checked_in_at.desc())
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No active queue entry found")
    return entry


def count_farmers_ahead(db: Session, entry: QueueEntry) -> int:
    if entry.status != QueueStatus.WAITING:
        return 0
    return (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == entry.centre_id,
            QueueEntry.queue_date == entry.queue_date,
            QueueEntry.queue_number < entry.queue_number,
            QueueEntry.status.in_(list(ACTIVE_QUEUE_STATUSES)),
        )
        .count()
    )


def build_farmer_queue_status(db: Session, entry: QueueEntry):
    farmers_ahead = count_farmers_ahead(db, entry)
    avg = get_average_service_minutes(db, entry.centre_id, entry.queue_date)

    if entry.status == QueueStatus.WAITING:
        queue_position = farmers_ahead + 1
        eta = round(farmers_ahead * avg)
    else:
        queue_position = 0
        eta = 0

    current = get_current_queue_entry(db, entry.centre_id, entry.queue_date)

    return {
        "queue_entry_id": entry.id,
        "booking_id": entry.booking_id,
        "token": entry.booking.token,
        "centre_id": entry.centre_id,
        "centre_name": entry.booking.centre.name,
        "queue_date": entry.queue_date,
        "queue_number": entry.queue_number,
        "queue_status": entry.status,
        "queue_position": queue_position,
        "farmers_ahead": farmers_ahead,
        "estimated_wait_minutes": eta,
        "average_service_minutes": avg,
        "current_token": current.booking.token if current else None,
        "checked_in_at": entry.checked_in_at,
        "called_at": entry.called_at,
        "processing_started_at": entry.processing_started_at,
    }


def get_centre_queue_status(db: Session, centre_id: int, queue_date: date):
    centre = get_centre_or_404(db, centre_id)
    entries = db.query(QueueEntry).filter(
        QueueEntry.centre_id == centre_id,
        QueueEntry.queue_date == queue_date,
    ).all()
    current = get_current_queue_entry(db, centre_id, queue_date)

    def count_status(value):
        return sum(1 for e in entries if e.status == value)

    return {
        "centre_id": centre.id,
        "centre_name": centre.name,
        "queue_date": queue_date,
        "current_token": current.booking.token if current else None,
        "waiting_count": count_status(QueueStatus.WAITING),
        "called_count": count_status(QueueStatus.CALLED),
        "processing_count": count_status(QueueStatus.PROCESSING),
        "completed_count": count_status(QueueStatus.COMPLETED),
        "no_show_count": count_status(QueueStatus.NO_SHOW),
        "average_service_minutes": get_average_service_minutes(db, centre_id, queue_date),
    }


def get_officer_queue(db: Session, current_user: User, queue_date: date):
    officer = get_officer_for_user(db, current_user)
    entries = db.query(QueueEntry).filter(
        QueueEntry.centre_id == officer.centre_id,
        QueueEntry.queue_date == queue_date,
    ).order_by(QueueEntry.queue_number.asc()).all()

    return [
        {
            "queue_entry_id": e.id,
            "booking_id": e.booking_id,
            "token": e.booking.token,
            "crop_id": e.booking.crop_id,
            "crop_name": e.booking.crop.crop_name,
            "declared_quantity": e.booking.declared_quantity,
            "quantity_unit": e.booking.quantity_unit,
            "queue_number": e.queue_number,
            "queue_date": e.queue_date,
            "status": e.status,
            "farmer_name": e.booking.farmer.name if (e.booking and e.booking.farmer) else "Farmer",
            "farmer_phone": e.booking.farmer.user.phone if (e.booking and e.booking.farmer and e.booking.farmer.user) else "",
            "checked_in_at": e.checked_in_at,
            "called_at": e.called_at,
            "processing_started_at": e.processing_started_at,
            "completed_at": e.completed_at,
            "no_show_at": e.no_show_at,
        }
        for e in entries
    ]


def get_queue_entry_for_officer(db: Session, current_user: User, queue_entry_id: int):
    officer = get_officer_for_user(db, current_user)
    entry = db.query(QueueEntry).filter(
        QueueEntry.id == queue_entry_id,
        QueueEntry.centre_id == officer.centre_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    return entry


def call_next_farmer(db: Session, current_user: User, queue_date: date):
    officer = get_officer_for_user(db, current_user)
    current = db.query(QueueEntry).filter(
        QueueEntry.centre_id == officer.centre_id,
        QueueEntry.queue_date == queue_date,
        QueueEntry.status.in_([QueueStatus.CALLED, QueueStatus.PROCESSING]),
    ).first()

    if current:
        raise HTTPException(status_code=400, detail="Finish the current token before calling next")

    next_entry = db.query(QueueEntry).filter(
        QueueEntry.centre_id == officer.centre_id,
        QueueEntry.queue_date == queue_date,
        QueueEntry.status == QueueStatus.WAITING,
    ).order_by(QueueEntry.queue_number.asc()).first()

    if not next_entry:
        raise HTTPException(status_code=404, detail="No farmers are waiting")

    next_entry.status = QueueStatus.CALLED
    next_entry.called_at = datetime.utcnow()
    db.commit()
    db.refresh(next_entry)
    return next_entry


def start_processing(db: Session, current_user: User, queue_entry_id: int):
    entry = get_queue_entry_for_officer(db, current_user, queue_entry_id)
    if entry.status != QueueStatus.CALLED:
        raise HTTPException(status_code=400, detail="Only a CALLED entry can start processing")
    entry.status = QueueStatus.PROCESSING
    entry.processing_started_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


def complete_queue_entry(db: Session, current_user: User, queue_entry_id: int):
    entry = get_queue_entry_for_officer(db, current_user, queue_entry_id)
    if entry.status != QueueStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Only a PROCESSING entry can be completed")
    entry.status = QueueStatus.COMPLETED
    entry.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry

def mark_queue_no_show(db: Session, current_user: User, queue_entry_id: int):
    entry = get_queue_entry_for_officer(db, current_user, queue_entry_id)
    if entry.status not in {QueueStatus.WAITING, QueueStatus.CALLED}:
        raise HTTPException(status_code=400, detail="Only WAITING or CALLED entries can be NO_SHOW")
    entry.status = QueueStatus.NO_SHOW
    entry.no_show_at = datetime.utcnow()
    entry.booking.status = BookingStatus.NO_SHOW
    db.commit()
    db.refresh(entry)
    return entry


def officer_check_in_booking(db: Session, current_user: User, booking_id: int):
    officer = get_officer_for_user(db, current_user)
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.centre_id == officer.centre_id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found for this centre")

    existing = db.query(QueueEntry).filter(QueueEntry.booking_id == booking.id).first()
    if existing:
        return existing

    today = date.today()
    entry = QueueEntry(
        booking_id=booking.id,
        farmer_id=booking.farmer_id,
        centre_id=booking.centre_id,
        slot_id=booking.slot_id,
        queue_date=today,
        queue_number=get_next_queue_number(db, booking.centre_id, today),
        status=QueueStatus.WAITING,
    )
    booking.status = BookingStatus.CHECKED_IN
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def create_officer_manual_entry(db: Session, current_user: User, payload):
    from datetime import time
    from app.models.farmer import Farmer
    from app.models.crop import Crop
    from app.models.farm import Farm
    from app.models.slot import Slot
    from app.models.user import User as AppUser
    from app.models.enums import UserRole
    from app.utils.security import hash_password

    officer = get_officer_for_user(db, current_user)
    today = date.today()

    phone = payload.farmer_phone.strip()
    user = db.query(AppUser).filter(AppUser.phone == phone).first()
    if not user:
        user = AppUser(
            phone=phone,
            password_hash=hash_password("Farmer@123"),
            role=UserRole.FARMER,
            is_active=True,
        )
        db.add(user)
        db.flush()

    farmer = db.query(Farmer).filter(Farmer.user_id == user.id).first()
    if not farmer:
        farmer = Farmer(
            user_id=user.id,
            name=payload.farmer_name.strip(),
            state=officer.centre.state if officer.centre else "Uttar Pradesh",
            district=officer.centre.district if officer.centre else "Saharanpur",
            village=payload.village or "Local Village",
        )
        db.add(farmer)
        db.flush()

    farm = db.query(Farm).filter(Farm.farmer_id == farmer.id).first()
    if not farm:
        farm = Farm(
            farmer_id=farmer.id,
            farm_name="Main Farm",
            state=farmer.state,
            district=farmer.district,
            village=farmer.village,
            area=5.0,
            area_unit="acre",
        )
        db.add(farm)
        db.flush()

    from app.models.enums import CropStatus
    crop = db.query(Crop).filter(
        Crop.farm_id == farm.id,
        Crop.crop_name.ilike(payload.crop_name.strip())
    ).first()
    if not crop:
        crop = Crop(
            farm_id=farm.id,
            crop_name=payload.crop_name.strip(),
            season="Current",
            expected_quantity=payload.declared_quantity,
            quantity_unit=payload.quantity_unit,
            status=CropStatus.HARVEST_READY,
        )
        db.add(crop)
        db.flush()

    from app.models.enums import SlotStatus
    slot = db.query(Slot).filter(
        Slot.centre_id == officer.centre_id,
        Slot.slot_date == today,
    ).first()
    if not slot:
        slot = Slot(
            centre_id=officer.centre_id,
            slot_date=today,
            start_time=time(9, 0),
            end_time=time(18, 0),
            max_farmer_capacity=100,
            max_quantity_capacity=5000.0,
            booked_farmer_count=1,
            booked_quantity=payload.declared_quantity,
            status=SlotStatus.OPEN,
        )
        db.add(slot)
        db.flush()
    else:
        slot.booked_farmer_count += 1
        slot.booked_quantity += payload.declared_quantity

    next_num = get_next_queue_number(db, officer.centre_id, today)
    token_code = f"T-{next_num:03d}"
    booking = Booking(
        farmer_id=farmer.id,
        crop_id=crop.id,
        centre_id=officer.centre_id,
        slot_id=slot.id,
        token=token_code,
        declared_quantity=payload.declared_quantity,
        quantity_unit=payload.quantity_unit,
        status=BookingStatus.CHECKED_IN,
    )
    db.add(booking)
    db.flush()

    entry = QueueEntry(
        booking_id=booking.id,
        farmer_id=farmer.id,
        centre_id=officer.centre_id,
        slot_id=slot.id,
        queue_date=today,
        queue_number=next_num,
        status=QueueStatus.WAITING,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


