import uuid

import pytest

from src.constants.lookup_constants import WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.workflow_errors import (
    InactiveWorkflowError,
    InvalidEventError,
    InvalidWorkflowTypeError,
    UnexpectedStateError,
    UserDoesNotExist,
    WorkflowDoesNotExistError,
)
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState, BasicTestStateMachine
from tests.workflow.workflow_test_util import (
    build_process_workflow_event,
    build_start_workflow_event,
)


def test_start_workflow_event(db_session, enable_factory_create):

    user = UserFactory.create()
    opportunity = OpportunityFactory.create()

    event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
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

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        is_single_opportunity_workflow=True,
    )

    event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="middle_to_end"
    )

    event_handler = EventHandler(db_session, event)
    state_machine = event_handler.process()

    assert state_machine.workflow.current_workflow_state == BasicState.END
    assert state_machine.workflow.is_active is False

    assert len(state_machine.transition_history) == 1
    state_machine_event = state_machine.transition_history[0]
    assert state_machine_event.event_to_send == "middle_to_end"
    assert state_machine_event.acting_user.user_id == user.user_id
    assert state_machine_event.workflow is state_machine.workflow


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


def test_process_workflow_event_missing_process_context(db_session, enable_factory_create):
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        is_single_opportunity_workflow=True,
    )

    event = build_process_workflow_event(
        workflow.workflow_id,
        user=user,
        event_to_send="middle_to_end",
        exclude_process_workflow_context=True,
    )

    event_handler = EventHandler(db_session, event)
    with pytest.raises(
        InvalidEventError, match="Process workflow event has a null process workflow context"
    ):
        event_handler.process()


def test_start_workflow_event_invalid_workflow_type(db_session, enable_factory_create):
    user = UserFactory.create()

    event = build_start_workflow_event(
        # We'll override this below
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=user,
        entities=[],
    )
    # Pydantic doesn't validate on assignment, so change it to something invalid here
    event.start_workflow_context.workflow_type = "not-a-valid-workflow-type"

    event_handler = EventHandler(db_session, event)
    with pytest.raises(
        InvalidWorkflowTypeError, match="Workflow event does not map to an actual state machine"
    ):
        event_handler.process()


def test_start_workflow_event_missing_user(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()

    event = build_start_workflow_event(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        user=None,  # A random ID will be added
        entities=[opportunity],
    )

    event_handler = EventHandler(db_session, event)
    with pytest.raises(UserDoesNotExist, match="User does not exist"):
        event_handler.process()


def test_process_workflow_event_missing_user(db_session, enable_factory_create):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        is_single_opportunity_workflow=True,
    )

    event = build_process_workflow_event(
        workflow.workflow_id, user=None, event_to_send="middle_to_end"
    )
    with pytest.raises(UserDoesNotExist, match="User does not exist"):
        EventHandler(db_session, event).process()


def test_process_workflow_event_workflow_does_not_exist(db_session, enable_factory_create):
    user = UserFactory.create()

    event = build_process_workflow_event(
        workflow_id=uuid.uuid4(), user=user, event_to_send="middle_to_end"
    )

    with pytest.raises(WorkflowDoesNotExistError, match="Workflow does not exist"):
        EventHandler(db_session, event).process()


def test_process_workflow_event_invalid_event(db_session, enable_factory_create):
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        is_single_opportunity_workflow=True,
    )

    event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="not-a-real-event"
    )
    with pytest.raises(InvalidEventError, match="Event is not valid for workflow"):
        EventHandler(db_session, event).process()


def test_process_workflow_event_invalid_event_for_current_state(db_session, enable_factory_create):
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        is_single_opportunity_workflow=True,
    )

    # start_workflow is valid, just not for the current state
    event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="start_workflow"
    )
    with pytest.raises(InvalidEventError, match="Event is not valid for current state of workflow"):
        EventHandler(db_session, event).process()


def test_process_workflow_event_invalid_current_state(db_session, enable_factory_create):
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state="not-a-valid-state",
        is_single_opportunity_workflow=True,
    )

    event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="middle_to_end"
    )
    with pytest.raises(UnexpectedStateError, match="Workflow record has an unexpected state"):
        EventHandler(db_session, event).process()


def test_process_workflow_is_already_at_end(db_session, enable_factory_create):
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.END,
        is_single_opportunity_workflow=True,
        is_active=False,
    )

    event = build_process_workflow_event(
        workflow.workflow_id, user=user, event_to_send="middle_to_end"
    )
    with pytest.raises(
        InactiveWorkflowError, match="Workflow is not active - cannot receive events"
    ):
        EventHandler(db_session, event).process()
