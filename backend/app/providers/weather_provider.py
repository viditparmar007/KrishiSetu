
import os
from datetime import datetime, timezone

import httpx

from app.providers.exceptions import ProviderUnavailableError


WEATHER_BASE_URL = os.getenv(
    "WEATHER_BASE_URL",
    "https://api.open-meteo.com/v1",
).rstrip("/")

PROVIDER_TIMEOUT_SECONDS = float(
    os.getenv("PROVIDER_TIMEOUT_SECONDS", "10")
)


def get_current_weather(latitude: float, longitude: float) -> dict:
    url = f"{WEATHER_BASE_URL}/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,apparent_temperature,"
            "relative_humidity_2m,precipitation,"
            "weather_code,wind_speed_10m"
        ),
        "timezone": "auto",
    }

    try:
        with httpx.Client(timeout=PROVIDER_TIMEOUT_SECONDS) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ProviderUnavailableError(
            "Weather service is temporarily unavailable"
        ) from exc

    current = data.get("current")

    if not isinstance(current, dict):
        raise ProviderUnavailableError(
            "Weather provider returned an invalid response"
        )

    return {
        "latitude": float(data.get("latitude", latitude)),
        "longitude": float(data.get("longitude", longitude)),
        "temperature_c": current.get("temperature_2m"),
        "apparent_temperature_c": current.get("apparent_temperature"),
        "relative_humidity_percent": current.get("relative_humidity_2m"),
        "precipitation_mm": current.get("precipitation"),
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "weather_code": current.get("weather_code"),
        "observed_at": current.get("time"),
        "source": "Open-Meteo",
        "fetched_at": datetime.now(timezone.utc),
        "advisory": (
            "Weather data is informational and may change. "
            "Check local official advisories before farm decisions."
        ),
    }
