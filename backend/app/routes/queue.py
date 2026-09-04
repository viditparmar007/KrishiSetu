from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.queue import CentreQueueStatusOut, FarmerQueueStatusOut
from app.services.queue_service import (
    build_farmer_queue_status,
    check_in_booking,
    get_active_farmer_queue,
    get_centre_queue_status,
)

router = APIRouter(prefix="/api/v1/queue", tags=["Queue"])


@router.post("/check-in/{booking_id}", response_model=FarmerQueueStatusOut, status_code=status.HTTP_201_CREATED)
def farmer_check_in(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    entry = check_in_booking(db, current_user, booking_id)
    return build_farmer_queue_status(db, entry)


@router.get("/me", response_model=FarmerQueueStatusOut)
def my_queue_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    entry = get_active_farmer_queue(db, current_user)
    return build_farmer_queue_status(db, entry)


@router.get("/centres/{centre_id}/status", response_model=CentreQueueStatusOut)
def centre_queue_status(
    centre_id: int,
    queue_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_centre_queue_status(db, centre_id, queue_date or date.today())