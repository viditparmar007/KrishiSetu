from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.models.user import User
from app.schemas.crop import CropCreate, CropUpdate
from app.services.farm_service import get_my_farm


def create_crop(
    db: Session,
    current_user: User,
    farm_id: int,
    payload: CropCreate,
) -> Crop:
    farm = get_my_farm(db, current_user, farm_id)
    crop = Crop(farm_id=farm.id, **payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


def list_crops_for_farm(
    db: Session, current_user: User, farm_id: int
) -> list[Crop]:
    farm = get_my_farm(db, current_user, farm_id)
    return (
        db.query(Crop)
        .filter(Crop.farm_id == farm.id)
        .order_by(Crop.id.desc())
        .all()
    )


def list_my_crops(db: Session, current_user: User) -> list[Crop]:
    return (
        db.query(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .join(Farmer, Farm.farmer_id == Farmer.id)
        .filter(Farmer.user_id == current_user.id)
        .order_by(Crop.id.desc())
        .all()
    )


def get_my_crop(db: Session, current_user: User, crop_id: int) -> Crop:
    crop = (
        db.query(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .join(Farmer, Farm.farmer_id == Farmer.id)
        .filter(Crop.id == crop_id, Farmer.user_id == current_user.id)
        .first()
    )

    if crop is None:
        raise HTTPException(status_code=404, detail="Crop not found")

    return crop


def update_my_crop(
    db: Session,
    current_user: User,
    crop_id: int,
    payload: CropUpdate,
) -> Crop:
    crop = get_my_crop(db, current_user, crop_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(crop, field, value)

    db.commit()
    db.refresh(crop)
    return crop


def delete_my_crop(db: Session, current_user: User, crop_id: int) -> None:
    crop = get_my_crop(db, current_user, crop_id)
    db.delete(crop)
    db.commit()