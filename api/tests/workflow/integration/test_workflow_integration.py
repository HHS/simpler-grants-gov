import dataclasses
import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import WorkflowEventType, WorkflowType, WorkflowEntityType, Privilege, \
    ApprovalResponseType, ApprovalType
from src.db.models.workflow_models import WorkflowEventHistory, Workflow
from src.workflow.manager.workflow_manager import WorkflowManager
from tests.lib.internal_user_test_utils import create_internal_user_with_jwt
from tests.src.db.models.factories import OpportunityFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState


#################################
#
# These tests verify that our workflow event API
# and workflow service work together.
#
# These do not aim to test every functionality,
# but instead focus on the connection between the two.
#
#################################

@pytest.fixture
def internal_workflow_send_user_values(db_session, enable_factory_create):
    user, token = create_internal_user_with_jwt(
        db_session, privileges=[Privilege.INTERNAL_WORKFLOW_EVENT_SEND]
    )

    return user, token


@pytest.fixture
def internal_send_user(internal_workflow_send_user_values):
    return internal_workflow_send_user_values[0]


@pytest.fixture
def internal_send_user_jwt(internal_workflow_send_user_values):
    return internal_workflow_send_user_values[1]


def build_process_workflow_request(event_to_send: str, workflow: Workflow, approval_response_type: ApprovalResponseType | None = None, comment: str | None = None) -> dict:
    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": workflow.workflow_id,
            "event_to_send": event_to_send
        },
    }

    if approval_response_type is not None:
        payload["metadata"] = {"approval_response_type": approval_response_type}
        if comment is not None:
            payload["metadata"]["comment"] = comment

    return payload


def send_event_and_process(client, app, payload: dict, user_jwt: str) -> str:
    response = client.put("/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_jwt})
    assert response.status_code == 200
    event_id = response.get_json()["data"]["event_id"]

    with app.app_context():
        messages_to_delete, messages_to_keep = WorkflowManager().process_batch()
        assert len(messages_to_delete) == 1

    return event_id

def test_can_move_basic_test_workflow_start_to_end(db_session, enable_factory_create, client, app, internal_send_user, internal_send_user_jwt, workflow_user, workflow_sqs_queue):

    opportunity = OpportunityFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(opportunity.opportunity_id),
        },
    }

    # Send an event which will start the workflow
    first_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    # Find the workflow via the event ID
    event_history = db_session.execute(select(WorkflowEventHistory).where(WorkflowEventHistory.event_id == first_event_id)).scalar_one_or_none()
    assert event_history is not None
    workflow = event_history.workflow

    assert workflow.workflow_type == WorkflowType.BASIC_TEST_WORKFLOW
    assert workflow.current_workflow_state == BasicState.MIDDLE
    assert workflow.is_active is True
    assert workflow.opportunity_id == opportunity.opportunity_id

    # Send another event
    payload = build_process_workflow_request("middle_to_budget_officer_approval", workflow)
    second_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.PENDING_BUDGET_OFFICER_APPROVAL
    assert workflow.is_active is True

    # Send another event
    payload = build_process_workflow_request("receive_budget_officer_approval", workflow, ApprovalResponseType.APPROVED)
    third_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.END
    assert workflow.is_active is False

    # Validate the expected event history is present
    workflow_event_history = sorted(workflow.workflow_event_history, key=lambda x: x.created_at)
    assert len(workflow_event_history) == 3

    assert str(workflow_event_history[0].event_id) == first_event_id
    assert str(workflow_event_history[1].event_id) == second_event_id
    assert str(workflow_event_history[2].event_id) == third_event_id

    # Validate the audit
    workflow_audit_history = sorted(workflow.workflow_audits, key=lambda x: x.created_at)
    assert len(workflow_audit_history) == 4

    assert str(workflow_audit_history[0].event_id) == first_event_id
    assert workflow_audit_history[0].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[0].transition_event == "Start workflow"
    assert workflow_audit_history[0].source_state == "start"
    assert workflow_audit_history[0].target_state == "middle"

    assert str(workflow_audit_history[1].event_id) == second_event_id
    assert workflow_audit_history[1].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[1].transition_event == "Middle to budget officer approval"
    assert workflow_audit_history[1].source_state == "middle"
    assert workflow_audit_history[1].target_state == "pending_budget_officer_approval"

    assert str(workflow_audit_history[2].event_id) == third_event_id
    assert workflow_audit_history[2].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[2].transition_event == "Receive budget officer approval"
    assert workflow_audit_history[2].source_state == "pending_budget_officer_approval"
    assert workflow_audit_history[2].target_state == "pending_budget_officer_approval"

    # This final event automatically happens after the above
    assert str(workflow_audit_history[3].event_id) == third_event_id
    assert workflow_audit_history[3].acting_user_id == workflow_user.user_id
    assert workflow_audit_history[3].transition_event == "Check budget officer approval"
    assert workflow_audit_history[3].source_state == "pending_budget_officer_approval"
    assert workflow_audit_history[3].target_state == "end"

    # Check the approvals
    workflow_approvals = sorted(workflow.workflow_approvals, key=lambda x: x.created_at)
    assert len(workflow_approvals) == 1

    assert str(workflow_approvals[0].event_id) == third_event_id
    assert workflow_approvals[0].approval_type == ApprovalType.BUDGET_OFFICER_APPROVAL
    assert workflow_approvals[0].is_still_valid is True
    assert workflow_approvals[0].approving_user_id == internal_send_user.user_id
    assert workflow_approvals[0].comment is None
    assert workflow_approvals[0].approval_response_type == ApprovalResponseType.APPROVED


