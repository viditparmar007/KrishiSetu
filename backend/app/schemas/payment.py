from datetime import datetime
from pydantic import BaseModel
from app.models.enums import PaymentStatus


class PaymentUpdate(BaseModel):
    status: PaymentStatus
    reference_number: str | None = None
    failure_reason: str | None = None


class PaymentOut(BaseModel):
    id: int
    procurement_id: int
    booking_id: int
    farmer_id: int
    centre_id: int
    amount: float
    status: PaymentStatus
    reference_number: str | None
    failure_reason: str | None
    created_at: datetime
    processing_at: datetime | None
    paid_at: datetime | None
    failed_at: datetime | None
    updated_at: datetime

    model_config = {"from_attributes": True}