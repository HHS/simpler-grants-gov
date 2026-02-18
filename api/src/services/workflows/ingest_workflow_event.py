import logging
import uuid
from typing import Any

import src.workflow.state_machine  # noqa: F401  # Import to register all state machines
from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import WorkflowEventType
from src.workflow.event.workflow_event import ProcessWorkflowEventContext, StartWorkflowEventContext
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entities,
    is_event_valid_for_workflow,
)
from src.workflow.workflow_errors import (
    EntityNotFound,
    InactiveWorkflowError,
    InvalidEntityForWorkflow,
    InvalidEventError,
    InvalidWorkflowTypeError,
    WorkflowDoesNotExistError,
)

logger = logging.getLogger(__name__)


def ingest_workflow_event(db_session: db.Session, json_data: dict[str, Any]) -> uuid.UUID:
    """
    Ingest and validate workflow events.

    Validates:
    - For start_workflow events:
      - Entity IDs exist (404 if not)
      - Workflow type is real and configured (422 if not)
      - Workflow type accepts the entity types (422 if not)
    - For process_workflow events:
      - Workflow exists and is active (404 if missing, 422 if inactive)
      - Event is valid for the workflow (422 if not)
    """
    event_id = uuid.uuid4()
    event_type = json_data.get("event_type")

    logger.info(
        "Ingesting workflow event",
        extra={"event_id": event_id, "event_type": event_type},
    )

    try:
        if event_type == WorkflowEventType.START_WORKFLOW:
            _validate_start_workflow_event(db_session, json_data)
        elif event_type == WorkflowEventType.PROCESS_WORKFLOW:
            _validate_process_workflow_event(db_session, json_data)

    except EntityNotFound as e:
        logger.warning("Entity not found for workflow event", extra={"event_id": event_id})
        raise_flask_error(404, str(e))
    except WorkflowDoesNotExistError as e:
        logger.warning("Workflow does not exist", extra={"event_id": event_id})
        raise_flask_error(404, str(e))
    except (
        InvalidWorkflowTypeError,
        InvalidEntityForWorkflow,
        InactiveWorkflowError,
        InvalidEventError,
    ) as e:
        logger.warning("Invalid workflow event", extra={"event_id": event_id})
        raise_flask_error(422, str(e))

    logger.info(
        "Successfully validated workflow event",
        extra={"event_id": event_id, "event_type": event_type},
    )

    return event_id


def _validate_start_workflow_event(db_session: db.Session, json_data: dict[str, Any]) -> None:
    """Validate a start_workflow event."""
    start_context_data = json_data.get("start_workflow_context", {})
    start_context = StartWorkflowEventContext(**start_context_data)

    # Get the workflow config and state machine class - validates that the workflow type is real and configured
    config, _ = WorkflowRegistry.get_state_machine_for_workflow_type(start_context.workflow_type)

    # Validate entities exist and match the workflow's allowed entity types
    get_workflow_entities(db_session, start_context.entities, config)


def _validate_process_workflow_event(db_session: db.Session, json_data: dict[str, Any]) -> None:
    """Validate a process_workflow event."""
    process_context_data = json_data.get("process_workflow_context", {})
    process_context = ProcessWorkflowEventContext(**process_context_data)

    # Validate workflow exists and is active
    workflow = get_and_validate_workflow(db_session, process_context.workflow_id)

    # Get the state machine class for this workflow type
    _, state_machine_cls = WorkflowRegistry.get_state_machine_for_workflow_type(
        workflow.workflow_type
    )

    # Validate the event is valid for this workflow
    if not is_event_valid_for_workflow(process_context.event_to_send, state_machine_cls):
        raise InvalidEventError(
            f"Event '{process_context.event_to_send}' is not valid for this workflow"
        )