def test_can_move_basic_test_workflow_start_to_requires_modification_and_then_to_end(db_session, enable_factory_create, client, app, internal_send_user, internal_send_user_jwt, workflow_user, workflow_sqs_queue):
    """Test that if a workflow requires modification, we can then get through the workflow afterwards"""

    workflow = WorkflowFactory.create(
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        has_opportunity=True
    )

    # Require modification, which will move it back to the start state
    payload = build_process_workflow_request("receive_budget_officer_approval", workflow, ApprovalResponseType.REQUIRES_MODIFICATION, comment="fix it")
    first_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.START
    assert workflow.is_active is True

    # Send an event to move it back to the middle state
    payload = build_process_workflow_request("start_workflow", workflow)
    second_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.MIDDLE
    assert workflow.is_active is True

    # Send an event to move it back to the budget officer approval state
    payload = build_process_workflow_request("middle_to_budget_officer_approval", workflow)
    third_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.PENDING_BUDGET_OFFICER_APPROVAL
    assert workflow.is_active is True

    # Finally do an actual approval
    payload = build_process_workflow_request("receive_budget_officer_approval", workflow, ApprovalResponseType.APPROVED)
    fourth_event_id = send_event_and_process(client, app, payload, internal_send_user_jwt)

    db_session.refresh(workflow)
    assert workflow.current_workflow_state == BasicState.END
    assert workflow.is_active is False

    # Validate the expected event history is present
    workflow_event_history = sorted(workflow.workflow_event_history, key=lambda x: x.created_at)
    assert len(workflow_event_history) == 4

    assert str(workflow_event_history[0].event_id) == first_event_id
    assert str(workflow_event_history[1].event_id) == second_event_id
    assert str(workflow_event_history[2].event_id) == third_event_id
    assert str(workflow_event_history[3].event_id) == fourth_event_id

    # Validate the audit
    workflow_audit_history = sorted(workflow.workflow_audits, key=lambda x: x.created_at)
    assert len(workflow_audit_history) == 5

    assert str(workflow_audit_history[0].event_id) == first_event_id
    assert workflow_audit_history[0].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[0].transition_event == "Receive budget officer approval"
    assert workflow_audit_history[0].source_state == "pending_budget_officer_approval"
    assert workflow_audit_history[0].target_state == "start"

    assert str(workflow_audit_history[1].event_id) == second_event_id
    assert workflow_audit_history[1].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[1].transition_event == "Start workflow"
    assert workflow_audit_history[1].source_state == "start"
    assert workflow_audit_history[1].target_state == "middle"

    assert str(workflow_audit_history[2].event_id) == third_event_id
    assert workflow_audit_history[2].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[2].transition_event == "Middle to budget officer approval"
    assert workflow_audit_history[2].source_state == "middle"
    assert workflow_audit_history[2].target_state == "pending_budget_officer_approval"

    assert str(workflow_audit_history[3].event_id) == fourth_event_id
    assert workflow_audit_history[3].acting_user_id == internal_send_user.user_id
    assert workflow_audit_history[3].transition_event == "Receive budget officer approval"
    assert workflow_audit_history[3].source_state == "pending_budget_officer_approval"
    assert workflow_audit_history[3].target_state == "pending_budget_officer_approval"

    # This final event automatically happens after the above
    assert str(workflow_audit_history[4].event_id) == fourth_event_id
    assert workflow_audit_history[4].acting_user_id == workflow_user.user_id
    assert workflow_audit_history[4].transition_event == "Check budget officer approval"
    assert workflow_audit_history[4].source_state == "pending_budget_officer_approval"
    assert workflow_audit_history[4].target_state == "end"

    # Check the approvals
    workflow_approvals = sorted(workflow.workflow_approvals, key=lambda x: x.created_at)
    assert len(workflow_approvals) == 2

    assert str(workflow_approvals[0].event_id) == first_event_id
    assert workflow_approvals[0].approval_type == ApprovalType.BUDGET_OFFICER_APPROVAL
    assert workflow_approvals[0].is_still_valid is False
    assert workflow_approvals[0].approving_user_id == internal_send_user.user_id
    assert workflow_approvals[0].comment == "fix it"
    assert workflow_approvals[0].approval_response_type == ApprovalResponseType.REQUIRES_MODIFICATION

    assert str(workflow_approvals[1].event_id) == fourth_event_id
    assert workflow_approvals[1].approval_type == ApprovalType.BUDGET_OFFICER_APPROVAL
    assert workflow_approvals[1].is_still_valid is True
    assert workflow_approvals[1].approving_user_id == internal_send_user.user_id
    assert workflow_approvals[1].comment is None
    assert workflow_approvals[1].approval_response_type == ApprovalResponseType.APPROVED

