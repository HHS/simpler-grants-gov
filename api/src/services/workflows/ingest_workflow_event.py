import logging
import uuid
from typing import Any

import src.workflow.state_machine  # noqa: F401  # Import to register all state machines
from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import WorkflowEventType
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.workflow.event.workflow_event import ProcessWorkflowEventContext, StartWorkflowEventContext
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entity,
    is_event_valid_for_workflow,
)
from src.workflow.workflow_errors import (
    EntityNotFound,
    InactiveWorkflowError,
    InvalidEntityForWorkflow,
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

    add_extra_data_to_current_request_logs({"event_id": event_id, "event_type": event_type})
    logger.info("Ingesting workflow event")

    try:
        if event_type == WorkflowEventType.START_WORKFLOW:
            _validate_start_workflow_event(db_session, json_data)
        elif event_type == WorkflowEventType.PROCESS_WORKFLOW:
            _validate_process_workflow_event(db_session, json_data)

    except EntityNotFound as e:
        logger.info("Entity not found for workflow event", extra={"error": str(e)})
        raise_flask_error(404, "The specified resource was not found")
    except WorkflowDoesNotExistError as e:
        logger.info("Workflow does not exist", extra={"error": str(e)})
        raise_flask_error(404, "The specified workflow was not found")
    except InvalidWorkflowTypeError as e:
        logger.info("Invalid workflow type", extra={"error": str(e)})
        raise_flask_error(422, "Invalid workflow type specified")
    except InvalidEntityForWorkflow as e:
        logger.info("Invalid entities for workflow", extra={"error": str(e)})
        raise_flask_error(422, "The provided entity is not valid for this workflow type")
    except InactiveWorkflowError as e:
        logger.info("Workflow is not active", extra={"error": str(e)})
        raise_flask_error(422, "This workflow is not currently active")

    logger.info("Successfully validated workflow event")

    return event_id


def _validate_start_workflow_event(db_session: db.Session, json_data: dict[str, Any]) -> None:
    """Validate a start_workflow event."""
    # Note: start_workflow_context is guaranteed to be present due to schema validation
    start_context_data = json_data.get("start_workflow_context", {})
    start_context = StartWorkflowEventContext(**start_context_data)

    # Get the workflow config and state machine class - validates that the workflow type is real and configured
    config, _ = WorkflowRegistry.get_state_machine_for_workflow_type(start_context.workflow_type)

    # Validate entity exists and matches the workflow's allowed entity type
    get_workflow_entity(
        db_session,
        entity_type=start_context.entity_type,
        entity_id=start_context.entity_id,
        config=config,
    )


def _validate_process_workflow_event(db_session: db.Session, json_data: dict[str, Any]) -> None:
    """Validate a process_workflow event."""
    # Note: process_context_data is guaranteed to be present due to schema validation
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
        logger.info(
            "Invalid event for workflow",
            extra={
                "error": f"Event '{process_context.event_to_send}' is not valid for this workflow"
            },
        )
        raise_flask_error(422, "The specified event is not valid for this workflow")
