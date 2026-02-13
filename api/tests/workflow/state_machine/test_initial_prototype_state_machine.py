from src.constants.lookup_constants import Privilege, WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_machine.initial_prototype_state_machine import (
    InitialPrototypeState,
    InitialPrototypeStateMachine,
)
from tests.lib.agency_test_utils import create_user_in_agency
from tests.src.db.models.factories import OpportunityFactory, UserFactory, WorkflowFactory
from tests.workflow.workflow_test_util import (
    build_process_workflow_event,
    build_start_workflow_event, send_process_event,
)


def test_initial_prototype_state_machine(db_session, enable_factory_create):
    """Happy path, verifies it can move through the states."""
    program_officer, agency = create_user_in_agency(privileges=[Privilege.PROGRAM_OFFICER_APPROVAL])
    budget_officer, _ = create_user_in_agency(agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL])
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)

    workflow_event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        user=program_officer,
        entities=[opportunity],
    )

    state_machine = EventHandler(db_session, workflow_event, history_event).process()

    send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=program_officer,
        expected_state=InitialPrototypeState.PENDING_BUDGET_OFFICER_APPROVAL
    )

    send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=budget_officer,
        expected_state=InitialPrototypeState.END,
        expected_is_active=False
    )

    approvals = state_machine.workflow.workflow_approvals
    assert len(approvals) == 2
    assert