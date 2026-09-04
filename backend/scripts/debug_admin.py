from app.database import SessionLocal, engine

# Load all SQLAlchemy models
from app.models import (
    user,
    farmer,
    farm,
    crop,
    centre,
    officer,
    slot,
    booking,
)  # noqa: F401

from app.models.user import User
from app.utils.security import verify_password


PHONE = "9999999999"
PASSWORD = "Admin123!"


db = SessionLocal()

try:
    print("DATABASE:", engine.url)

    admin = (
        db.query(User)
        .filter(User.phone == PHONE)
        .first()
    )

    if admin is None:
        print("❌ ADMIN NOT FOUND")

    else:
        print("✅ ADMIN FOUND")
        print("ID:", admin.id)
        print("Phone:", admin.phone)
        print("Role:", admin.role)
        print("Active:", admin.is_active)

        print(
            "Password valid:",
            verify_password(
                PASSWORD,
                admin.password_hash,
            ),
        )

finally:
    db.close()