import logging
import uuid
from typing import Any

from sqlalchemy import select

from src.adapters import db
from src.constants.lookup_constants import WorkflowEntityType
from src.db.models.base import ApiSchemaTable
from src.db.models.competition_models import Application
from src.db.models.opportunity_models import Opportunity
from src.db.models.workflow_models import Workflow
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_errors import (
    EntityNotFound,
    ImplementationMissingError,
    InactiveWorkflowError,
    InvalidEntityForWorkflow,
    WorkflowDoesNotExistError,
)

logger = logging.getLogger(__name__)


def get_workflow_entity(
    db_session: db.Session,
    entity_type: WorkflowEntityType,
    entity_id: uuid.UUID,
    config: WorkflowConfig,
) -> dict[str, ApiSchemaTable]:
    """Get a workflow entity map that can be used to create a workflow.

    Handles validating and making sure exactly one entity is found.

    Expected usage:

        workflow_entity = get_workflow_entity(...)
        workflow = Workflow(..., **workflow_entity)
    """

    log_extra: dict[str, Any] = {
        "workflow_type": config.workflow_type,
        "allowed_entity_type": config.entity_type,
        "entity_type": entity_type,
    }

    if entity_type != config.entity_type:
        logger.warning("Entity given for workflow does not match expected type", extra=log_extra)
        raise InvalidEntityForWorkflow("Entity given for workflow does not match expected type")

    if entity_type == WorkflowEntityType.OPPORTUNITY:
        opportunity = db_session.scalar(
            select(Opportunity).where(Opportunity.opportunity_id == entity_id)
        )
        if opportunity is None:
            logger.warning("Opportunity not found for entity", extra=log_extra)
            raise EntityNotFound("Opportunity not found")

        return {"opportunity": opportunity}

    elif entity_type == WorkflowEntityType.APPLICATION:
        application = db_session.scalar(
            select(Application).where(Application.application_id == entity_id)
        )
        if application is None:
            logger.warning("Application not found for entity", extra=log_extra)
            raise EntityNotFound("Application not found")

        return {"application": application}

    else:  # Any unconfigured entity types will result in an error
        logger.warning("Entity type is not supported for workflow", extra=log_extra)  # type: ignore[unreachable]
        raise ImplementationMissingError("Entity type is not supported for workflow")


def is_event_valid_for_workflow(
    event: str, state_machine: type[BaseStateMachine] | BaseStateMachine
) -> bool:
    """Get whether an event could be sent to a given workflow.

    Note that this does NOT say whether it's valid for the current
    state of the workflow, just that it's one of the possible events.
    """
    return event in state_machine.get_valid_events()


def get_and_validate_workflow(
    db_session: db.Session, workflow_id: uuid.UUID, log_extra: dict | None = None
) -> Workflow:
    """Fetch a workflow and error if it doesn't exist.

    Verifies:
    * The workflow exists
    * The workflow is_active and can receive events
    """
    if log_extra is None:
        log_extra = {"workflow_id": workflow_id}

    workflow = db_session.scalar(select(Workflow).where(Workflow.workflow_id == workflow_id))

    if workflow is None:
        logger.warning("Workflow does not exist - cannot process event", extra=log_extra)
        raise WorkflowDoesNotExistError("Workflow does not exist, cannot process events against it")

    if not workflow.is_active:
        logger.warning("Workflow is not active - cannot receive events", extra=log_extra)
        raise InactiveWorkflowError("Workflow is not active - cannot receive events")

    return workflow
