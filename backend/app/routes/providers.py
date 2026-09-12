
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.providers.exceptions import (
    ProviderConfigurationError,
    ProviderUnavailableError,
)
from app.providers.maps_provider import get_travel_time
from app.providers.market_provider import get_market_prices
from app.providers.scheme_provider import get_schemes
from app.providers.sms_provider import send_sms
from app.providers.weather_provider import get_current_weather
from app.schemas.providers import (
    MarketPriceOut,
    SchemeOut,
    SmsResultOut,
    TestSmsRequest,
    TravelTimeOut,
    WeatherOut,
)


router = APIRouter(
    prefix="/api/v1/providers",
    tags=["Providers"],
)

admin_router = APIRouter(
    prefix="/api/v1/admin/providers",
    tags=["Admin Providers"],
)


def _raise_provider_http_error(exc: Exception) -> None:
    if isinstance(exc, ProviderConfigurationError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=str(exc),
    ) from exc


@router.get("/weather", response_model=WeatherOut)
def read_weather(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_current_weather(latitude, longitude)
    except (ProviderUnavailableError, ProviderConfigurationError) as exc:
        _raise_provider_http_error(exc)


@router.get("/market-prices", response_model=list[MarketPriceOut])
def read_market_prices(
    commodity: str | None = Query(default=None, max_length=80),
    state_name: str | None = Query(default=None, max_length=80),
    district: str | None = Query(default=None, max_length=80),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_market_prices(
            commodity=commodity,
            state=state_name,
            district=district,
        )
    except (ProviderUnavailableError, ProviderConfigurationError) as exc:
        _raise_provider_http_error(exc)


@router.get("/schemes", response_model=list[SchemeOut])
def read_schemes(
    search: str | None = Query(default=None, max_length=100),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_schemes(search=search)
    except (ProviderUnavailableError, ProviderConfigurationError) as exc:
        _raise_provider_http_error(exc)


@router.get("/travel-time", response_model=TravelTimeOut)
def read_travel_time(
    origin_latitude: float = Query(ge=-90, le=90),
    origin_longitude: float = Query(ge=-180, le=180),
    destination_latitude: float = Query(ge=-90, le=90),
    destination_longitude: float = Query(ge=-180, le=180),
    current_user: User = Depends(require_role("FARMER")),
):
    return get_travel_time(
        origin_latitude,
        origin_longitude,
        destination_latitude,
        destination_longitude,
    )


@admin_router.post("/test-sms", response_model=SmsResultOut)
def test_sms(
    payload: TestSmsRequest,
    current_user: User = Depends(require_role("ADMIN")),
):
    try:
        return send_sms(payload.phone_number, payload.message)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except (ProviderUnavailableError, ProviderConfigurationError) as exc:
        _raise_provider_http_error(exc)


direct_router = APIRouter(
    prefix="/api/v1",
    tags=["Direct Provider Aliases"],
)


@direct_router.get("/market-prices", response_model=list[MarketPriceOut])
def read_direct_market_prices(
    commodity: str | None = Query(default=None, max_length=80),
    state_name: str | None = Query(default=None, max_length=80),
    district: str | None = Query(default=None, max_length=80),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_market_prices(
            commodity=commodity,
            state=state_name,
            district=district,
        )
    except Exception as exc:
        _raise_provider_http_error(exc)


@direct_router.get("/schemes", response_model=list[SchemeOut])
def read_direct_schemes(
    search: str | None = Query(default=None, max_length=100),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_schemes(search=search)
    except Exception as exc:
        _raise_provider_http_error(exc)


@direct_router.get("/weather/farm/{farm_id}", response_model=WeatherOut)
def read_farm_weather(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.farm import Farm
    from app.models.farmer import Farmer

    farmer_profile = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    farm = None
    if farmer_profile:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_profile.id).first()
    lat = float(farm.latitude) if (farm and farm.latitude is not None) else 30.0363
    lon = float(farm.longitude) if (farm and farm.longitude is not None) else 77.7518
    return get_current_weather(lat, lon)
