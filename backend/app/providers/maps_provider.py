import math
import os

import httpx


OSRM_BASE_URL = os.getenv(
    "OSRM_BASE_URL",
    "https://router.project-osrm.org",
).rstrip("/")

PROVIDER_TIMEOUT_SECONDS = float(
    os.getenv("PROVIDER_TIMEOUT_SECONDS", "10")
)


def _haversine_km(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> float:
    earth_radius_km = 6371.0

    lat1 = math.radians(origin_latitude)
    lat2 = math.radians(destination_latitude)
    delta_lat = math.radians(destination_latitude - origin_latitude)
    delta_lon = math.radians(destination_longitude - origin_longitude)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    return earth_radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _estimated_fallback(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> dict:
    straight_line_km = _haversine_km(
        origin_latitude,
        origin_longitude,
        destination_latitude,
        destination_longitude,
    )

    estimated_road_km = straight_line_km * 1.25
    estimated_minutes = (estimated_road_km / 35.0) * 60.0

    return {
        "origin_latitude": origin_latitude,
        "origin_longitude": origin_longitude,
        "destination_latitude": destination_latitude,
        "destination_longitude": destination_longitude,
        "distance_km": round(estimated_road_km, 2),
        "duration_minutes": round(estimated_minutes, 1),
        "source": "KrishiSetu distance estimate",
        "is_estimate": True,
        "advisory": (
            "Live routing was unavailable. Distance and time are estimates, "
            "not turn-by-turn navigation."
        ),
    }


def get_travel_time(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> dict:
    coordinates = (
        f"{origin_longitude},{origin_latitude};"
        f"{destination_longitude},{destination_latitude}"
    )

    url = f"{OSRM_BASE_URL}/route/v1/driving/{coordinates}"

    try:
        with httpx.Client(timeout=PROVIDER_TIMEOUT_SECONDS) as client:
            response = client.get(
                url,
                params={"overview": "false", "steps": "false"},
            )
            response.raise_for_status()
            data = response.json()

        routes = data.get("routes", [])

        if data.get("code") != "Ok" or not routes:
            return _estimated_fallback(
                origin_latitude,
                origin_longitude,
                destination_latitude,
                destination_longitude,
            )

        route = routes[0]

        return {
            "origin_latitude": origin_latitude,
            "origin_longitude": origin_longitude,
            "destination_latitude": destination_latitude,
            "destination_longitude": destination_longitude,
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_minutes": round(route["duration"] / 60, 1),
            "source": "OSRM",
            "is_estimate": False,
            "advisory": (
                "Travel time can change with traffic, weather, road closures, "
                "and vehicle conditions."
            ),
        }

    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        return _estimated_fallback(
            origin_latitude,
            origin_longitude,
            destination_latitude,
            destination_longitude,
        )