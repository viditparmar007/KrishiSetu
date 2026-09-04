from datetime import datetime
from secrets import token_hex


def generate_booking_token(
    centre_code: str,
) -> str:

    date_part = datetime.utcnow().strftime(
        "%Y%m%d"
    )

    random_part = token_hex(3).upper()

    safe_centre = (
        centre_code
        .replace(" ", "")
        .replace("/", "-")
        .upper()
    )

    return (
        f"KS-{safe_centre}-"
        f"{date_part}-{random_part}"
    )