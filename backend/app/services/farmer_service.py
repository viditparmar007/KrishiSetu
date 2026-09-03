from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.farmer import Farmer
from app.models.user import User


def get_farmer_for_user(db: Session, current_user: User) -> Farmer:
    farmer = (
        db.query(Farmer)
        .filter(Farmer.user_id == current_user.id)
        .first()
    )

    if farmer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found",
        )

    return farmer