
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    notification_type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    entity_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
