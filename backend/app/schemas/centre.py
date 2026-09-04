from datetime import datetime, time

from pydantic import BaseModel, Field

from app.models.enums import CentreStatus


class CentreCreate(BaseModel):
    code: str = Field(min_length=3, max_length=30)
    name: str = Field(min_length=3, max_length=150)

    state: str
    district: str
    address: str

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

    opening_time: time
    closing_time: time

    max_daily_quantity: float | None = Field(
        default=None,
        gt=0,
    )

    status: CentreStatus = CentreStatus.ACTIVE


class CentreUpdate(BaseModel):
    code: str | None = None
    name: str | None = None

    state: str | None = None
    district: str | None = None
    address: str | None = None

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

    opening_time: time | None = None
    closing_time: time | None = None

    max_daily_quantity: float | None = Field(
        default=None,
        gt=0,
    )

    status: CentreStatus | None = None


class CentreOut(BaseModel):
    id: int
    code: str
    name: str

    state: str
    district: str
    address: str

    latitude: float | None
    longitude: float | None

    opening_time: time
    closing_time: time

    max_daily_quantity: float | None

    status: CentreStatus

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }