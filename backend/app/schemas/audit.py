from datetime import datetime

from pydantic import BaseModel

from app.models.enums import AuditAction


class AuditLogOut(BaseModel):
    id: int
    user_id: int | None
    action: AuditAction
    entity_type: str
    entity_id: int | None
    description: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
    