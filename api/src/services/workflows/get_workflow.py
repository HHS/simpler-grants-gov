import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import get_users_with_privileges_for_agency, verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowApproval, WorkflowAudit
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.approval_service import get_agency_for_workflow
from src.workflow.workflow_errors import OpportunityWithoutAgencyError

logger = logging.getLogger(__name__)


def _get_workflow(db_session: db.Session, workflow_id: uuid.UUID) -> Workflow | None:
    """
    Internal function to fetch workflow with comprehensive eager loading.

    Args:
        db_session: Database session
        workflow_id: UUID of the workflow to fetch

    Returns:
        Workflow object with all relationships loaded, or None if not found
    """
    stmt = (
        select(Workflow)
        .where(Workflow.workflow_id == workflow_id)
        .options(
            # Load audit events with acting user details
            selectinload(Workflow.workflow_audits)
            .selectinload(WorkflowAudit.acting_user)
            .options(
                selectinload(User.linked_login_gov_external_user),
                selectinload(User.profile),
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
        )
    )

    workflow = db_session.execute(stmt).scalar_one_or_none()

    if workflow is not None:
        workflow.workflow_audits.sort(key=lambda a: a.created_at)
        workflow.workflow_approvals.sort(key=lambda a: a.created_at)

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
    else:
        logger.error("Workflow has no entity ID", extra=log_extra)
        raise_flask_error(403, message="Forbidden")

    log_extra["required_privilege"] = required_privilege.value

    logger.info("Checking user access to workflow", extra=log_extra)
    verify_access(user, {required_privilege}, agency)

    logger.info("User has access to workflow", extra=log_extra)

    approval_config = build_workflow_approval_config(db_session, workflow, agency)
    workflow.workflow_approval_config = approval_config  # type: ignore[attr-defined]

    return workflow


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
            "possible_users": possible_users,
        }

    logger.info(
        "Built workflow approval config",
        extra=log_extra | {"config_events_count": len(approval_config_dict)},
    )
    return approval_config_dict
