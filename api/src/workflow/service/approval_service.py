import logging

from sqlalchemy import select

from src.adapters import db
from src.constants.lookup_constants import ApprovalResponseType, ApprovalType
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowApproval
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.workflow_constants import WorkflowConstants
from src.workflow.workflow_errors import InvalidWorkflowResponseTypeError

logger = logging.getLogger(__name__)


def get_approvals_for_workflow(
    db_session: db.Session,
    workflow: Workflow,
    approval_type: ApprovalType,
    approving_user: User | None = None,
    is_valid_events: bool = True,
) -> list[WorkflowApproval]:
    """Get a list of approvals for a given workflow."""
    # We query the DB rather than using workflow.workflow_approvals
    # so we can filter.
    stmt = (
        select(WorkflowApproval)
        .where(WorkflowApproval.workflow == workflow)
        .where(WorkflowApproval.approval_type == approval_type)
    )

    if approving_user is not None:
        stmt = stmt.where(WorkflowApproval.approving_user_id == approving_user.user_id)

    if is_valid_events:
        stmt = stmt.where(WorkflowApproval.is_still_valid.is_(True))

    approvals = db_session.execute(stmt).scalars()

    return list(approvals)


def get_approval_response_type(state_machine_event: StateMachineEvent) -> ApprovalResponseType:
    """Get the approval response type from the state machine event."""
    raw_value = state_machine_event.get_metadata_value(WorkflowConstants.APPROVAL_RESPONSE_TYPE)

    if raw_value is None:
        logger.warning(
            "Approval response type not found for state machine event",
            extra=state_machine_event.get_log_extra(),
        )
        raise InvalidWorkflowResponseTypeError(
            "Approval response type not found for state machine event"
        )

    try:
        return ApprovalResponseType(raw_value)
    except ValueError as e:
        logger.warning(
            "Approval response type is not a valid value", extra=state_machine_event.get_log_extra()
        )
        raise InvalidWorkflowResponseTypeError("Approval response type is not a valid value") from e
