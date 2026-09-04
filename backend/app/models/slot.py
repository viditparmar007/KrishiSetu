from datetime import date, datetime, time

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    Time,
    UniqueConstraint,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base
from app.models.enums import SlotStatus


class Slot(Base):
    __tablename__ = "slots"

    __table_args__ = (
        UniqueConstraint(
            "centre_id",
            "slot_date",
            "start_time",
            "end_time",
            name="uq_centre_slot_time",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id"),
        nullable=False,
        index=True,
    )

    slot_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    max_farmer_capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    max_quantity_capacity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    booked_farmer_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    booked_quantity: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    status: Mapped[SlotStatus] = mapped_column(
        SAEnum(SlotStatus),
        default=SlotStatus.OPEN,
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

    centre = relationship(
        "ProcurementCentre",
        back_populates="slots",
    )

    @property
    def available_farmer_capacity(self) -> int:
        return max(
            self.max_farmer_capacity
            - self.booked_farmer_count,
            0,
        )

    @property
    def available_quantity_capacity(self) -> float:
        return max(
            self.max_quantity_capacity
            - self.booked_quantity,
            0.0,
        )

    @property
    def is_available(self) -> bool:
        return (
            self.status == SlotStatus.OPEN
            and self.available_farmer_capacity > 0
            and self.available_quantity_capacity > 0
        )