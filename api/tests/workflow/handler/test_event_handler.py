import uuid

import pytest

from src.constants.lookup_constants import WorkflowType
from src.workflow.event.state_machine_event import StateMachineEvent
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_persistence.base_state_persistence_model import Workflow
from src.workflow.workflow_errors import (
    InvalidEventError,
    InvalidWorkflowTypeError,
    UnexpectedStateError,
    UserDoesNotExist,
)
from tests.src.db.models.factories import OpportunityFactory, UserFactory
from tests.workflow.state_machine.test_state_machines import (
    BasicState,
    BasicTestStateMachine,
    basic_test_workflow_config,
)
from tests.workflow.workflow_test_util import (
    build_process_workflow_event,
    build_start_workflow_event,
)


def test_start_workflow_event(db_session, enable_factory_create):

    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    event = build_start_workflow_event(
        workflow_type="basic_test_workflow",
        user=user,
        entities=[opportunity],
    )

    event_handler = EventHandler(db_session, event)
    state_machine = event_handler.process()

    assert state_machine.workflow.current_workflow_state == BasicState.MIDDLE
    assert state_machine.workflow.is_active is True

    # Verify that just one event was processed
    # and that the event has all the expected fields
    assert len(state_machine.transition_history) == 1
    state_machine_event = state_machine.transition_history[0]
    assert state_machine_event.event_to_send == "start_workflow"
    assert state_machine_event.acting_user.user_id == user.user_id
    assert state_machine_event.workflow is state_machine.workflow
    assert state_machine_event.state_machine_cls is BasicTestStateMachine


def test_process_workflow_event(db_session, enable_factory_create):

    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # TODO - create the workflow

    event = build_process_workflow_event(
        "TODO - workflow ID", user=user, event_to_send="middle_to_end"
    )

    event_handler = EventHandler(db_session, event)
    state_machine = event_handler.process()

    assert state_machine.workflow.current_workflow_state == BasicState.END
    assert state_machine.workflow.is_active is False


def test_start_workflow_event_missing_start_context(db_session, enable_factory_create):
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    event = build_start_workflow_event(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        user=user,
        entities=[opportunity],
        exclude_start_workflow_context=True,
    )

    event_handler = EventHandler(db_session, event)
    with pytest.raises(InvalidEventError, match="Start workflow event cannot have null context"):
        event_handler.process()


def test_start_workflow_event_invalid_workflow_type(db_session, enable_factory_create):
    user = UserFactory.create()

    event = build_start_workflow_event(
        workflow_type="not-a-valid-workflow-type",
        user=user,
        entities=[],
    )

    event_handler = EventHandler(db_session, event)
    with pytest.raises(
        InvalidWorkflowTypeError, match="Workflow event does not map to an actual state machine"
    ):
        event_handler.process()


def test_start_workflow_event_missing_user(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()

    event = build_start_workflow_event(
        workflow_type="basic_test_workflow",
        user=None,  # A random ID will be added
        entities=[opportunity],
    )

    event_handler = EventHandler(db_session, event)
    with pytest.raises(UserDoesNotExist, match="User does not exist"):
        event_handler.process()


def test_process_event_does_not_exist(db_session, enable_factory_create):
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    state_machine_event = StateMachineEvent(
        event_to_send="not-a-real-event",
        acting_user=user,
        workflow=Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type="basic_test_workflow",
            current_workflow_state="start",
            is_active=True,
            opportunities=[opportunity],
        ),
        state_machine_cls=BasicTestStateMachine,
        config=basic_test_workflow_config,
    )

    event_handler = EventHandler(
        db_session, build_start_workflow_event(WorkflowType.INITIAL_PROTOTYPE, user, [opportunity])
    )

    with pytest.raises(InvalidEventError, match="Event is not valid for workflow"):
        event_handler._process_event(state_machine_event)


def test_process_event_event_not_valid_for_current_state(db_session, enable_factory_create):
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    # start_workflow is a valid event, but only if
    # the current state is start.
    state_machine_event = StateMachineEvent(
        event_to_send="start_workflow",
        acting_user=user,
        workflow=Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type="basic_test_workflow",
            current_workflow_state="middle",
            is_active=True,
            opportunities=[opportunity],
        ),
        state_machine_cls=BasicTestStateMachine,
        config=basic_test_workflow_config,
    )

    event_handler = EventHandler(
        db_session, build_start_workflow_event(WorkflowType.INITIAL_PROTOTYPE, user, [opportunity])
    )

    with pytest.raises(InvalidEventError, match="Event is not valid for current state of workflow"):
        event_handler._process_event(state_machine_event)


def test_process_current_state_does_not_exist(db_session, enable_factory_create):
    # TODO - just test this by doing a process event
    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    state_machine_event = StateMachineEvent(
        event_to_send="start_workflow",
        acting_user=user,
        workflow=Workflow(
            workflow_id=uuid.uuid4(),
            workflow_type="basic-test-workflow",
            current_workflow_state="not-a-real-state",
            is_active=True,
            opportunities=[opportunity],
        ),
        state_machine_cls=BasicTestStateMachine,
        config=basic_test_workflow_config,
    )

    event_handler = EventHandler(
        db_session, build_start_workflow_event(WorkflowType.INITIAL_PROTOTYPE, user, [opportunity])
    )

    with pytest.raises(UnexpectedStateError, match="Workflow record has an unexpected state"):
        event_handler._process_event(state_machine_event)


# TODO
# Process workflow
# * Various error scenarios
# * Sending an event that doesn't exist (catching and rethrowing state machine errors)
