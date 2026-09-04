from datetime import date, datetime, time

from pydantic import BaseModel, Field

from app.models.enums import SlotStatus


class SlotCreate(BaseModel):
    slot_date: date

    start_time: time
    end_time: time

    max_farmer_capacity: int = Field(gt=0)
    max_quantity_capacity: float = Field(gt=0)

    status: SlotStatus = SlotStatus.OPEN


class SlotUpdate(BaseModel):
    slot_date: date | None = None

    start_time: time | None = None
    end_time: time | None = None

    max_farmer_capacity: int | None = Field(
        default=None,
        gt=0,
    )

    max_quantity_capacity: float | None = Field(
        default=None,
        gt=0,
    )

    status: SlotStatus | None = None


class SlotOut(BaseModel):
    id: int
    centre_id: int

    slot_date: date

    start_time: time
    end_time: time

    max_farmer_capacity: int
    max_quantity_capacity: float

    booked_farmer_count: int
    booked_quantity: float

    available_farmer_capacity: int
    available_quantity_capacity: float

    status: SlotStatus
    is_available: bool

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }