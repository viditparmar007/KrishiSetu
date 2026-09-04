from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.enums import BookingStatus, CropStatus, ProcurementDecision, ProcurementStage, QueueStatus
from app.models.procurement import Procurement
from app.models.queue_entry import QueueEntry
from app.models.user import User
from app.schemas.procurement import (
    DocumentVerificationUpdate,
    ProcurementDecisionUpdate,
    QualityCheckUpdate,
    WeighingUpdate,
)
from app.services.farmer_service import get_farmer_for_user
from app.services.officer_service import get_officer_for_user
from app.models.enums import NotificationType
from app.services.notification_service import create_notification


def get_procurement_for_officer(db: Session, current_user: User, procurement_id: int):
    officer = get_officer_for_user(db, current_user)
    item = db.query(Procurement).filter(
        Procurement.id == procurement_id,
        Procurement.centre_id == officer.centre_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Procurement not found")
    return item


def start_procurement(db: Session, current_user: User, booking_id: int):
    officer = get_officer_for_user(db, current_user)
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.centre_id == officer.centre_id,
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="Booking must be checked in first")

    queue_entry = db.query(QueueEntry).filter(QueueEntry.booking_id == booking.id).first()
    if not queue_entry or queue_entry.status != QueueStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Queue processing must be completed first")

    existing = db.query(Procurement).filter(Procurement.booking_id == booking.id).first()
    if existing:
        return existing

    item = Procurement(
        booking_id=booking.id,
        farmer_id=booking.farmer_id,
        crop_id=booking.crop_id,
        centre_id=booking.centre_id,
        officer_id=officer.id,
        stage=ProcurementStage.DOCUMENT_VERIFICATION,
        quantity_unit=booking.quantity_unit,
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def verify_documents(db: Session, current_user: User, procurement_id: int, payload: DocumentVerificationUpdate):
    item = get_procurement_for_officer(db, current_user, procurement_id)
    if item.stage != ProcurementStage.DOCUMENT_VERIFICATION:
        raise HTTPException(status_code=400, detail="Wrong procurement stage")

    item.documents_verified = payload.verified
    item.document_notes = payload.notes
    item.documents_verified_at = datetime.utcnow()

    if payload.verified:
        item.stage = ProcurementStage.QUALITY_CHECK
    else:
        item.stage = ProcurementStage.REJECTED
        item.decision = ProcurementDecision.REJECTED
        item.rejection_reason = payload.notes or "Document verification failed"
        item.decided_at = datetime.utcnow()
        item.booking.status = BookingStatus.REJECTED

    db.commit()
    db.refresh(item)
    return item


def quality_check(db: Session, current_user: User, procurement_id: int, payload: QualityCheckUpdate):
    item = get_procurement_for_officer(db, current_user, procurement_id)
    if item.stage != ProcurementStage.QUALITY_CHECK:
        raise HTTPException(status_code=400, detail="Wrong procurement stage")

    item.quality_grade = payload.quality_grade
    item.quality_notes = payload.quality_notes
    item.quality_checked_at = datetime.utcnow()
    item.stage = ProcurementStage.WEIGHING

    db.commit()
    db.refresh(item)
    return item


def record_weighing(db: Session, current_user: User, procurement_id: int, payload: WeighingUpdate):
    item = get_procurement_for_officer(db, current_user, procurement_id)
    if item.stage != ProcurementStage.WEIGHING:
        raise HTTPException(status_code=400, detail="Wrong procurement stage")

    if payload.accepted_quantity > payload.measured_quantity:
        raise HTTPException(status_code=400, detail="Accepted quantity cannot exceed measured quantity")

    item.measured_quantity = payload.measured_quantity
    item.accepted_quantity = payload.accepted_quantity
    item.weighed_at = datetime.utcnow()
    item.stage = ProcurementStage.DECISION

    db.commit()
    db.refresh(item)
    return item


def decide_procurement(db: Session, current_user: User, procurement_id: int, payload: ProcurementDecisionUpdate):
    item = get_procurement_for_officer(db, current_user, procurement_id)
    if item.stage != ProcurementStage.DECISION:
        raise HTTPException(status_code=400, detail="Wrong procurement stage")

    if payload.decision == ProcurementDecision.REJECTED:
        if not payload.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")

        item.decision = ProcurementDecision.REJECTED
        item.rejection_reason = payload.rejection_reason
        item.decided_at = datetime.utcnow()
        item.stage = ProcurementStage.REJECTED
        item.booking.status = BookingStatus.REJECTED
        db.commit()
        db.refresh(item)
        from app.services.payment_service import create_payment_for_procurement
        create_payment_for_procurement(db, item)
        return item

    if payload.rate_per_unit is None:
        raise HTTPException(status_code=400, detail="rate_per_unit is required for approval")

    item.decision = ProcurementDecision.APPROVED
    item.rate_per_unit = payload.rate_per_unit
    item.total_value = round(item.accepted_quantity * payload.rate_per_unit, 2)
    item.decided_at = datetime.utcnow()
    item.stage = ProcurementStage.COMPLETED
    item.completed_at = datetime.utcnow()
    item.booking.status = BookingStatus.COMPLETED
    item.booking.crop.status = CropStatus.PROCURED

    db.commit()
    db.refresh(item)
    return item


def list_officer_procurements(db: Session, current_user: User):
    officer = get_officer_for_user(db, current_user)
    return db.query(Procurement).filter(
        Procurement.centre_id == officer.centre_id
    ).order_by(Procurement.started_at.desc()).all()


def list_my_procurements(db: Session, current_user: User):
    farmer = get_farmer_for_user(db, current_user)
    return db.query(Procurement).filter(
        Procurement.farmer_id == farmer.id
    ).order_by(Procurement.started_at.desc()).all()


def get_my_procurement(db: Session, current_user: User, procurement_id: int):
    farmer = get_farmer_for_user(db, current_user)
    item = db.query(Procurement).filter(
        Procurement.id == procurement_id,
        Procurement.farmer_id == farmer.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Procurement not found")
    return item
    create_notification(
    db=db,
    user_id=item.booking.farmer.user_id,
    notification_type=NotificationType.PROCUREMENT,
    title="Procurement approved",
    message=f"Your procurement was approved for ₹{item.total_value:.2f}",
    entity_type="procurement",
    entity_id=item.id,
)

    create_notification(
    db=db,
    user_id=item.booking.farmer.user_id,
    notification_type=NotificationType.PROCUREMENT,
    title="Procurement rejected",
    message=item.rejection_reason or "Your procurement was rejected.",
    entity_type="procurement",
    entity_id=item.id,
)



