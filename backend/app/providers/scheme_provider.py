import os

from app.providers.exceptions import ProviderConfigurationError


SCHEME_PROVIDER_MODE = os.getenv(
    "SCHEME_PROVIDER_MODE",
    "demo",
).lower()


DEMO_SCHEMES = [
    {
        "code": "PM-KISAN",
        "name": "PM-KISAN",
        "summary": (
            "A central-sector farmer income-support scheme. "
            "Use the official portal for current rules and status."
        ),
        "intended_for": ["Farmers"],
        "official_url": "https://pmkisan.gov.in/",
        "source": "KrishiSetu curated demo information",
        "is_demo": True,
        "disclaimer": (
            "This is informational only. KrishiSetu does not determine "
            "official eligibility or approval."
        ),
    },
    {
        "code": "PMFBY",
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "summary": (
            "A crop-insurance scheme. Use the official portal for "
            "current coverage, dates, documents, and eligibility."
        ),
        "intended_for": ["Farmers", "Eligible notified crops/areas"],
        "official_url": "https://pmfby.gov.in/",
        "source": "KrishiSetu curated demo information",
        "is_demo": True,
        "disclaimer": (
            "This is informational only. KrishiSetu does not determine "
            "official eligibility or approval."
        ),
    },
]


def get_schemes(search: str | None = None) -> list[dict]:
    if SCHEME_PROVIDER_MODE != "demo":
        raise ProviderConfigurationError(
            "Live scheme provider has not been configured"
        )

    if not search:
        return DEMO_SCHEMES

    term = search.lower()

    return [
        item
        for item in DEMO_SCHEMES
        if term in item["name"].lower()
        or term in item["summary"].lower()
        or term in item["code"].lower()
    ]
