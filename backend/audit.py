"""Lightweight audit logging."""
from __future__ import annotations

from typing import Any, Dict, Optional

from models import AuditLog


async def log_action(
    db,
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    resource: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Fire-and-forget audit logger. Failures are swallowed."""
    try:
        entry = AuditLog(
            action=action,
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            metadata=metadata or {},
        )
        await db.audit_logs.insert_one(entry.model_dump())
    except Exception:
        pass
