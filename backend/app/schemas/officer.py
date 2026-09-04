from datetime import datetime

from pydantic import BaseModel, Field


class OfficerCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )

    phone: str = Field(
        min_length=10,
        max_length=15,
    )

    password: str = Field(
        min_length=6,
        max_length=128,
    )

    employee_code: str = Field(
        min_length=3,
        max_length=40,
    )

    centre_id: int


class OfficerOut(BaseModel):
    id: int
    user_id: int
    centre_id: int

    name: str
    employee_code: str

    is_active: bool

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }