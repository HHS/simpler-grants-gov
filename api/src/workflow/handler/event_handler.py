import logging
import uuid

from sqlalchemy import select
from statemachine.exceptions import InvalidStateValue, TransitionNotAllowed

from src.adapters import db
from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.db.models.base import ApiSchemaTable
from src.db.models.competition_models import Application
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.event.workflow_event import WorkflowEntity, WorkflowEvent
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.service.workflow_service import get_workflow_entities
from src.workflow.state_persistence.base_state_persistence_model import Workflow
from src.workflow.workflow_config import WorkflowConfig
from src.workflow.workflow_errors import (
    EntityNotFound,
    InvalidEventError,
    InvalidWorkflowTypeError,
    UnexpectedStateError,
    UserDoesNotExist,
    WorkflowDoesNotExistError,
)

logger = logging.getLogger(__name__)


class EventHandler:

    def __init__(self, db_session: db.Session, event: WorkflowEvent):
        self.db_session = db_session
        self.event = event

    def process(self) -> BaseStateMachine:
        state_machine_event = self._pre_process_event()
        return self._process_event(state_machine_event)

    def _process_event(self, state_machine_event: StateMachineEvent) -> BaseStateMachine:

        persistence_model = state_machine_event.config.persistence_model(
            db_session=self.db_session, workflow=state_machine_event.workflow
        )

        state_machine = state_machine_event.state_machine_cls(persistence_model)
        log_extra = self.event.get_log_extra() | {
            "current_workflow_state": state_machine.current_state
        }

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

        workflow_entities = get_workflow_entities(self.db_session, context.entities, config)

        workflow = Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type=context.workflow_type,
            # When initializing a workflow, grab the current state from
            # the state machine class. Note the str() is needed as it
            # otherwise won't realize the StrEnum is also a string and error.
            current_workflow_state=str(state_machine_cls.initial_state),
            is_active=True,
            **workflow_entities
        )
        # self.db_session.add(workflow) # TODO - when DB table exists

        return StateMachineEvent(
            event_to_send="start_workflow",
            acting_user=self._get_user(),
            workflow=workflow,
            config=config,
            state_machine_cls=state_machine_cls,
            metadata=self.event.metadata,
        )

    def _pre_process_existing_workflow_event(self) -> StateMachineEvent:
        """TODO"""

        log_extra = self.event.get_log_extra()

        if self.event.process_workflow_context is None:
            logger.warning(
                "Process workflow event has a null process workflow context", extra=log_extra
            )
            raise InvalidEventError("Process workflow event has a null process workflow context")

        workflow = self.db_session.scalar(
            select(Workflow).where(
                Workflow.workflow_id == self.event.process_workflow_context.workflow_id
            )
        )

        if workflow is None:
            logger.warning("Workflow does not exist - cannot process event", extra=log_extra)
            raise WorkflowDoesNotExistError(
                "Workflow does not exist, cannot process events against it"
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
