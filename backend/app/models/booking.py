from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base
from app.models.enums import BookingStatus


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("farmers.id"),
        nullable=False,
        index=True,
    )

    crop_id: Mapped[int] = mapped_column(
        ForeignKey("crops.id"),
        nullable=False,
        index=True,
    )

    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id"),
        nullable=False,
        index=True,
    )

    slot_id: Mapped[int] = mapped_column(
        ForeignKey("slots.id"),
        nullable=False,
        index=True,
    )

    declared_quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    quantity_unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    token: Mapped[str] = mapped_column(
        String(60),
        unique=True,
        index=True,
        nullable=False,
    )

    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus),
        default=BookingStatus.CONFIRMED,
        nullable=False,
        index=True,
    )

    booked_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    farmer = relationship(
        "Farmer",
        back_populates="bookings",
    )

    crop = relationship(
        "Crop",
        back_populates="bookings",
    )

    centre = relationship(
        "ProcurementCentre",
        back_populates="bookings",
    )

    slot = relationship(
        "Slot",
        back_populates="bookings",
    )