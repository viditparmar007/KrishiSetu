from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.farmer import Farmer
from app.models.user import User
from app.schemas.auth import FarmerOut, FarmerUpdateRequest
from app.utils.security import hash_password, verify_password

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


@router.put("/me", response_model=FarmerOut)
def update_my_profile(
    payload: FarmerUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found",
        )

    if payload.name is not None:
        profile.name = payload.name
    if payload.state is not None:
        profile.state = payload.state
    if payload.district is not None:
        profile.district = payload.district
    if payload.village is not None:
        profile.village = payload.village
    if payload.preferred_language is not None:
        profile.preferred_language = payload.preferred_language

    if payload.password:
        if payload.current_password and not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        current_user.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(profile)
    return profile

