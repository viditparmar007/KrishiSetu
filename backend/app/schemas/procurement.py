from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enums import ProcurementDecision, ProcurementStage


class DocumentVerificationUpdate(BaseModel):
    verified: bool
    notes: str | None = None


class QualityCheckUpdate(BaseModel):
    quality_grade: str = Field(min_length=1, max_length=50)
    quality_notes: str | None = None


class WeighingUpdate(BaseModel):
    measured_quantity: float = Field(gt=0)
    accepted_quantity: float = Field(gt=0)


class ProcurementDecisionUpdate(BaseModel):
    decision: ProcurementDecision
    rate_per_unit: float | None = Field(default=None, gt=0)
    rejection_reason: str | None = None


class ProcurementOut(BaseModel):
    id: int
    booking_id: int
    farmer_id: int
    crop_id: int
    centre_id: int
    officer_id: int
    stage: ProcurementStage
    documents_verified: bool
    document_notes: str | None
    quality_grade: str | None
    quality_notes: str | None
    measured_quantity: float | None
    accepted_quantity: float | None
    quantity_unit: str
    decision: ProcurementDecision | None
    rejection_reason: str | None
    rate_per_unit: float | None
    total_value: float | None
    started_at: datetime
    documents_verified_at: datetime | None
    quality_checked_at: datetime | None
    weighed_at: datetime | None
    decided_at: datetime | None
    completed_at: datetime | None
    updated_at: datetime

    model_config = {"from_attributes": True}