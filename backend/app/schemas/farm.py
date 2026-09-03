from datetime import datetime

from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    farm_name: str = Field(min_length=2, max_length=120)

    state: str = Field(min_length=2, max_length=80)
    district: str = Field(min_length=2, max_length=80)
    village: str = Field(min_length=2, max_length=80)

    area: float = Field(gt=0)
    area_unit: str = "acre"

    irrigation_type: str | None = None

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )


class FarmUpdate(BaseModel):
    farm_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )

    state: str | None = None
    district: str | None = None
    village: str | None = None

    area: float | None = Field(
        default=None,
        gt=0,
    )

    area_unit: str | None = None
    irrigation_type: str | None = None

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )


class FarmOut(BaseModel):
    id: int
    farmer_id: int

    farm_name: str

    state: str
    district: str
    village: str

    area: float
    area_unit: str

    irrigation_type: str | None

    latitude: float | None
    longitude: float | None

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }