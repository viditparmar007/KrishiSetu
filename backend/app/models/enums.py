import enum


class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class CropStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    GROWING = "GROWING"
    HARVEST_READY = "HARVEST_READY"
    HARVESTED = "HARVESTED"
    PROCURED = "PROCURED"    

class CentreStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class SlotStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    CHECKED_IN = "CHECKED_IN"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"    