from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.centre import ProcurementCentre
from app.models.enums import (
    BookingStatus,
    CentreStatus,
    PaymentStatus,
    ProcurementStage,
    QueueStatus,
)
from app.models.farmer import Farmer
from app.models.officer import Officer
from app.models.payment import Payment
from app.models.procurement import Procurement
from app.models.queue_entry import QueueEntry
from app.models.user import User

from app.services.officer_service import get_officer_for_user
from app.services.queue_service import get_average_service_minutes


def count_payment_status(
    db: Session,
    payment_status: PaymentStatus,
    centre_id: int | None = None,
) -> int:
    query = db.query(Payment).filter(
        Payment.status == payment_status
    )

    if centre_id is not None:
        query = query.filter(
            Payment.centre_id == centre_id
        )

    return query.count()


def officer_analytics(
    db: Session,
    current_user: User,
):
    officer = get_officer_for_user(
        db,
        current_user,
    )

    today = date.today()

    centre = (
        db.query(ProcurementCentre)
        .filter(
            ProcurementCentre.id == officer.centre_id
        )
        .first()
    )

    bookings_today = (
        db.query(Booking)
        .join(Booking.slot)
        .filter(
            Booking.centre_id == officer.centre_id,
        )
        .filter(
            Booking.slot.has(slot_date=today)
        )
        .count()
    )

    checked_in_today = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == officer.centre_id,
            QueueEntry.queue_date == today,
        )
        .count()
    )

    def queue_count(queue_status):
        return (
            db.query(QueueEntry)
            .filter(
                QueueEntry.centre_id == officer.centre_id,
                QueueEntry.queue_date == today,
                QueueEntry.status == queue_status,
            )
            .count()
        )

    procurements = (
        db.query(Procurement)
        .filter(
            Procurement.centre_id == officer.centre_id,
            Procurement.stage == ProcurementStage.COMPLETED,
        )
        .all()
    )

    procured_quantity = round(
        sum(
            item.accepted_quantity or 0
            for item in procurements
        ),
        2,
    )

    procurement_value = round(
        sum(
            item.total_value or 0
            for item in procurements
        ),
        2,
    )

    no_show_count = queue_count(
        QueueStatus.NO_SHOW
    )

    no_show_rate = (
        (no_show_count / checked_in_today) * 100
        if checked_in_today > 0
        else 0
    )

    return {
        "centre_id": officer.centre_id,
        "centre_name": centre.name,
        "date": today,

        "bookings_today": bookings_today,
        "checked_in_today": checked_in_today,

        "waiting": queue_count(QueueStatus.WAITING),
        "called": queue_count(QueueStatus.CALLED),
        "processing": queue_count(QueueStatus.PROCESSING),
        "queue_completed": queue_count(QueueStatus.COMPLETED),
        "no_show": no_show_count,

        "procurements_completed": len(procurements),
        "procured_quantity": procured_quantity,
        "procurement_value": procurement_value,

        "payment_pending": count_payment_status(
            db,
            PaymentStatus.PENDING,
            officer.centre_id,
        ),

        "payment_processing": count_payment_status(
            db,
            PaymentStatus.PROCESSING,
            officer.centre_id,
        ),

        "payment_paid": count_payment_status(
            db,
            PaymentStatus.PAID,
            officer.centre_id,
        ),

        "payment_failed": count_payment_status(
            db,
            PaymentStatus.FAILED,
            officer.centre_id,
        ),

        "average_service_minutes": get_average_service_minutes(
            db,
            officer.centre_id,
            today,
        ),

        "no_show_rate_percent": round(
            no_show_rate,
            1,
        ),
    }


def admin_overview(
    db: Session,
):
    procurement_value = (
        db.query(
            func.coalesce(
                func.sum(Procurement.total_value),
                0,
            )
        )
        .filter(
            Procurement.stage == ProcurementStage.COMPLETED
        )
        .scalar()
    )

    return {
        "total_users": db.query(User).count(),
        "total_farmers": db.query(Farmer).count(),
        "total_officers": db.query(Officer).count(),

        "total_centres": db.query(ProcurementCentre).count(),

        "active_centres": (
            db.query(ProcurementCentre)
            .filter(
                ProcurementCentre.status == CentreStatus.ACTIVE
            )
            .count()
        ),

        "total_bookings": db.query(Booking).count(),
        "total_procurements": db.query(Procurement).count(),

        "total_procurement_value": float(
            procurement_value or 0
        ),

        "payment_pending": count_payment_status(
            db,
            PaymentStatus.PENDING,
        ),

        "payment_processing": count_payment_status(
            db,
            PaymentStatus.PROCESSING,
        ),

        "payment_paid": count_payment_status(
            db,
            PaymentStatus.PAID,
        ),

        "payment_failed": count_payment_status(
            db,
            PaymentStatus.FAILED,
        ),
    }


def centre_performance(
    db: Session,
):
    centres = db.query(ProcurementCentre).all()

    output = []

    for centre in centres:
        bookings = (
            db.query(Booking)
            .filter(
                Booking.centre_id == centre.id
            )
            .count()
        )

        procurements = (
            db.query(Procurement)
            .filter(
                Procurement.centre_id == centre.id,
                Procurement.stage == ProcurementStage.COMPLETED,
            )
            .all()
        )

        total_value = round(
            sum(
                item.total_value or 0
                for item in procurements
            ),
            2,
        )

        paid_value = (
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0,
                )
            )
            .filter(
                Payment.centre_id == centre.id,
                Payment.status == PaymentStatus.PAID,
            )
            .scalar()
        )

        output.append(
            {
                "centre_id": centre.id,
                "centre_name": centre.name,
                "bookings": bookings,
                "procurements_completed": len(procurements),
                "total_value": total_value,
                "paid_value": float(paid_value or 0),
                "average_service_minutes": get_average_service_minutes(
                    db,
                    centre.id,
                    date.today(),
                ),
            }
        )

    output.sort(
        key=lambda item: item["total_value"],
        reverse=True,
    )

    return output


def daily_trend(
    db: Session,
    days: int = 7,
):
    days = min(max(days, 1), 30)

    today = date.today()
    output = []

    for offset in range(days - 1, -1, -1):
        current_date = today - timedelta(days=offset)

        bookings = (
            db.query(Booking)
            .join(Booking.slot)
            .filter(
                Booking.slot.has(
                    slot_date=current_date
                )
            )
            .count()
        )

        queue_completed = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.queue_date == current_date,
                QueueEntry.status == QueueStatus.COMPLETED,
            )
            .count()
        )

        procurements_completed = (
            db.query(Procurement)
            .filter(
                func.date(Procurement.completed_at)
                == current_date.isoformat(),
                Procurement.stage == ProcurementStage.COMPLETED,
            )
            .count()
        )

        payments_paid = (
            db.query(Payment)
            .filter(
                func.date(Payment.paid_at)
                == current_date.isoformat(),
                Payment.status == PaymentStatus.PAID,
            )
            .count()
        )

        output.append(
            {
                "date": current_date,
                "bookings": bookings,
                "queue_completed": queue_completed,
                "procurements_completed": procurements_completed,
                "payments_paid": payments_paid,
            }
        )

    return output