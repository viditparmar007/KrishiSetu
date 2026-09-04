from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.procurement import ProcurementOut
from app.services.procurement_service import get_my_procurement, list_my_procurements

router = APIRouter(prefix="/api/v1/procurements", tags=["Procurements"])


@router.get("", response_model=list[ProcurementOut])
def my_procurements(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    return list_my_procurements(db, current_user)


@router.get("/{procurement_id}", response_model=ProcurementOut)
def my_procurement_detail(
    procurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    return get_my_procurement(db, current_user, procurement_id)