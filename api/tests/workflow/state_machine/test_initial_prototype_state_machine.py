import pytest

from src.constants.lookup_constants import ApprovalResponseType, ApprovalType, WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.service.approval_service import can_user_do_agency_approval
from src.workflow.state_machine.initial_prototype_state_machine import (
    InitialPrototypeState,
    InitialPrototypeStateMachine,
    initial_prototype_state_machine_config,
)
from src.workflow.workflow_errors import InvalidEventError
from tests.src.db.models.factories import UserFactory, WorkflowFactory
from tests.workflow.workflow_test_util import (
    build_start_workflow_event,
    send_process_event,
    validate_approvals,
)


def test_initial_prototype_state_machine_happy_path(
    db_session, agency, program_officer, budget_officer, opportunity
):
    """Happy path, verifies it can move through the states."""
    workflow_event, history_event = build_start_workflow_event(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        user=program_officer,
        entity=opportunity,
    )

    state_machine = EventHandler(db_session, workflow_event, history_event).process()

    send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=program_officer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=InitialPrototypeState.PENDING_BUDGET_OFFICER_APPROVAL,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=budget_officer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=InitialPrototypeState.END,
        expected_is_active=False,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": program_officer.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_initial_prototype_state_machine_program_officer_decline(
    db_session, agency, program_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        current_workflow_state=InitialPrototypeState.PENDING_PROGRAM_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer,
        approval_response_type=ApprovalResponseType.DECLINED,
        expected_state=InitialPrototypeState.DECLINED,
        expected_is_active=False,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": program_officer.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.DECLINED,
            },
        ],
    )


def test_initial_prototype_state_machine_budget_officer_decline(
    db_session, agency, budget_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        current_workflow_state=InitialPrototypeState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        approval_response_type=ApprovalResponseType.DECLINED,
        expected_state=InitialPrototypeState.DECLINED,
        expected_is_active=False,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.DECLINED,
            },
        ],
    )


def test_initial_prototype_state_machine_program_officer_requires_modification(
    db_session, agency, program_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        current_workflow_state=InitialPrototypeState.PENDING_PROGRAM_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer,
        approval_response_type=ApprovalResponseType.REQUIRES_MODIFICATION,
        comment="Needs modification",
        expected_state=InitialPrototypeState.START,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": program_officer.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": False,
                "approval_response_type": ApprovalResponseType.REQUIRES_MODIFICATION,
                "comment": "Needs modification",
            },
        ],
    )


def test_initial_prototype_state_machine_budget_officer_requires_modification(
    db_session, agency, budget_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        current_workflow_state=InitialPrototypeState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        approval_response_type=ApprovalResponseType.REQUIRES_MODIFICATION,
        comment="Needs more work",
        expected_state=InitialPrototypeState.START,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": False,
                "approval_response_type": ApprovalResponseType.REQUIRES_MODIFICATION,
                "comment": "Needs more work",
            },
        ],
    )


@pytest.mark.parametrize(
    "event_to_send",
    [
        # These are real events, but not valid when in the start state
        "receive_budget_officer_approval",
        "receive_program_officer_approval",
        # Just bad events
        "not-a-real-event",
        "hello",
    ],
)
def test_initial_prototype_state_machine_invalid_events(
    db_session, agency, opportunity, event_to_send
):
    # a random user, privileges won't matter as it won't get that far
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        current_workflow_state=InitialPrototypeState.START,
        workflow_entity__opportunity=opportunity,
    )

    with pytest.raises(InvalidEventError, match="Event is not valid for current state of workflow"):
        send_process_event(
            db_session=db_session,
            event_to_send="receive_budget_officer_approval",
            workflow_id=workflow.workflow_id,
            user=user,
            expected_state=InitialPrototypeState.START,
        )

    # No approvals added due to error
    assert len(workflow.workflow_approvals) == 0


def test_initial_prototype_state_privileges(
    db_session, agency, opportunity, budget_officer, program_officer
):
    """Test that we've configured the privileges as expected."""
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.INITIAL_PROTOTYPE,
        workflow_entity__opportunity=opportunity,
    )
    config = initial_prototype_state_machine_config

    assert (
        can_user_do_agency_approval(
            program_officer, workflow, config, "receive_budget_officer_approval"
        )
        is False
    )
    assert (
        can_user_do_agency_approval(
            budget_officer, workflow, config, "receive_budget_officer_approval"
        )
        is True
    )

    assert (
        can_user_do_agency_approval(
            program_officer, workflow, config, "receive_program_officer_approval"
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            budget_officer, workflow, config, "receive_program_officer_approval"
        )
        is False
    )

    for event in InitialPrototypeStateMachine.get_valid_events():
        # checked these above
        if event in ["receive_program_officer_approval", "receive_budget_officer_approval"]:
            continue

        assert can_user_do_agency_approval(program_officer, workflow, config, event) is False
        assert can_user_do_agency_approval(budget_officer, workflow, config, event) is False
