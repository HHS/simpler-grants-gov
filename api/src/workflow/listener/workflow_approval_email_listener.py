import logging

from statemachine.event_data import EventData

from src.adapters import db
from src.auth.endpoint_access_util import get_users_with_privileges_for_agency
from src.db.models.user_models import User
from src.task.notifications.config import get_email_config
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.service.approval_service import get_agency_for_workflow
from src.workflow.util.workflow_util import send_workflow_email
from src.workflow.workflow_errors import OpportunityWithoutAgencyError

logger = logging.getLogger(__name__)

APPROVAL_EMAIL_SUBJECT_TEMPLATE = "Approval required for '{workflow_type}'"

APPROVAL_EMAIL_TEMPLATE = """An approval is required for a {workflow_type} that is currently in state '{current_workflow_state}' from a user with the following privilege(s): {privileges}.

ID: {workflow_id}
Agency: {agency_code}: {agency_name}

Please visit {url} to make this update.
"""


class WorkflowApprovalEmailListener:
    """
    Listener for state machine transitions that automatically
    sends emails to approval users whenever a workflow
    enters into a state that requires approval.
    """

    def __init__(self, db_session: db.Session):
        """
        Initialize the approval email listener.
        """
        self.db_session = db_session

    def on_enter_state(self, state_machine_event: StateMachineEvent, event_data: EventData) -> None:
        """
        Listen for events when a workflow enters a state that is also an approval.
        """
        target_state = event_data.target.value
        log_extra = state_machine_event.get_log_extra() | {
            "source_state": event_data.source.value,
            "target_state": target_state,
        }

        approval_config = state_machine_event.config.state_approval_mapping.get(target_state, None)
        if approval_config is None:
            logger.debug(
                "State does not have approval, no email notification required", extra=log_extra
            )
            return

        # If the state machine's state is changing as part of this
        # then we don't want to do anything. We only want to send
        # emails when first entering the state.
        if event_data.source == target_state:
            logger.debug("State is not changing, not sending approval emails.", extra=log_extra)
            return

        try:
            agency = get_agency_for_workflow(state_machine_event.workflow)
        except OpportunityWithoutAgencyError:
            logger.exception(
                "Opportunity associated with workflow does not have an agency - cannot determine users.",
                extra=log_extra,
            )
            return

        users: list[User] = get_users_with_privileges_for_agency(
            self.db_session,
            agency,
            approval_config.required_privileges,
            filter_out_suppressed_emails=True,
        )

        if len(users) == 0:
            logger.warning("No users can do approval - cannot send email", extra=log_extra)
            return

        subject = APPROVAL_EMAIL_SUBJECT_TEMPLATE.format(
            workflow_type=state_machine_event.workflow.workflow_type.get_human_friendly_text()
        )

        approval_message = APPROVAL_EMAIL_TEMPLATE.format(
            workflow_id=state_machine_event.workflow.workflow_id,
            current_workflow_state=state_machine_event.workflow.current_workflow_state,
            workflow_type=state_machine_event.workflow.workflow_type.get_human_friendly_text(),
            agency_code=agency.agency_code,
            agency_name=agency.agency_name,
            privileges=",".join(approval_config.required_privileges),
            url=get_email_config().frontend_base_url,
        )

        for user in users:
            send_workflow_email(
                workflow=state_machine_event.workflow,
                user=user,
                subject=subject,
                message=approval_message,
            )
