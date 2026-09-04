from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.payment import PaymentOut
from app.services.payment_service import get_my_payment, list_my_payments

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


@router.get("", response_model=list[PaymentOut])
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    return list_my_payments(db, current_user)


@router.get("/{payment_id}", response_model=PaymentOut)
def my_payment_detail(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FARMER")),
):
    return get_my_payment(db, current_user, payment_id)