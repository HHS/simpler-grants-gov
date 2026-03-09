import uuid

from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw

import logging

from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow
from src.task.notifications.config import get_email_config

logger = logging.getLogger(__name__)

APPROVAL_EMAIL_SUBJECT_TEMPLATE = "Approval required for '{workflow_type}'"

APPROVAL_EMAIL_TEMPLATE = """An approval is required for a {workflow_type} that is currently in state '{current_workflow_state}' from a user with the following privilege(s): {privileges}.

ID: {workflow_id}
Agency: {agency_code}: {agency_name}

Please visit {url} to make this update.
"""



def send_workflow_email(workflow: Workflow, email: str, subject: str, message: str) -> None:
    """Send an email for the workflow"""
    config = get_email_config()
    trace_id = str(uuid.uuid4())
    log_extra = workflow.get_log_extra() | {"trace_id": trace_id}

    try:

        logger.info("Sending email for workflow", extra=log_extra)
        send_pinpoint_email_raw(
            to_address=email,
            subject=subject,
            message=message,
            app_id=config.app_id,
            trace_id=trace_id,
        )

    except Exception:
        logger.exception("Failed to send email for workflow", extra=log_extra)
        raise Exception("TODO - something")



def send_approval_email_for_grantor(workflow: Workflow, privileges: list[Privilege], agency: Agency) -> None:
    # another ticket is adding a function to get users, assume that exists
    users: list[User] = []

    # TODO - suppressed emails. Need to factor those in.

    if len(users) == 0:
        logger.warning("No users can do approval", extra=workflow.get_log_extra())
        return

    approval_message = APPROVAL_EMAIL_TEMPLATE.format(
        workflow_id=workflow.workflow_id,
        current_workflow_state=workflow.current_workflow_state,
        workflow_type=workflow.workflow_type.get_human_friendly_text(),
        agency_code=agency.agency_code,
        agency_name=agency.agency_name,
        privileges=",".join(privileges),
        # TODO - something here
        url=get_email_config().frontend_base_url
    )

    for user in users:
        if user.email is None:
            logger.warning("User without email in approval email logic - did someone give a system user an approval role?", extra=workflow.get_log_extra() | {"user_id": user.user_id})
            continue

        send_workflow_email(
            workflow=workflow,
            email=user.email,
            subject=APPROVAL_EMAIL_SUBJECT_TEMPLATE.format(workflow_type=workflow.workflow_type.get_human_friendly_text()),
            message=approval_message,
        )