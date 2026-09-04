from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationOut(BaseModel):
    id: int
    notification_type: NotificationType
    title: str
    message: str
    entity_type: str | None
    entity_id: int | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None

    model_config = {
        "from_attributes": True
    }


class UnreadCountOut(BaseModel):
    unread_count: int