"""
File containing various small utilities for our
workflow logic.
"""

import logging
import uuid

from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow
from src.task.notifications.config import get_email_config

logger = logging.getLogger(__name__)


def send_workflow_email(workflow: Workflow, user: User, subject: str, message: str) -> None:
    """

    Send an email for the workflow.

    Use this if you want to directly send an email. If a particular email
    will be sent in multiple locations, create a utility that in turn calls this.
    """

    trace_id = str(uuid.uuid4())
    log_extra = workflow.get_log_extra() | {"trace_id": trace_id, "user_id": user.user_id}

    # Not every user in our system is guaranteed to have an email
    # Before calling this function, probably should make sure this
    # isn't possible by joining to the link_external_user table
    if user.email is None:
        logger.error(
            "User without email in workflow email logic - cannot send email.", extra=log_extra
        )
        return

    config = get_email_config()

    try:
        logger.info("Sending email for workflow", extra=log_extra)
        send_pinpoint_email_raw(
            to_address=user.email,
            subject=subject,
            message=message,
            app_id=config.app_id,
            trace_id=trace_id,
        )

    except Exception:
        logger.exception("Failed to send email for workflow", extra=log_extra)
