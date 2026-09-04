from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.centre import ProcurementCentre
from app.models.enums import CentreStatus
from app.schemas.centre import CentreCreate, CentreUpdate


def get_centre_or_404(
    db: Session,
    centre_id: int,
    include_inactive: bool = False,
):

    query = db.query(
        ProcurementCentre
    ).filter(
        ProcurementCentre.id == centre_id
    )

    if not include_inactive:
        query = query.filter(
            ProcurementCentre.status
            == CentreStatus.ACTIVE
        )

    centre = query.first()

    if centre is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement centre not found",
        )

    return centre


def list_active_centres(
    db: Session,
    state: str | None = None,
    district: str | None = None,
):

    query = db.query(
        ProcurementCentre
    ).filter(
        ProcurementCentre.status
        == CentreStatus.ACTIVE
    )

    if state:
        query = query.filter(
            ProcurementCentre.state.ilike(state)
        )

    if district:
        query = query.filter(
            ProcurementCentre.district.ilike(district)
        )

    return query.order_by(
        ProcurementCentre.name.asc()
    ).all()


def list_all_centres(db: Session):

    return db.query(
        ProcurementCentre
    ).order_by(
        ProcurementCentre.id.desc()
    ).all()


def create_centre(
    db: Session,
    payload: CentreCreate,
):

    duplicate = db.query(
        ProcurementCentre
    ).filter(
        ProcurementCentre.code == payload.code
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="A procurement centre with this code already exists",
        )

    if payload.closing_time <= payload.opening_time:
        raise HTTPException(
            status_code=400,
            detail="Closing time must be after opening time",
        )

    centre = ProcurementCentre(
        **payload.model_dump()
    )

    db.add(centre)
    db.commit()
    db.refresh(centre)

    return centre


def update_centre(
    db: Session,
    centre_id: int,
    payload: CentreUpdate,
):

    centre = get_centre_or_404(
        db,
        centre_id,
        include_inactive=True,
    )

    changes = payload.model_dump(
        exclude_unset=True
    )

    final_opening = changes.get(
        "opening_time",
        centre.opening_time,
    )

    final_closing = changes.get(
        "closing_time",
        centre.closing_time,
    )

    if final_closing <= final_opening:
        raise HTTPException(
            status_code=400,
            detail="Closing time must be after opening time",
        )

    for key, value in changes.items():
        setattr(centre, key, value)

    db.commit()
    db.refresh(centre)

    return centre