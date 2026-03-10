import logging

from sqlalchemy import select

from src.adapters import db
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import ApprovalResponseType, ApprovalType
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowApproval
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_constants import WorkflowConstants
from src.workflow.workflow_errors import (
    ImplementationMissingError,
    InvalidWorkflowResponseTypeError,
    OpportunityWithoutAgencyError,
)

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


def get_approval_response_type_from_metadata(metadata: dict | None) -> ApprovalResponseType:
    """Get the approval response type from a metadata dict."""
    raw_value = None
    if metadata is not None:
        raw_value = metadata.get(WorkflowConstants.APPROVAL_RESPONSE_TYPE)

    if raw_value is None:
        logger.warning("Approval response type not found in metadata")
        raise InvalidWorkflowResponseTypeError("Approval response type not found in metadata")

    try:
        return ApprovalResponseType(raw_value)
    except ValueError as e:
        logger.warning("Approval response type is not a valid value")
        raise InvalidWorkflowResponseTypeError("Approval response type is not a valid value") from e


def get_approval_response_type(state_machine_event: StateMachineEvent) -> ApprovalResponseType:
    """Get the approval response type from the state machine event (for state machine usage)."""
    return get_approval_response_type_from_metadata(state_machine_event.metadata)


def get_agency_for_workflow(workflow: Workflow) -> Agency:
    # From the workflow entity, find the opportunity
    # which we'll in turn use to get the agency
    opportunity: Opportunity | None = None
    if workflow.opportunity is not None:
        opportunity = workflow.opportunity
    elif workflow.application is not None:
        opportunity = workflow.application.competition.opportunity
    elif workflow.application_submission is not None:
        opportunity = workflow.application_submission.application.competition.opportunity

    if opportunity is None:
        raise ImplementationMissingError("No approach implemented to find agency for workflow")

    if opportunity.agency_record is None:
        raise OpportunityWithoutAgencyError("Opportunity does not have an agency record")

    return opportunity.agency_record


def can_user_do_agency_approval(
    user: User, workflow: Workflow, config: WorkflowConfig, event_to_send: str
) -> bool:
    """Check if a user can do an approval for a given workflow."""
    log_extra = workflow.get_log_extra() | {"user_id": user.user_id, "event_to_send": event_to_send}

    approval_config = config.approval_mapping.get(event_to_send)

    if approval_config is None:
        logger.info("No approval mapping found for event", extra=log_extra)
        return False

    # Technically, an opportunity can have a null agency record
    # As a safety precaution, if we ever see this, disallow access
    # regardless of the other agencies that might be present.
    try:
        agency = get_agency_for_workflow(workflow)
    except OpportunityWithoutAgencyError:
        logger.warning("Opportunity associated with workflow has no agency", extra=log_extra)
        return False
    except ImplementationMissingError:
        logger.warning("No way to determine agency for workflow", extra=log_extra)
        return False

    log_extra |= {
        "agency_id": agency.agency_id,
        "agency_code": agency.agency_code,
    }

    required_privileges = set(approval_config.required_privileges)

    logger.info("Checking if user can access agency for approvals", extra=log_extra)
    if not can_access(user, required_privileges, agency):
        logger.info("User cannot access agency for approvals", extra=log_extra)
        return False

    logger.info("User can access agencies for approvals", extra=log_extra)
    return True
