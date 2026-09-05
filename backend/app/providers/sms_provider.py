
import logging
import os
import re
import uuid

from app.providers.exceptions import ProviderConfigurationError


logger = logging.getLogger(__name__)

SMS_PROVIDER_MODE = os.getenv(
    "SMS_PROVIDER_MODE",
    "console",
).lower()


def normalize_phone_number(phone_number: str) -> str:
    value = re.sub(r"[\s()-]", "", phone_number)

    if value.startswith("+"):
        digits = value[1:]
    else:
        digits = value

    if not digits.isdigit() or not 10 <= len(digits) <= 15:
        raise ValueError("Invalid phone number format")

    return f"+{digits}"


def send_sms(phone_number: str, message: str) -> dict:
    normalized_phone = normalize_phone_number(phone_number)

    if SMS_PROVIDER_MODE != "console":
        raise ProviderConfigurationError(
            "Real SMS provider has not been configured"
        )

    message_id = f"console-{uuid.uuid4()}"

    # Do not log OTPs or sensitive personal information in production.
    logger.info(
        "Console SMS accepted: id=%s to=%s characters=%s",
        message_id,
        normalized_phone[-4:].rjust(len(normalized_phone), "*"),
        len(message),
    )

    return {
        "accepted": True,
        "provider": "console",
        "provider_message_id": message_id,
        "detail": "SMS simulated successfully; no real message was sent",
    }
