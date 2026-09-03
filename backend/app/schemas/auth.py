from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=15)
    password: str = Field(min_length=6, max_length=128)
    state: str
    district: str
    village: str
    preferred_language: str = "en"


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    id: int
    phone: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class FarmerOut(BaseModel):
    id: int
    name: str
    state: str
    district: str
    village: str
    preferred_language: str

    model_config = {"from_attributes": True}