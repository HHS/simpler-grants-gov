from sqlalchemy import select

from src.adapters import db
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import ApprovalResponseType
from src.db.models.agency_models import Agency
from src.db.models.workflow_models import WorkflowApproval
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.workflow_config import ApprovalConfig
import logging

logger = logging.getLogger(__name__)

class ApprovalProcessor:
    """A processor for handling approvals in our state machine.

    Importantly, this takes the current state of the workflow,
    and references the approval config for that state in order
    to do its logic.

    For example, if the current state is "pending_example_approval",
    it will check the approval config for that state when handling
    an event or checking if enough approvals have occurred.
    """
    def __init__(self, db_session: db.Session, state_machine_event: StateMachineEvent):
        self.db_session = db_session
        self.state_machine_event = state_machine_event

    def handle_agency_approval_accepted(self, agency: Agency) -> WorkflowApproval:
        return self._handle_agency_approval_event(agency, ApprovalResponseType.APPROVED)

    def handle_agency_approval_declined(self, agency: Agency) -> WorkflowApproval:
        return self._handle_agency_approval_event(agency, ApprovalResponseType.DECLINED)

    def handle_agency_approval_requires_modification(self, agency: Agency) -> WorkflowApproval:
        return self._handle_agency_approval_event(agency, ApprovalResponseType.REQUIRES_MODIFICATION)

    def _handle_agency_approval_event(self, agency: Agency, approval_response_type: ApprovalResponseType) -> WorkflowApproval:
        user = self.state_machine_event.acting_user

        log_extra = self.state_machine_event.get_log_extra()

        approval_config = self._get_approval_config()

        if not can_access(
                user, set(approval_config.required_privileges), agency
        ):
            logger.warning("User does not have access to approve workflow for given state.", extra=log_extra)
            raise Exception("TODO - access error")

        workflow_approval = WorkflowApproval(
            workflow=self.state_machine_event.workflow,
            approving_user=user,
            approval_type=approval_config.approval_type,
            event=self.state_machine_event.workflow_history_event,
            is_still_valid=True,
            approval_response_type=approval_response_type,
        )
        self.db_session.add(workflow_approval)

        return workflow_approval

    def has_enough_approvals(self) -> bool:
        """Get whether the workflow has enough approvals for the configured approval type."""
        approval_config = self._get_approval_config()

        approvals = self.db_session.execute(
            select(WorkflowApproval).where(
                WorkflowApproval.workflow_id == self.state_machine_event.workflow.workflow_id,
                WorkflowApproval.approval_type == approval_config.approval_type,
            )
        ).scalars()

        logger.info()

        return approval_config.minimum_approvals_required >= len(list(approvals))


    def _get_approval_config(self) -> ApprovalConfig:
        approval_config = self.state_machine_event.config.approval_mapping.get(
            self.state_machine_event.workflow.current_workflow_state
        )
        if approval_config is None:
            logger.error("No approval config found for current workflow state.", extra=self.state_machine_event.get_log_extra())
            raise Exception("TODO - null approval config")

        return approval_config