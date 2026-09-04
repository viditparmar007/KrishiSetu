from datetime import date

from pydantic import BaseModel


class OfficerAnalyticsOut(BaseModel):
    centre_id: int
    centre_name: str
    date: date

    bookings_today: int
    checked_in_today: int

    waiting: int
    called: int
    processing: int
    queue_completed: int
    no_show: int

    procurements_completed: int
    procured_quantity: float
    procurement_value: float

    payment_pending: int
    payment_processing: int
    payment_paid: int
    payment_failed: int

    average_service_minutes: float
    no_show_rate_percent: float


class AdminOverviewOut(BaseModel):
    total_users: int
    total_farmers: int
    total_officers: int

    total_centres: int
    active_centres: int

    total_bookings: int
    total_procurements: int

    total_procurement_value: float

    payment_pending: int
    payment_processing: int
    payment_paid: int
    payment_failed: int


class CentrePerformanceOut(BaseModel):
    centre_id: int
    centre_name: str

    bookings: int
    procurements_completed: int

    total_value: float
    paid_value: float

    average_service_minutes: float


class DailyTrendOut(BaseModel):
    date: date
    bookings: int
    queue_completed: int
    procurements_completed: int
    payments_paid: int