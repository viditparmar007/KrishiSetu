from app.database import SessionLocal

# IMPORTANT:
# Load every SQLAlchemy model before querying User
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
from app.models.enums import UserRole

from app.utils.security import hash_password


ADMIN_PHONE = "9999999999"
ADMIN_PASSWORD = "Admin123!"


def create_admin():

    db = SessionLocal()

    try:

        admin = (
            db.query(User)
            .filter(
                User.phone == ADMIN_PHONE
            )
            .first()
        )

        if admin:

            admin.password_hash = hash_password(
                ADMIN_PASSWORD
            )

            admin.role = UserRole.ADMIN
            admin.is_active = True

            print(
                "Existing user reset as ADMIN."
            )

        else:

            admin = User(
                phone=ADMIN_PHONE,
                password_hash=hash_password(
                    ADMIN_PASSWORD
                ),
                role=UserRole.ADMIN,
                is_active=True,
            )

            db.add(admin)

            print(
                "New ADMIN created."
            )

        db.commit()

        print()
        print("ADMIN LOGIN")
        print("Phone:", ADMIN_PHONE)
        print("Password:", ADMIN_PASSWORD)

    except Exception as e:

        db.rollback()

        print(
            "ERROR:",
            e,
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":
    create_admin()