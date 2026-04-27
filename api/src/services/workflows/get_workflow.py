import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import get_users_with_privileges_for_agency, verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.award_recommendation_models import AwardRecommendation
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.db.models.workflow_models import (
    Workflow,
    WorkflowApproval,
    WorkflowAudit,
    WorkflowEventHistory,
)
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.approval_service import get_agency_for_workflow
from src.workflow.workflow_errors import InvalidEntityForWorkflow, OpportunityWithoutAgencyError

logger = logging.getLogger(__name__)


def _workflow_load_options() -> list:
    """Return the selectinload options needed to fully load a Workflow for the GET response."""
    return [
        # Load audit events with acting user details
        selectinload(Workflow.workflow_audits).options(
            selectinload(WorkflowAudit.acting_user).options(
                selectinload(User.linked_login_gov_external_user),
                selectinload(User.profile),
            ),
            selectinload(WorkflowAudit.event),
        ),
        # Load approvals with approving user details
        selectinload(Workflow.workflow_approvals)
        .selectinload(WorkflowApproval.approving_user)
        .options(
            selectinload(User.linked_login_gov_external_user),
            selectinload(User.profile),
        ),
        # Load entity relationships for auth checks
        selectinload(Workflow.opportunity).selectinload(Opportunity.agency_record),
        selectinload(Workflow.application)
        .selectinload(Application.competition)
        .selectinload(Competition.opportunity)
        .selectinload(Opportunity.agency_record),
        selectinload(Workflow.application_submission)
        .selectinload(ApplicationSubmission.application)
        .selectinload(Application.competition)
        .selectinload(Competition.opportunity)
        .selectinload(Opportunity.agency_record),
        selectinload(Workflow.award_recommendation)
        .selectinload(AwardRecommendation.opportunity)
        .selectinload(Opportunity.agency_record),
    ]


def _sort_workflow_collections(workflow: Workflow) -> None:
    """Sort audit and approval collections on a workflow by created_at."""
    workflow.workflow_audits.sort(key=lambda a: a.created_at)
    workflow.workflow_approvals.sort(key=lambda a: a.created_at)


def _get_workflow(db_session: db.Session, workflow_id: uuid.UUID) -> Workflow | None:
    """
    Internal function to fetch workflow.

    Args:
        db_session: Database session
        workflow_id: UUID of the workflow to fetch

    Returns:
        Workflow object with all relationships loaded, or None if not found
    """
    stmt = (
        select(Workflow)
        .where(Workflow.workflow_id == workflow_id)
        .options(*_workflow_load_options())
    )

    workflow = db_session.execute(stmt).scalar_one_or_none()

    if workflow is not None:
        _sort_workflow_collections(workflow)

    return workflow


def _verify_workflow_access_and_build_config(
    db_session: db.Session, user: User, workflow: Workflow
) -> Workflow:
    """
    Verify user access to a workflow and build its approval config.

    Args:
        db_session: Database session
        user: User requesting access
        workflow: Workflow to verify access for

    Returns:
        Workflow object with approval config and valid events attached

    Raises:
        403: If user doesn't have required privilege or entity type not supported
    """
    log_extra: dict = {"user_id": user.user_id, "workflow_id": workflow.workflow_id}

    try:
        agency = get_agency_for_workflow(workflow)
    except OpportunityWithoutAgencyError:
        logger.warning("Opportunity associated with workflow has no agency", extra=log_extra)
        raise_flask_error(403, message="Forbidden")

    log_extra["agency_id"] = str(agency.agency_id)
    log_extra["agency_code"] = agency.agency_code

    # Determine required privilege based on entity type
    required_privilege: Privilege
    if workflow.opportunity_id is not None:
        required_privilege = Privilege.VIEW_OPPORTUNITY
        log_extra["entity_type"] = "opportunity"
    elif workflow.application_id is not None:
        required_privilege = Privilege.VIEW_APPLICATION
        log_extra["entity_type"] = "application"
    elif workflow.application_submission_id is not None:
        logger.warning("Application submission workflows not yet supported", extra=log_extra)
        raise_flask_error(
            403,
            message="Application submission workflows are not yet accessible through this endpoint",
        )
    elif workflow.award_recommendation_id is not None:
        required_privilege = Privilege.VIEW_AWARD_RECOMMENDATION
        log_extra["entity_type"] = "award_recommendation"
    else:
        logger.error("Workflow has no entity ID", extra=log_extra)
        raise_flask_error(403, message="Forbidden")

    log_extra["required_privilege"] = required_privilege.value

    logger.info("Checking user access to workflow", extra=log_extra)
    verify_access(user, {required_privilege}, agency)

    logger.info("User has access to workflow", extra=log_extra)

    approval_config = build_workflow_approval_config(db_session, workflow, agency)
    workflow.workflow_approval_config = approval_config  # type: ignore[attr-defined]

    valid_events = get_valid_events_for_workflow(db_session, workflow)
    workflow.valid_events = valid_events  # type: ignore[attr-defined]

    return workflow


