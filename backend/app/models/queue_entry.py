from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import QueueStatus


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    __table_args__ = (
        UniqueConstraint(
            "centre_id", "queue_date", "queue_number",
            name="uq_centre_queue_number_per_day",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True, nullable=False, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), nullable=False, index=True)
    centre_id: Mapped[int] = mapped_column(ForeignKey("procurement_centres.id"), nullable=False, index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slots.id"), nullable=False, index=True)

    queue_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    queue_number: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[QueueStatus] = mapped_column(
        SAEnum(QueueStatus), default=QueueStatus.WAITING, nullable=False, index=True
    )

    checked_in_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    called_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    no_show_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="queue_entry")