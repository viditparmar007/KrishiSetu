from datetime import date, datetime
from pydantic import BaseModel
from app.models.enums import QueueStatus


class QueueEntryOut(BaseModel):
    id: int
    booking_id: int
    farmer_id: int
    centre_id: int
    slot_id: int
    queue_date: date
    queue_number: int
    status: QueueStatus
    checked_in_at: datetime
    called_at: datetime | None
    processing_started_at: datetime | None
    completed_at: datetime | None
    no_show_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarmerQueueStatusOut(BaseModel):
    queue_entry_id: int
    booking_id: int
    token: str
    centre_id: int
    centre_name: str
    queue_date: date
    queue_number: int
    queue_status: QueueStatus
    queue_position: int
    farmers_ahead: int
    estimated_wait_minutes: int
    average_service_minutes: float
    current_token: str | None
    checked_in_at: datetime
    called_at: datetime | None
    processing_started_at: datetime | None


class CentreQueueStatusOut(BaseModel):
    centre_id: int
    centre_name: str
    queue_date: date
    current_token: str | None
    waiting_count: int
    called_count: int
    processing_count: int
    completed_count: int
    no_show_count: int
    average_service_minutes: float


class OfficerQueueItemOut(BaseModel):
    queue_entry_id: int
    booking_id: int
    token: str
    crop_id: int
    crop_name: str
    declared_quantity: float
    quantity_unit: str
    queue_number: int
    queue_date: date
    status: QueueStatus
    checked_in_at: datetime
    called_at: datetime | None
    processing_started_at: datetime | None
    completed_at: datetime | None
    no_show_at: datetime | None