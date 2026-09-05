import os
from datetime import date

from app.providers.exceptions import ProviderConfigurationError


MARKET_PROVIDER_MODE = os.getenv(
    "MARKET_PROVIDER_MODE",
    "demo",
).lower()


DEMO_PRICES = [
    {
        "state": "Uttarakhand",
        "district": "Haridwar",
        "market": "Roorkee",
        "commodity": "Wheat",
        "variety": "Local",
        "min_price": 2400.0,
        "max_price": 2600.0,
        "modal_price": 2500.0,
        "unit": "INR/quintal",
        "price_date": str(date.today()),
        "source": "KrishiSetu demo dataset",
        "is_demo": True,
    },
    {
        "state": "Uttarakhand",
        "district": "Haridwar",
        "market": "Roorkee",
        "commodity": "Paddy",
        "variety": "Common",
        "min_price": 2200.0,
        "max_price": 2450.0,
        "modal_price": 2325.0,
        "unit": "INR/quintal",
        "price_date": str(date.today()),
        "source": "KrishiSetu demo dataset",
        "is_demo": True,
    },
]


def get_market_prices(
    commodity: str | None = None,
    state: str | None = None,
    district: str | None = None,
) -> list[dict]:
    if MARKET_PROVIDER_MODE != "demo":
        raise ProviderConfigurationError(
            "Live market provider has not been configured"
        )

    results = DEMO_PRICES

    if commodity:
        results = [
            item
            for item in results
            if item["commodity"].lower() == commodity.lower()
        ]

    if state:
        results = [
            item
            for item in results
            if item["state"].lower() == state.lower()
        ]

    if district:
        results = [
            item
            for item in results
            if item["district"].lower() == district.lower()
        ]

    return results