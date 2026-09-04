from fastapi import (
    APIRouter,
    Depends,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role

from app.models.user import User

from app.schemas.centre import (
    CentreCreate,
    CentreOut,
    CentreUpdate,
)

from app.schemas.officer import (
    OfficerCreate,
    OfficerOut,
)

from app.schemas.slot import (
    SlotCreate,
    SlotOut,
)

from app.services.centre_service import (
    create_centre,
    list_all_centres,
    update_centre,
)

from app.services.officer_service import (
    create_officer,
    list_officers,
)

from app.services.slot_service import (
    create_slot_for_centre,
)


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)


@router.get(
    "/centres",
    response_model=list[CentreOut],
)
def admin_centres(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return list_all_centres(db)


@router.post(
    "/centres",
    response_model=CentreOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_centre(
    payload: CentreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_centre(
        db,
        payload,
    )


@router.put(
    "/centres/{centre_id}",
    response_model=CentreOut,
)
def admin_update_centre(
    centre_id: int,
    payload: CentreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return update_centre(
        db,
        centre_id,
        payload,
    )


@router.get(
    "/officers",
    response_model=list[OfficerOut],
)
def admin_officers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return list_officers(db)


@router.post(
    "/officers",
    response_model=OfficerOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_officer(
    payload: OfficerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_officer(
        db,
        payload,
    )


@router.post(
    "/centres/{centre_id}/slots",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_slot(
    centre_id: int,
    payload: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_slot_for_centre(
        db,
        centre_id,
        payload,
    )