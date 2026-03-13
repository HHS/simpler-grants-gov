import logging
import uuid
from typing import Any, cast

import src.workflow.state_machine  # noqa: F401  # Import to register all state machines
from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege, WorkflowEventType
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.workflows.send_workflow_event import send_workflow_event_to_queue
from src.workflow.event.workflow_event import (
    ProcessWorkflowEventContext,
    StartWorkflowEventContext,
    WorkflowEvent,
)
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.approval_service import (
    can_user_do_agency_approval,
    get_approval_response_type_from_metadata,
)
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entity,
    is_event_valid_for_workflow,
)
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_constants import WorkflowConstants
from src.workflow.workflow_errors import (
    EntityNotFound,
    InactiveWorkflowError,
    InvalidEntityForWorkflow,
    InvalidWorkflowResponseTypeError,
    InvalidWorkflowTypeError,
    WorkflowDoesNotExistError,
)

logger = logging.getLogger(__name__)


def verify_user_can_access_workflow(
    user: User, workflow: Workflow | None, config: WorkflowConfig, event_to_send: str
) -> None:
    """Verify a user is allowed to send workflow events - erroring if not."""

    # For testing, we have an internal privilege capable of sending any event
    # that passes our other validation.
    if can_access(user, {Privilege.INTERNAL_WORKFLOW_EVENT_SEND}, None):
        logger.info("User has internal workflow event permissions and can send events")
        return

    # If no workflow was passed in (ie. for start-workflow) then
    # they can't send any event - start workflow events aren't directly
    # sent by users via this API besides our own internal ones for testing.
    if workflow is None:
        logger.info("User does not have permissions to send a start workflow event")
        raise_flask_error(403, "Forbidden")

    if not can_user_do_agency_approval(
        user=user, workflow=workflow, config=config, event_to_send=event_to_send
    ):
        logger.info(
            "User does not have permission to send workflow event",
            extra={"event_to_send": event_to_send},
        )
        raise_flask_error(403, "Forbidden")


def ingest_workflow_event(
    db_session: db.Session, json_data: dict[str, Any], user: User
) -> uuid.UUID:
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

    # Construct the workflow event from the request
    # but add the event ID + calling user.
    workflow_event = WorkflowEvent(event_id=uuid.uuid4(), acting_user_id=user.user_id, **json_data)

    add_extra_data_to_current_request_logs(
        {"event_id": workflow_event.event_id, "event_type": workflow_event.event_type}
    )
    logger.info("Ingesting workflow event")

    try:
        if workflow_event.event_type == WorkflowEventType.START_WORKFLOW:
            _validate_start_workflow_event(db_session, workflow_event, user)
        elif workflow_event.event_type == WorkflowEventType.PROCESS_WORKFLOW:
            _validate_process_workflow_event(db_session, workflow_event, user)

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
    except InvalidWorkflowResponseTypeError as e:
        logger.info("Invalid or missing approval response type", extra={"error": str(e)})
        raise_flask_error(422, str(e))

    logger.info("Successfully validated workflow event")
    send_workflow_event_to_queue(workflow_event)

    return workflow_event.event_id


def _validate_start_workflow_event(
    db_session: db.Session, workflow_event: WorkflowEvent, user: User
) -> None:
    """Validate a start_workflow event."""
    # Note: start_workflow_context is guaranteed to be present due to schema validation
    start_context = cast(StartWorkflowEventContext, workflow_event.start_workflow_context)

    # Get the workflow config and state machine class - validates that the workflow type is real and configured
    config, _ = WorkflowRegistry.get_state_machine_for_workflow_type(start_context.workflow_type)

    verify_user_can_access_workflow(
        user=user,
        workflow=None,
        config=config,
        # The event won't matter for the logic, but make it the start event for clarity
        event_to_send=WorkflowConstants.START_WORKFLOW,
    )

    # Validate entity exists and matches the workflow's allowed entity type
    get_workflow_entity(
        db_session,
        entity_type=start_context.entity_type,
        entity_id=start_context.entity_id,
        config=config,
    )


def _validate_process_workflow_event(
    db_session: db.Session, workflow_event: WorkflowEvent, user: User
) -> None:
    """Validate a process_workflow event."""
    # Note: process_context_data is guaranteed to be present due to schema validation
    process_context = cast(ProcessWorkflowEventContext, workflow_event.process_workflow_context)

    # Validate workflow exists and is active
    workflow = get_and_validate_workflow(db_session, process_context.workflow_id)

    # Get the state machine class for this workflow type
    config, state_machine_cls = WorkflowRegistry.get_state_machine_for_workflow_type(
        workflow.workflow_type
    )

    verify_user_can_access_workflow(
        user=user, workflow=workflow, config=config, event_to_send=process_context.event_to_send
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

    # If this is an approval event, validate required metadata
    approval_config = config.approval_mapping.get(process_context.event_to_send)
    if approval_config is not None:
        get_approval_response_type_from_metadata(workflow_event.metadata)
