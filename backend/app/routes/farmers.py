from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.farmer import Farmer
from app.models.user import User
from app.schemas.auth import FarmerOut

router = APIRouter(prefix="/api/v1/farmers", tags=["Farmers"])


@router.get("/me", response_model=FarmerOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found",
        )
    return profile
