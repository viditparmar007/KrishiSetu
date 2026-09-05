from datetime import datetime

from pydantic import BaseModel, Field


class WeatherOut(BaseModel):
    latitude: float
    longitude: float
    temperature_c: float | None
    apparent_temperature_c: float | None
    relative_humidity_percent: float | None
    precipitation_mm: float | None
    wind_speed_kmh: float | None
    weather_code: int | None
    observed_at: str | None
    source: str
    fetched_at: datetime
    advisory: str


class MarketPriceOut(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: str | None = None
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "INR/quintal"
    price_date: str
    source: str
    is_demo: bool


class SchemeOut(BaseModel):
    code: str
    name: str
    summary: str
    intended_for: list[str]
    official_url: str
    source: str
    is_demo: bool
    disclaimer: str


class TravelTimeOut(BaseModel):
    origin_latitude: float
    origin_longitude: float
    destination_latitude: float
    destination_longitude: float
    distance_km: float
    duration_minutes: float
    source: str
    is_estimate: bool
    advisory: str


class TestSmsRequest(BaseModel):
    phone_number: str = Field(min_length=10, max_length=16)
    message: str = Field(min_length=1, max_length=320)


class SmsResultOut(BaseModel):
    accepted: bool
    provider: str
    provider_message_id: str | None = None
    detail: str

    