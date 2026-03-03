import logging

from src.adapters import db
from src.constants.lookup_constants import ApprovalResponseType, ApprovalType
from src.db.models.agency_models import Agency
from src.db.models.user_models import User
from src.db.models.workflow_models import WorkflowApproval
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.service.approval_service import get_approvals_for_workflow
from src.workflow.workflow_config import ApprovalConfig
from src.workflow.workflow_constants import WorkflowConstants
from src.workflow.workflow_errors import DuplicateApprovalError, ImplementationMissingError

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
        """Handle receiving an Approved event"""
        return self._handle_agency_approval_event(agency, ApprovalResponseType.APPROVED)

    def handle_agency_approval_declined(self, agency: Agency) -> WorkflowApproval:
        """Handle receiving a Declined event"""
        return self._handle_agency_approval_event(agency, ApprovalResponseType.DECLINED)

    def handle_agency_approval_requires_modification(self, agency: Agency) -> WorkflowApproval:
        """Handle receiving a Requires Modification event - also marks all prior events as invalid"""
        curr_approval = self._handle_agency_approval_event(
            agency, ApprovalResponseType.REQUIRES_MODIFICATION
        )

        # if we receive a requires-modification event, set all approvals to no longer be valid.
        # This likely needs a bit more nuance to use a config to say which
        # approvals are marked invalid, but keep it simple for now.
        for approval in self.state_machine_event.workflow.workflow_approvals:
            approval.is_still_valid = False

        return curr_approval

    def _handle_agency_approval_event(
        self, agency: Agency, approval_response_type: ApprovalResponseType
    ) -> WorkflowApproval:
        """Handle an agency approval event.

        Handles:
        * Checking against the approval config for the current workflow state
        * Validating that the user doesn't already have an active approval
        * Creating a record in the workflow approval table
        """
        log_extra = self.state_machine_event.get_log_extra()
        logger.info("Handling approval event for workflow", extra=log_extra)

        user = self.state_machine_event.acting_user

        approval_config = self._get_approval_config()

        if self._has_already_approved(user, approval_config.approval_type):
            logger.info(
                "User already has an active approval for this workflow and workflow type",
                extra=log_extra,
            )
            raise DuplicateApprovalError(
                "User already has an active approval for this workflow and workflow type."
            )

        workflow_approval = WorkflowApproval(
            workflow=self.state_machine_event.workflow,
            approving_user=user,
            approval_type=approval_config.approval_type,
            event=self.state_machine_event.workflow_history_event,
            is_still_valid=True,
            approval_response_type=approval_response_type,
            comment=self.state_machine_event.get_metadata_value(WorkflowConstants.COMMENT),
        )
        self.db_session.add(workflow_approval)

        logger.info("Added approval event for workflow", extra=log_extra)
        return workflow_approval

    def has_enough_approvals(self) -> bool:
        """Get whether the workflow has enough approvals for the configured approval type."""
        log_extra = self.state_machine_event.get_log_extra()
        logger.info("Checking if workflow has enough approvals", extra=log_extra)
        approval_config = self._get_approval_config()

        approvals = get_approvals_for_workflow(
            db_session=self.db_session,
            workflow=self.state_machine_event.workflow,
            approval_type=approval_config.approval_type,
        )

        approval_count = len(approvals)
        has_enough_approvals = approval_config.minimum_approvals_required <= approval_count

        log_extra |= {
            "approval_type": approval_config.approval_type,
            "required_approval_count": approval_config.minimum_approvals_required,
            "approval_count": approval_count,
            "has_enough_approvals": has_enough_approvals,
        }

        logger.info("Finished checking whether workflow has enough approvals", extra=log_extra)

        return has_enough_approvals

    def _get_approval_config(self) -> ApprovalConfig:
        """Fetch the approval configuration based on the current state of the workflow."""
        approval_config = self.state_machine_event.config.approval_mapping.get(
            self.state_machine_event.event_to_send
        )
        if approval_config is None:
            logger.error(
                "No approval config found for current workflow state.",
                extra=self.state_machine_event.get_log_extra(),
            )
            raise ImplementationMissingError("No approval config found for current workflow state.")

        return approval_config

    def _has_already_approved(self, approving_user: User, approval_type: ApprovalType) -> bool:
        """Get whether a given user has already done an approval."""
        existing_approvals = get_approvals_for_workflow(
            db_session=self.db_session,
            workflow=self.state_machine_event.workflow,
            approval_type=approval_type,
            approving_user=approving_user,
        )

        return len(existing_approvals) > 0
