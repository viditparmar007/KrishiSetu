from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role

from app.models.user import User

from app.schemas.centre import CentreOut
from app.schemas.officer import OfficerOut

from app.schemas.slot import (
    SlotCreate,
    SlotOut,
    SlotUpdate,
)

from app.services.centre_service import (
    get_centre_or_404,
)

from app.services.officer_service import (
    get_officer_for_user,
)

from app.services.slot_service import (
    create_slot_for_centre,
    update_slot,
)


router = APIRouter(
    prefix="/api/v1/officer",
    tags=["Officer"],
)


@router.get(
    "/me",
    response_model=OfficerOut,
)
def officer_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    return get_officer_for_user(
        db,
        current_user,
    )


@router.get(
    "/centre",
    response_model=CentreOut,
)
def officer_centre(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    return get_centre_or_404(
        db,
        officer.centre_id,
        include_inactive=True,
    )


@router.post(
    "/slots",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
)
def create_officer_slot(
    payload: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    return create_slot_for_centre(
        db,
        officer.centre_id,
        payload,
    )


@router.put(
    "/slots/{slot_id}",
    response_model=SlotOut,
)
def officer_update_slot(
    slot_id: int,
    payload: SlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    slot = update_slot(
        db,
        slot_id,
        payload,
    )

    if slot.centre_id != officer.centre_id:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    return slot