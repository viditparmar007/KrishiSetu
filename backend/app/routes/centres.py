from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User

from app.schemas.centre import CentreOut
from app.schemas.slot import SlotOut

from app.services.centre_service import (
    get_centre_or_404,
    list_active_centres,
)

from app.services.slot_service import (
    list_farmer_slots,
)


router = APIRouter(
    prefix="/api/v1/centres",
    tags=["Centres"],
)


@router.get(
    "",
    response_model=list[CentreOut],
)
def list_centres(
    state: str | None = Query(default=None),
    district: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return list_active_centres(
        db,
        state,
        district,
    )


@router.get(
    "/{centre_id}",
    response_model=CentreOut,
)
def centre_details(
    centre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_centre_or_404(
        db,
        centre_id,
    )


@router.get(
    "/{centre_id}/slots",
    response_model=list[SlotOut],
)
def centre_slots(
    centre_id: int,
    slot_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return list_farmer_slots(
        db,
        centre_id,
        slot_date,
    )