

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmUpdate
from app.services.farmer_service import get_farmer_for_user


def create_farm(db: Session, current_user: User, payload: FarmCreate) -> Farm:
    farmer = get_farmer_for_user(db, current_user)
    farm = Farm(farmer_id=farmer.id, **payload.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


def list_my_farms(db: Session, current_user: User) -> list[Farm]:
    farmer = get_farmer_for_user(db, current_user)
    return (
        db.query(Farm)
        .filter(Farm.farmer_id == farmer.id)
        .order_by(Farm.id.desc())
        .all()
    )


def get_my_farm(db: Session, current_user: User, farm_id: int) -> Farm:
    farmer = get_farmer_for_user(db, current_user)
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.farmer_id == farmer.id)
        .first()
    )

    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    return farm


def update_my_farm(
    db: Session,
    current_user: User,
    farm_id: int,
    payload: FarmUpdate,
) -> Farm:
    farm = get_my_farm(db, current_user, farm_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)
    return farm


def delete_my_farm(db: Session, current_user: User, farm_id: int) -> None:
    farm = get_my_farm(db, current_user, farm_id)
    db.delete(farm)
    db.commit()