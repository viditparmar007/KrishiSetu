from datetime import datetime
from secrets import token_hex
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.enums import PaymentStatus, ProcurementDecision, ProcurementStage
from app.models.payment import Payment
from app.models.procurement import Procurement
from app.models.user import User
from app.schemas.payment import PaymentUpdate
from app.services.farmer_service import get_farmer_for_user
from app.services.officer_service import get_officer_for_user


def generate_payment_reference() -> str:
    return "KSPAY-" + datetime.utcnow().strftime("%Y%m%d") + "-" + token_hex(4).upper()


def create_payment_for_procurement(db: Session, procurement: Procurement):
    existing = db.query(Payment).filter(Payment.procurement_id == procurement.id).first()
    if existing:
        return existing

    if (
        procurement.stage != ProcurementStage.COMPLETED
        or procurement.decision != ProcurementDecision.APPROVED
        or procurement.total_value is None
    ):
        raise HTTPException(status_code=400, detail="Only approved completed procurement can create payment")

    payment = Payment(
        procurement_id=procurement.id,
        booking_id=procurement.booking_id,
        farmer_id=procurement.farmer_id,
        centre_id=procurement.centre_id,
        amount=procurement.total_value,
        status=PaymentStatus.PENDING,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def list_my_payments(db: Session, current_user: User):
    farmer = get_farmer_for_user(db, current_user)
    return db.query(Payment).filter(Payment.farmer_id == farmer.id).order_by(Payment.created_at.desc()).all()


def get_my_payment(db: Session, current_user: User, payment_id: int):
    farmer = get_farmer_for_user(db, current_user)
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.farmer_id == farmer.id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


def list_officer_payments(db: Session, current_user: User):
    officer = get_officer_for_user(db, current_user)
    return db.query(Payment).filter(Payment.centre_id == officer.centre_id).order_by(Payment.created_at.desc()).all()


def update_payment(db: Session, payment: Payment, payload: PaymentUpdate):
    if payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="A paid payment cannot be changed")

    if payload.status == PaymentStatus.PROCESSING:
        payment.status = PaymentStatus.PROCESSING
        payment.processing_at = datetime.utcnow()
        payment.failure_reason = None

    elif payload.status == PaymentStatus.PAID:
        if payment.status not in {PaymentStatus.PENDING, PaymentStatus.PROCESSING}:
            raise HTTPException(status_code=400, detail="Payment cannot move to PAID from current status")
        payment.status = PaymentStatus.PAID
        payment.reference_number = payload.reference_number or generate_payment_reference()
        payment.paid_at = datetime.utcnow()
        payment.failure_reason = None

    elif payload.status == PaymentStatus.FAILED:
        if not payload.failure_reason:
            raise HTTPException(status_code=400, detail="failure_reason is required")
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = payload.failure_reason
        payment.failed_at = datetime.utcnow()

    elif payload.status == PaymentStatus.PENDING:
        if payment.status != PaymentStatus.FAILED:
            raise HTTPException(status_code=400, detail="Only FAILED payment can be reset to PENDING")
        payment.status = PaymentStatus.PENDING
        payment.failure_reason = None
        payment.failed_at = None

    db.commit()
    db.refresh(payment)
    return payment


def update_officer_payment(db: Session, current_user: User, payment_id: int, payload: PaymentUpdate):
    officer = get_officer_for_user(db, current_user)
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.centre_id == officer.centre_id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return update_payment(db, payment, payload)


def list_admin_payments(db: Session):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()


def update_admin_payment(db: Session, payment_id: int, payload: PaymentUpdate):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return update_payment(db, payment, payload)