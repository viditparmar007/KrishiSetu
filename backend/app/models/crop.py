from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import CropStatus


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id"), nullable=False, index=True
    )

    crop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    season: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sowing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    expected_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(20), default="quintal")

    status: Mapped[CropStatus] = mapped_column(
        SAEnum(CropStatus), default=CropStatus.GROWING, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    farm = relationship("Farm", back_populates="crops")

    bookings = relationship(
    "Booking",
    back_populates="crop",
    )