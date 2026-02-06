
from src.constants.lookup_constants import WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_machine.initial_prototype_state_machine import (
    InitialPrototypeState,
    InitialPrototypeStateMachine,
)
from tests.src.db.models.factories import OpportunityFactory, UserFactory
from tests.workflow.workflow_test_util import (
    build_process_workflow_event,
    build_start_workflow_event,
)


def test_initial_prototype_state_machine(db_session, enable_factory_create):
    """Very basic test, just verify it can move through the states"""
    opportunity = OpportunityFactory.create()
    user = UserFactory.create()

    workflow_event = build_start_workflow_event(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        user=user,
        entities=[opportunity],
    )

    state_machine = EventHandler(db_session, workflow_event).process()

    assert state_machine.workflow.current_workflow_state == InitialPrototypeState.MIDDLE
    assert state_machine.workflow.is_active is True

    # Verify that just one event was processed
    # and that the event has all the expected fields
    assert len(state_machine.transition_history) == 1
    state_machine_event = state_machine.transition_history[0]
    assert state_machine_event.event_to_send == "start_workflow"
    assert state_machine_event.acting_user.user_id == user.user_id
    assert state_machine_event.workflow is state_machine.workflow
    assert state_machine_event.state_machine_cls is InitialPrototypeStateMachine

    process_workflow_event = build_process_workflow_event(
        workflow_id=state_machine_event.workflow.workflow_id,
        user=user,
        event_to_send="middle_to_end",
    )

    state_machine = EventHandler(db_session, process_workflow_event).process()

    assert state_machine.workflow.current_workflow_state == InitialPrototypeState.END
    assert state_machine.workflow.is_active is False

    # TODO - other checks
