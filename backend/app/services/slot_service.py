from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.enums import (
    CentreStatus,
    SlotStatus,
)

from app.models.slot import Slot

from app.schemas.slot import (
    SlotCreate,
    SlotUpdate,
)

from app.services.centre_service import (
    get_centre_or_404,
)

from app.services.officer_service import (
    get_officer_for_user,
)


def validate_slot(
    centre,
    slot_date,
    start_time,
    end_time,
):

    if slot_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Slot date cannot be in the past",
        )

    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    if (
        start_time < centre.opening_time
        or end_time > centre.closing_time
    ):
        raise HTTPException(
            status_code=400,
            detail="Slot must be inside centre working hours",
        )


def create_slot_for_centre(
    db: Session,
    centre_id: int,
    payload: SlotCreate,
):

    centre = get_centre_or_404(
        db,
        centre_id,
        include_inactive=True,
    )

    if centre.status != CentreStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="Cannot create slots for inactive centre",
        )

    validate_slot(
        centre,
        payload.slot_date,
        payload.start_time,
        payload.end_time,
    )

    duplicate = db.query(
        Slot
    ).filter(
        Slot.centre_id == centre_id,
        Slot.slot_date == payload.slot_date,
        Slot.start_time == payload.start_time,
        Slot.end_time == payload.end_time,
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="This slot already exists",
        )

    slot = Slot(
        centre_id=centre_id,
        **payload.model_dump(),
    )

    db.add(slot)
    db.commit()
    db.refresh(slot)

    return slot


def list_farmer_slots(
    db: Session,
    centre_id: int,
    slot_date: date | None = None,
):

    get_centre_or_404(
        db,
        centre_id,
    )

    query = db.query(
        Slot
    ).filter(
        Slot.centre_id == centre_id,
        Slot.status == SlotStatus.OPEN,
        Slot.slot_date >= date.today(),
    )

    if slot_date:
        query = query.filter(
            Slot.slot_date == slot_date
        )

    slots = query.order_by(
        Slot.slot_date,
        Slot.start_time,
    ).all()

    return [
        slot
        for slot in slots
        if slot.is_available
    ]


def get_slot_or_404(
    db: Session,
    slot_id: int,
):

    slot = db.query(
        Slot
    ).filter(
        Slot.id == slot_id
    ).first()

    if slot is None:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    return slot


def update_slot(
    db: Session,
    slot_id: int,
    payload: SlotUpdate,
):

    slot = get_slot_or_404(
        db,
        slot_id,
    )

    changes = payload.model_dump(
        exclude_unset=True
    )

    if (
        "max_farmer_capacity" in changes
        and changes["max_farmer_capacity"]
        < slot.booked_farmer_count
    ):
        raise HTTPException(
            status_code=400,
            detail="Capacity cannot be below existing bookings",
        )

    if (
        "max_quantity_capacity" in changes
        and changes["max_quantity_capacity"]
        < slot.booked_quantity
    ):
        raise HTTPException(
            status_code=400,
            detail="Quantity capacity cannot be below existing bookings",
        )

    for key, value in changes.items():
        setattr(slot, key, value)

    db.commit()
    db.refresh(slot)

    return slot