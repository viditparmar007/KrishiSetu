from datetime import date
from pydantic import BaseModel

from app.models.enums import CropStatus


class DashboardCropItem(BaseModel):
    id: int
    farm_id: int
    farm_name: str
    crop_name: str
    status: CropStatus
    expected_harvest_date: date | None
    expected_quantity: float
    quantity_unit: str


class FarmerDashboardOut(BaseModel):
    farmer_name: str
    total_farms: int
    total_crops: int
    growing_crops: int
    harvest_ready_crops: int
    active_crops: list[DashboardCropItem]
    upcoming_harvests: list[DashboardCropItem]