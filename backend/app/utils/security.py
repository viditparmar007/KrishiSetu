from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt  # type: ignore[import-not-found]
from pwdlib import PasswordHash

from app.config import settings

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hasher.verify(
        plain_password,
        hashed_password
    )
def create_access_token(subject: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None