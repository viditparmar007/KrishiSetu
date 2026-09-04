from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.enums import ProcurementDecision, ProcurementStage


class Procurement(Base):
    __tablename__ = "procurements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True, nullable=False, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), nullable=False, index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), nullable=False, index=True)
    centre_id: Mapped[int] = mapped_column(ForeignKey("procurement_centres.id"), nullable=False, index=True)
    officer_id: Mapped[int] = mapped_column(ForeignKey("officers.id"), nullable=False, index=True)

    stage: Mapped[ProcurementStage] = mapped_column(
        SAEnum(ProcurementStage), default=ProcurementStage.DOCUMENT_VERIFICATION, nullable=False, index=True
    )

    documents_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    document_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    measured_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    accepted_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False)
    decision: Mapped[ProcurementDecision | None] = mapped_column(SAEnum(ProcurementDecision), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    rate_per_unit: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    documents_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quality_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    weighed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="procurement")
    payment = relationship(
    "Payment",
    back_populates="procurement",
    uselist=False,)