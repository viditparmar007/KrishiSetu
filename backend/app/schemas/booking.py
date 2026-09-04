from datetime import date, datetime, time

from pydantic import BaseModel, Field

from app.models.enums import BookingStatus


class BookingCreate(BaseModel):
    crop_id: int
    slot_id: int
    declared_quantity: float = Field(gt=0)


class BookingOut(BaseModel):
    id: int

    farmer_id: int
    crop_id: int
    centre_id: int
    slot_id: int

    declared_quantity: float
    quantity_unit: str

    token: str
    status: BookingStatus

    booked_at: datetime
    cancelled_at: datetime | None
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class BookingDetailOut(BaseModel):
    id: int

    crop_id: int
    crop_name: str

    centre_id: int
    centre_name: str
    centre_code: str

    slot_id: int
    slot_date: date
    start_time: time
    end_time: time

    declared_quantity: float
    quantity_unit: str

    token: str
    status: BookingStatus

    booked_at: datetime
    cancelled_at: datetime | None