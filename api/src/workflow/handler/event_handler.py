import logging
import uuid

from sqlalchemy import select
from statemachine.exceptions import InvalidStateValue, TransitionNotAllowed

from src.adapters import db
from src.constants.lookup_constants import WorkflowEventType, WorkflowType
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowEventHistory
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.event.workflow_event import WorkflowEvent
from src.workflow.listener.workflow_audit_listener import WorkflowAuditListener
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entity,
    is_event_valid_for_workflow,
)
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_constants import WorkflowConstants
from src.workflow.workflow_errors import (
    InvalidEventError,
    InvalidWorkflowTypeError,
    UnexpectedStateError,
    UserDoesNotExist,
)

logger = logging.getLogger(__name__)


class EventHandler:
    """
    Handle a workflow event and run it against the underlying state machine.

    The event handler does the following:
    * Validates the event, ensuring that it makes sense and connects
      to an actual workflow.
    * Fetches any entities associated with the workflow
    * Fetches the user associated with the workflow
    * Instantiates and runs the workflow against the underlying state machine

       Usage:

          event_handler = EventHandler(db_session, event)
          try:
             # For convenience, the state machine is returned
             # although outside of testing you can ignore this generally
             state_machine = event_handler.process()
          except NonRetryableWorkflowError as e:
             ...
          except RetryableWorkflowError as e:
             ...
          except Exception as e:
             ...
    """

    def __init__(
        self, db_session: db.Session, event: WorkflowEvent, history_event: WorkflowEventHistory
    ):
        self.db_session = db_session
        self.event = event
        self.history_event = history_event

    def process(self) -> BaseStateMachine:
        """Process an event."""
        state_machine_event = self._pre_process_event()
        return self._process_event(state_machine_event)

    def _process_event(self, state_machine_event: StateMachineEvent) -> BaseStateMachine:
        """Run the state machine event against the state machine."""
        # Attach the workflow to the history event.
        self.history_event.workflow = state_machine_event.workflow

        persistence_model = state_machine_event.config.persistence_model_cls(
            db_session=self.db_session, workflow=state_machine_event.workflow
        )

        # Create the audit listener to track all state transitions
        audit_listener = WorkflowAuditListener(db_session=self.db_session)

        state_machine = state_machine_event.state_machine_cls(
            persistence_model, listeners=[audit_listener]
        )
        log_extra = self.event.get_log_extra() | {"current_workflow_state": persistence_model.state}

        if not is_event_valid_for_workflow(state_machine_event.event_to_send, state_machine):
            logger.warning(
                "Event is not valid for workflow",
                extra=log_extra | {"erroring_event": state_machine_event.event_to_send},
            )
            raise InvalidEventError("Event is not valid for workflow")

        try:
            state_machine.send(
                event=state_machine_event.event_to_send, state_machine_event=state_machine_event
            )
        except TransitionNotAllowed as e:
            logger.warning(
                "Event is not valid for current state of workflow",
                extra=log_extra | {"erroring_event": state_machine_event.event_to_send},
            )
            raise InvalidEventError("Event is not valid for current state of workflow") from e
        except InvalidStateValue as e:
            logger.error("Workflow record has an unexpected state", extra=log_extra)
            raise UnexpectedStateError("Workflow record has an unexpected state") from e

        return state_machine

    def _pre_process_event(self) -> StateMachineEvent:
        """
        Convert an event from SQS to a format that we can
        easily use with the state machine. Also handles validating
        and fetching any DB models necessary for processing the event.
        """
        if self.event.event_type == WorkflowEventType.START_WORKFLOW:
            return self._pre_process_new_workflow_event()

        # PROCESS_WORKFLOW event type
        return self._pre_process_existing_workflow_event()

    def _pre_process_new_workflow_event(self) -> StateMachineEvent:
        """Pre-process a new workflow event.

        Parse and validates that the information passed in makes sense
        and is something we want to pass to the underlying state machine.

        This includes:
        * Validating that the start workflow context is present
        * Fetching and validating that the state machine for the given workflow type exists
        * Verifying the entities exist / make sense for the given workflow
        * Fetching the acting user

        With all of this validation, we can create a state machine event
        which can have stronger type enforcement.
        """
        log_extra = self.event.get_log_extra()

        if self.event.start_workflow_context is None:
            logger.warning(
                "Start workflow event has a null start workflow context", extra=log_extra
            )
            raise InvalidEventError("Start workflow event cannot have null context")

        context = self.event.start_workflow_context

        config, state_machine_cls = self._get_state_machine_for_workflow_type(context.workflow_type)

        workflow_entity = get_workflow_entity(
            self.db_session,
            entity_type=context.entity_type,
            entity_id=context.entity_id,
            config=config,
        )

        workflow = Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type=context.workflow_type,
            # When initializing a workflow, grab the current state from
            # the state machine class. Note the .value is needed as it
            # otherwise won't realize the StrEnum is also a string and error.
            current_workflow_state=state_machine_cls.initial_state.value,
            is_active=True,
            **workflow_entity
        )
        self.db_session.add(workflow)

        return StateMachineEvent(
            event_to_send=WorkflowConstants.START_WORKFLOW,
            acting_user=self._get_user(),
            workflow=workflow,
            config=config,
            state_machine_cls=state_machine_cls,
            workflow_history_event=self.history_event,
            metadata=self.event.metadata,
        )

    def _pre_process_existing_workflow_event(self) -> StateMachineEvent:
        """Pre-process a process_workflow event.

        Parse and validates that the information passed in makes sense
        and is something we want to pass to the underlying state machine.

        This includes:
        * Validating that the process workflow context is present
        * Fetching and verifying that the workflow exists in our DB
        * Fetching the acting user
        """

        log_extra = self.event.get_log_extra()

        if self.event.process_workflow_context is None:
            logger.warning(
                "Process workflow event has a null process workflow context", extra=log_extra
            )
            raise InvalidEventError("Process workflow event has a null process workflow context")

        workflow = get_and_validate_workflow(
            self.db_session, self.event.process_workflow_context.workflow_id, log_extra
        )

        config, state_machine_cls = self._get_state_machine_for_workflow_type(
            workflow.workflow_type
        )

        return StateMachineEvent(
            event_to_send=self.event.process_workflow_context.event_to_send,
            acting_user=self._get_user(),
            workflow=workflow,
            config=config,
            state_machine_cls=state_machine_cls,
            workflow_history_event=self.history_event,
            metadata=self.event.metadata,
        )

    def _get_state_machine_for_workflow_type(
        self, workflow_type: WorkflowType
    ) -> tuple[WorkflowConfig, type[BaseStateMachine]]:
        try:
            return WorkflowRegistry.get_state_machine_for_workflow_type(workflow_type)
        except InvalidWorkflowTypeError:
            logger.warning(
                "Cannot find state machine for workflow type", extra=self.event.get_log_extra()
            )
            raise  # reraise after logging

    def _get_user(self) -> User:
        """Get the user associated with the workflow event.
        Error if the user doesn't exist.
        """
        user = self.db_session.scalar(select(User).where(User.user_id == self.event.acting_user_id))

        if user is None:
            logger.warning(
                "User does not exist, cannot process event.", extra=self.event.get_log_extra()
            )
            raise UserDoesNotExist("User does not exist, cannot process event.")
        return user
