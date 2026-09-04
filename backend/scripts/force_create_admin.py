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
from app.models.enums import UserRole
from app.utils.security import hash_password


PHONE = "9999999999"
PASSWORD = "Admin123!"


def create_admin():

    print("DATABASE:", engine.url)

    db = SessionLocal()

    try:

        existing = (
            db.query(User)
            .filter(User.phone == PHONE)
            .first()
        )

        if existing:
            print("User already exists.")
            print("Current role:", existing.role)

            existing.password_hash = hash_password(
                PASSWORD
            )

            existing.role = UserRole.ADMIN
            existing.is_active = True

            admin = existing

        else:

            print("Creating new ADMIN...")

            admin = User(
                phone=PHONE,
                password_hash=hash_password(
                    PASSWORD
                ),
                role=UserRole.ADMIN,
                is_active=True,
            )

            db.add(admin)

        db.commit()
        db.refresh(admin)

        print()
        print("✅ ADMIN SAVED")
        print("ID:", admin.id)
        print("Phone:", admin.phone)
        print("Role:", admin.role)
        print("Active:", admin.is_active)

        # Verify directly from database
        check = (
            db.query(User)
            .filter(User.phone == PHONE)
            .first()
        )

        print()
        print("DATABASE VERIFY:")

        if check:
            print("✅ ADMIN FOUND")
            print("ID:", check.id)
            print("Phone:", check.phone)
            print("Role:", check.role)

        else:
            print("❌ ADMIN STILL NOT FOUND")

    except Exception as e:

        db.rollback()

        print()
        print("❌ ERROR:")
        print(e)

        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()