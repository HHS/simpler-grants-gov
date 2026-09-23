import logging
import uuid

from src.adapters import db
from src.constants.lookup_constants import ApplicationAuditEvent
from src.db.models.competition_models import (
    Application,
    ApplicationAttachment,
    ApplicationAudit,
    ApplicationForm,
)
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def add_audit_event(
    db_session: db.Session,
    application: Application,
    user: User,
    audit_event: ApplicationAuditEvent,
    target_user: User | None = None,
    target_application_form: ApplicationForm | None = None,
    target_attachment: ApplicationAttachment | None = None,
) -> None:
    """Add an application audit event and log it"""
    audit = ApplicationAudit(
        application=application,
        user=user,
        application_audit_event=audit_event,
        target_user=target_user,
        target_application_form=target_application_form,
        target_attachment=target_attachment,
    )

    db_session.add(audit)
    _log_audit_event(
        application_id=application.application_id,
        user_id=user.user_id,
        audit_event=audit_event,
        target_user_id=target_user.user_id if target_user is not None else None,
        target_application_form_id=(
            target_application_form.application_form_id
            if target_application_form is not None
            else None
        ),
        target_attachment_id=(
            target_attachment.application_attachment_id if target_attachment is not None else None
        ),
    )


def add_audit_event_by_id(
    db_session: db.Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
    audit_event: ApplicationAuditEvent,
    target_user_id: uuid.UUID | None = None,
    target_application_form_id: uuid.UUID | None = None,
    target_attachment_id: uuid.UUID | None = None,
) -> None:
    """Add an application audit event and log it"""
    audit = ApplicationAudit(
        application_id=application_id,
        user_id=user_id,
        application_audit_event=audit_event,
        target_user_id=target_user_id,
        target_application_form_id=target_application_form_id,
        target_attachment_id=target_attachment_id,
    )

    db_session.add(audit)
    _log_audit_event(
        application_id=application_id,
        user_id=user_id,
        audit_event=audit_event,
        target_user_id=target_user_id,
        target_application_form_id=target_application_form_id,
        target_attachment_id=target_attachment_id,
    )


def _log_audit_event(
    application_id: uuid.UUID,
    user_id: uuid.UUID,
    audit_event: ApplicationAuditEvent,
    target_user_id: uuid.UUID | None,
    target_application_form_id: uuid.UUID | None,
    target_attachment_id: uuid.UUID | None,
) -> None:
    logger.info(
        "Added application audit event",
        extra={
            "application_id": application_id,
            "user_id": user_id,
            "application_audit_event": audit_event,
            "target_user_id": target_user_id,
            "target_application_form_id": target_application_form_id,
            "target_attachment_id": target_attachment_id,
        },
    )
