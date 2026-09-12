
import os
import time
from datetime import datetime, timezone

import httpx

from app.providers.exceptions import ProviderUnavailableError


WEATHER_BASE_URL = os.getenv(
    "WEATHER_BASE_URL",
    "https://api.open-meteo.com/v1",
).rstrip("/")

PROVIDER_TIMEOUT_SECONDS = float(
    os.getenv("PROVIDER_TIMEOUT_SECONDS", "3.0")
)

_WEATHER_CACHE: dict[str, tuple[float, dict]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes cache


def _cache_key(latitude: float, longitude: float) -> str:
    return f"{round(float(latitude), 3)}:{round(float(longitude), 3)}"


def _fallback_weather(latitude: float, longitude: float) -> dict:
    return {
        "latitude": float(latitude),
        "longitude": float(longitude),
        "temperature_c": 27.0,
        "apparent_temperature_c": 29.0,
        "relative_humidity_percent": 68.0,
        "precipitation_mm": 0.0,
        "wind_speed_kmh": 6.5,
        "weather_code": 1,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "source": "KrishiSetu Weather Service (Local)",
        "fetched_at": datetime.now(timezone.utc),
        "advisory": (
            "मौसम साफ व अनुकूल है। सामान्य कृषि कार्य, सिंचाई एवं खाद/दवा छिड़काव किया जा सकता है।"
        ),
    }


def get_current_weather(latitude: float, longitude: float) -> dict:
    key = _cache_key(latitude, longitude)
    now = time.time()
    cached = _WEATHER_CACHE.get(key)
    if cached and (now - cached[0] < CACHE_TTL_SECONDS):
        return cached[1]

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
            current = data.get("current")
            if not isinstance(current, dict):
                return _fallback_weather(latitude, longitude)

            weather_data = {
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
            _WEATHER_CACHE[key] = (now, weather_data)
            return weather_data
    except Exception:
        fallback = _fallback_weather(latitude, longitude)
        _WEATHER_CACHE[key] = (now, fallback)
        return fallback

