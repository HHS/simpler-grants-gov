import logging

from src.adapters import db
from src.constants.lookup_constants import OrganizationAuditEvent
from src.db.models.entity_models import Organization, OrganizationAudit
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def add_audit_event(
    db_session: db.Session,
    organization: Organization,
    user: User,
    audit_event: OrganizationAuditEvent,
    target_user: User | None = None,
) -> None:
    """Add an organization audit event and log it"""
    audit = OrganizationAudit(
        organization=organization,
        user=user,
        organization_audit_event=audit_event,
        target_user=target_user,
    )

    db_session.add(audit)
    _log_audit_event(audit)


def _log_audit_event(audit: OrganizationAudit) -> None:
    logger.info(
        "Added organization audit event",
        extra={
            "organization_id": audit.organization_id,
            "user_id": audit.user_id,
            "organization_audit_event": audit.organization_audit_event,
            "target_user_id": audit.target_user_id,
        },
    )
