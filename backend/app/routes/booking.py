from fastapi import (
    APIRouter,
    Depends,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role

from app.models.user import User

from app.schemas.booking import (
    BookingCreate,
    BookingDetailOut,
    BookingOut,
)

from app.services.booking_service import (
    build_booking_detail,
    cancel_booking,
    create_booking,
    get_my_booking,
    list_my_bookings,
)


router = APIRouter(
    prefix="/api/v1/bookings",
    tags=["Bookings"],
)


@router.post(
    "",
    response_model=BookingOut,
    status_code=status.HTTP_201_CREATED,
)
def create_booking_route(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return create_booking(
        db,
        current_user,
        payload,
    )


@router.get(
    "",
    response_model=list[BookingOut],
)
def list_bookings_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return list_my_bookings(
        db,
        current_user,
    )


@router.get(
    "/{booking_id}",
    response_model=BookingDetailOut,
)
def get_booking_route(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    booking = get_my_booking(
        db,
        current_user,
        booking_id,
    )

    return build_booking_detail(
        booking
    )


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingOut,
)
def cancel_booking_route(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return cancel_booking(
        db,
        current_user,
        booking_id,
    )