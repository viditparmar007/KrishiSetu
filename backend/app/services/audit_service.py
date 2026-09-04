from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction


def create_audit_log(
    db: Session,
    user_id: int | None,
    action: AuditAction,
    entity_type: str,
    entity_id: int | None,
    description: str,
):
    item = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def list_audit_logs(
    db: Session,
    limit: int = 100,
):
    limit = min(max(limit, 1), 500)

    return (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(limit)
        .all()
    )