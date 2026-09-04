from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.officer import Officer
from app.models.user import User
from app.schemas.officer import OfficerCreate

from app.services.centre_service import (
    get_centre_or_404,
)

from app.utils.security import hash_password


def get_officer_for_user(
    db: Session,
    current_user: User,
):

    officer = db.query(
        Officer
    ).filter(
        Officer.user_id == current_user.id
    ).first()

    if officer is None or not officer.is_active:
        raise HTTPException(
            status_code=404,
            detail="Officer profile not found",
        )

    return officer


def create_officer(
    db: Session,
    payload: OfficerCreate,
):

    existing_user = db.query(
        User
    ).filter(
        User.phone == payload.phone
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this phone number already exists",
        )

    existing_code = db.query(
        Officer
    ).filter(
        Officer.employee_code
        == payload.employee_code
    ).first()

    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Employee code already exists",
        )

    centre = get_centre_or_404(
        db,
        payload.centre_id,
        include_inactive=True,
    )

    user = User(
        phone=payload.phone,
        password_hash=hash_password(
            payload.password
        ),
        role=UserRole.OFFICER,
        is_active=True,
    )

    db.add(user)
    db.flush()

    officer = Officer(
        user_id=user.id,
        centre_id=centre.id,
        name=payload.name,
        employee_code=payload.employee_code,
        is_active=True,
    )

    db.add(officer)

    db.commit()
    db.refresh(officer)

    return officer


def list_officers(db: Session):

    return db.query(
        Officer
    ).order_by(
        Officer.id.desc()
    ).all()