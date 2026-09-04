from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.farmer import Farmer
from app.models.enums import UserRole
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token


def register_farmer(db: Session, payload: RegisterRequest) -> User:
    existing = db.query(User).filter(User.phone == payload.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists",
        )

    user = User(
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.FARMER,
    )
    db.add(user)
    db.flush()  # gives `user` an id before we use it below

    farmer = Farmer(
        user_id=user.id,
        name=payload.name,
        state=payload.state,
        district=payload.district,
        village=payload.village,
        preferred_language=payload.preferred_language,
    )
    db.add(farmer)

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    invalid_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid phone number or password",
    )

    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise invalid_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive",
        )

    return user


def build_token_for_user(user: User) -> str:
    return create_access_token(subject=str(user.id), role=user.role.value)