from datetime import datetime, time

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    Float,
    String,
    Time,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base
from app.models.enums import CentreStatus


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    state: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    district: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    opening_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    closing_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    max_daily_quantity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    status: Mapped[CentreStatus] = mapped_column(
        SAEnum(CentreStatus),
        default=CentreStatus.ACTIVE,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    officers = relationship(
        "Officer",
        back_populates="centre",
    )

    slots = relationship(
        "Slot",
        back_populates="centre",
        cascade="all, delete-orphan",
    )