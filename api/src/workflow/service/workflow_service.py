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
    ConcurrentWorkflowError,
    EntityNotFound,
    ImplementationMissingError,
    InactiveWorkflowError,
    WorkflowDoesNotExistError,
)

logger = logging.getLogger(__name__)


def get_workflow_entity(
    db_session: db.Session,
    entity_id: uuid.UUID,
    config: WorkflowConfig,
) -> dict[str, ApiSchemaTable]:
    """Get a workflow entity map that can be used to create a workflow.

    Handles validating and making sure exactly one entity is found.

    Expected usage:

        workflow_entity = get_workflow_entity(...)
        workflow = Workflow(..., **workflow_entity)
    """
    entity_type = config.entity_type

    log_extra: dict[str, Any] = {
        "workflow_type": config.workflow_type,
        "entity_type": entity_type,
    }

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


ENTITY_TYPE_TO_COLUMN = {
    WorkflowEntityType.OPPORTUNITY: Workflow.opportunity_id,
    WorkflowEntityType.APPLICATION: Workflow.application_id,
}


def validate_no_concurrent_workflow(
    db_session: db.Session,
    entity_id: uuid.UUID,
    config: WorkflowConfig,
) -> None:
    """Validate that no active workflow of the given type already exists for the entity.

    If the workflow config allows concurrent workflows, this is a no-op.
    Otherwise, raises ConcurrentWorkflowError if an active workflow already exists.
    """
    if config.allow_concurrent_workflow_for_entity:
        return

    workflow_type = config.workflow_type
    entity_type = config.entity_type

    entity_column = ENTITY_TYPE_TO_COLUMN.get(entity_type)
    if entity_column is None:
        raise ImplementationMissingError(
            f"Entity type {entity_type} is not configured for concurrent workflow validation"
        )

    existing_workflow = db_session.scalar(
        select(Workflow).where(
            Workflow.workflow_type == workflow_type,
            entity_column == entity_id,
            Workflow.is_active.is_(True),
        )
    )

    if existing_workflow is not None:
        logger.warning(
            "An active workflow already exists for this entity",
            extra={
                "workflow_type": workflow_type,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "existing_workflow_id": existing_workflow.workflow_id,
            },
        )
        raise ConcurrentWorkflowError(
            "An active workflow of this type already exists for this entity"
        )
