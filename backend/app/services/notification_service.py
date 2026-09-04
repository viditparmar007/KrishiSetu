from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.models.enums import NotificationType


def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
):
    item = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def list_notifications(
    db: Session,
    current_user: User,
):
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )


def get_unread_count(
    db: Session,
    current_user: User,
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return {
        "unread_count": count
    }


def mark_notification_read(
    db: Session,
    current_user: User,
    notification_id: int,
):
    item = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    if not item.is_read:
        item.is_read = True
        item.read_at = datetime.utcnow()
        db.commit()
        db.refresh(item)

    return item


def mark_all_notifications_read(
    db: Session,
    current_user: User,
):
    items = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .all()
    )

    now = datetime.utcnow()

    for item in items:
        item.is_read = True
        item.read_at = now

    db.commit()

    return {
        "updated": len(items)
    }