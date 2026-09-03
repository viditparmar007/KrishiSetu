from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import FarmerDashboardOut
from app.services.dashboard_service import build_farmer_dashboard

router = APIRouter(prefix="/api/v1", tags=["Dashboard"])


@router.get("/dashboard/farmer", response_model=FarmerDashboardOut)
def farmer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_farmer_dashboard(db, current_user)