def get_workflow_and_verify_access(
    db_session: db.Session, user: User, workflow_id: uuid.UUID
) -> Workflow:
    """
    Public function to fetch a workflow with authorization checks.

    Args:
        db_session: Database session
        user: User requesting the workflow
        workflow_id: UUID of the workflow to fetch

    Returns:
        Workflow object if user has access

    Raises:
        404: If workflow doesn't exist
        403: If user doesn't have required privilege or entity type not supported
    """
    log_extra: dict = {"user_id": user.user_id, "workflow_id": workflow_id}
    logger.info("Fetching workflow for user", extra=log_extra)

    workflow = _get_workflow(db_session, workflow_id)

    if workflow is None:
        logger.info("Workflow not found", extra=log_extra)
        raise_flask_error(404, message=f"Could not find Workflow with ID {workflow_id}")

    return _verify_workflow_access_and_build_config(db_session, user, workflow)


def get_workflow_by_event_id_and_verify_access(
    db_session: db.Session, user: User, event_id: uuid.UUID
) -> Workflow:
    """
    Fetch a workflow via its event ID with authorization checks.

    Args:
        db_session: Database session
        user: User requesting the workflow
        event_id: UUID of the workflow event history entry

    Returns:
        Workflow object if user has access

    Raises:
        404: If event or its associated workflow doesn't exist
        403: If user doesn't have required privilege or entity type not supported
    """
    log_extra: dict = {"user_id": user.user_id, "event_id": event_id}
    logger.info("Fetching workflow by event ID for user", extra=log_extra)

    stmt = (
        select(WorkflowEventHistory)
        .where(WorkflowEventHistory.event_id == event_id)
        .options(selectinload(WorkflowEventHistory.workflow).options(*_workflow_load_options()))
    )

    event = db_session.execute(stmt).scalar_one_or_none()

    if event is None:
        logger.info("Event not found", extra=log_extra)
        raise_flask_error(404, message=f"Could not find Event with ID {event_id}")

    if event.workflow is None:
        logger.info("Event has no associated workflow", extra=log_extra)
        raise_flask_error(404, message=f"Could not find Workflow for Event with ID {event_id}")

    _sort_workflow_collections(event.workflow)

    return _verify_workflow_access_and_build_config(db_session, user, event.workflow)


def get_valid_events_for_workflow(db_session: db.Session, workflow: Workflow) -> list[str]:
    """
    Get the list of valid events that can be sent for the current state of a workflow.

    If the workflow is no longer active (has reached an end state), returns an empty list.

    Args:
        db_session: Database session
        workflow: Workflow object

    Returns:
        List of event name strings valid for the current workflow state
    """
    if not workflow.is_active:
        return []

    config, state_machine_cls = WorkflowRegistry.get_state_machine_for_workflow_type(
        workflow.workflow_type
    )

    try:
        persistence_model = config.persistence_model_cls(db_session, workflow)
        state_machine = state_machine_cls(persistence_model)
    except InvalidEntityForWorkflow:
        logger.warning(
            "Could not instantiate state machine for workflow, entity type mismatch",
            extra=workflow.get_log_extra(),
        )
        return []

    return state_machine.get_valid_events_for_current_state()


def build_workflow_approval_config(
    db_session: db.Session, workflow: Workflow, agency: Agency
) -> dict[str, dict]:
    """
    Build approval configuration dict with possible users for each approval event.

    Args:
        db_session: Database session
        workflow: Workflow object
        agency: Agency associated with the workflow

    Returns:
        Dict mapping event names to approval configuration dicts
        Example: {
            "receive_program_officer_approval": {
                "approval_type": "PROGRAM_OFFICER_APPROVAL",
                "required_privileges": ["PROGRAM_OFFICER_APPROVAL"],
                "possible_users": [...]
            }
        }
    """
    log_extra: dict = workflow.get_log_extra() | {"agency_id": agency.agency_id}
    logger.info("Building workflow approval config", extra=log_extra)

    config, _ = WorkflowRegistry.get_state_machine_for_workflow_type(workflow.workflow_type)

    approval_config_dict = {}

    # Build config for each approval event
    for event_name, approval_config in config.approval_mapping.items():
        event_log_extra = {
            "event_name": event_name,
            "approval_type": approval_config.approval_type.value,
        }
        logger.debug("Processing approval config for event", extra=log_extra | event_log_extra)

        possible_users = get_users_with_privileges_for_agency(
            db_session, agency, approval_config.required_privileges
        )

        logger.debug(
            "Found possible users for approval",
            extra=log_extra | event_log_extra | {"possible_users_count": len(possible_users)},
        )

        approval_config_dict[event_name] = {
            "approval_type": approval_config.approval_type,
            "required_privileges": approval_config.required_privileges,
            "allowed_approval_response_types": list(
                approval_config.allowed_approval_response_types
            ),
            "possible_users": possible_users,
        }

    logger.info(
        "Built workflow approval config",
        extra=log_extra | {"config_events_count": len(approval_config_dict)},
    )
    return approval_config_dict
