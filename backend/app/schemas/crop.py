from datetime import date, datetime
from pydantic import BaseModel, Field

from app.models.enums import CropStatus


class CropCreate(BaseModel):
    crop_name: str = Field(min_length=2, max_length=100)
    season: str | None = None
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    expected_quantity: float = Field(gt=0)
    quantity_unit: str = "quintal"
    status: CropStatus = CropStatus.GROWING


class CropUpdate(BaseModel):
    crop_name: str | None = Field(default=None, min_length=2, max_length=100)
    season: str | None = None
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    expected_quantity: float | None = Field(default=None, gt=0)
    quantity_unit: str | None = None
    status: CropStatus | None = None


class CropOut(BaseModel):
    id: int
    farm_id: int
    crop_name: str
    season: str | None
    sowing_date: date | None
    expected_harvest_date: date | None
    expected_quantity: float
    quantity_unit: str
    status: CropStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

