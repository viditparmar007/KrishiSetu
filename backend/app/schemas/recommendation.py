from datetime import date, datetime, time

from pydantic import BaseModel


class CentreRecommendationOut(BaseModel):
    centre_id: int
    centre_name: str
    district: str

    score: float
    estimated_wait_minutes: int

    open_slot_count: int
    available_farmer_capacity: int

    distance_km: float | None
    reason: str


class SlotRecommendationOut(BaseModel):
    slot_id: int
    centre_id: int

    slot_date: date
    start_time: time
    end_time: time

    available_farmer_capacity: int
    available_quantity_capacity: float

    recommendation_score: float
    estimated_wait_minutes: int
    reason: str


class LeaveTimeOut(BaseModel):
    booking_id: int
    slot_start: datetime

    travel_minutes: int
    safety_buffer_minutes: int

    recommended_leave_time: datetime

    message: str