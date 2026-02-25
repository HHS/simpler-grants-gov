import pytest

from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    Privilege,
    WorkflowType,
)
from src.workflow.workflow_errors import DuplicateApprovalError, InvalidWorkflowResponseTypeError
from tests.lib.agency_test_utils import create_user_in_agency
from tests.src.db.models.factories import (
    OpportunityFactory,
    WorkflowApprovalFactory,
    WorkflowFactory,
)
from tests.workflow.state_machine.test_state_machines import BasicState
from tests.workflow.workflow_test_util import send_process_event, validate_approvals


def test_agency_approval_approved_simple(db_session, agency, budget_officer, opportunity):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        expected_state=BasicState.END,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_agency_approval_declined(db_session, agency, budget_officer, opportunity):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        expected_state=BasicState.DECLINED,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.DECLINED,
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


def test_agency_approval_requires_modification(db_session, agency, budget_officer, opportunity):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    # add a prior approval that will be invalidated
    prior_approval = WorkflowApprovalFactory.create(
        workflow=workflow,
        approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
        is_still_valid=True,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        expected_state=BasicState.START,
        approval_response_type=ApprovalResponseType.REQUIRES_MODIFICATION,
        comment="requires more info",
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": prior_approval.approving_user_id,
                "approval_type": prior_approval.approval_type,
                "is_still_valid": False,
                "approval_response_type": prior_approval.approval_response_type,
            },
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": False,
                "approval_response_type": ApprovalResponseType.REQUIRES_MODIFICATION,
                "comment": "requires more info",
            },
        ],
    )


def test_agency_approval_approved_simple_with_prior_invalid_history(
    db_session, agency, budget_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    prior_approval = WorkflowApprovalFactory.create(
        workflow=workflow,
        approval_type=ApprovalType.BUDGET_OFFICER_APPROVAL,
        is_still_valid=False,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        expected_state=BasicState.END,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    validate_approvals(
        state_machine,
        [
            prior_approval,
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_agency_approval_approved_multiple_approvals_required(
    db_session, agency, program_officer, opportunity
):
    program_officer2, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    program_officer3, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        approval_response_type=ApprovalResponseType.APPROVED,
    )
    send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer2,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer3,
        expected_state=BasicState.END,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.APPROVED,
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
                "approving_user_id": program_officer2.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": program_officer3.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_agency_approval_approved_user_already_approved(
    db_session, agency, program_officer, opportunity
):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    # Approve with that user
    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        approval_response_type=ApprovalResponseType.APPROVED,
    )
    # Try again and it will error
    with pytest.raises(DuplicateApprovalError, match="User already has an active approval"):
        send_process_event(
            db_session=db_session,
            event_to_send="receive_program_officer_approval",
            workflow_id=workflow.workflow_id,
            user=program_officer,
            expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
            approval_response_type=ApprovalResponseType.APPROVED,
        )

    # only the first approval is recorded
    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": program_officer.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_agency_approval_approved_user_has_different_approval(
    db_session, agency, budget_officer, opportunity
):
    """Verify that a user is capable of doing different approvals"""
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    # Add a prior approval of a different type
    prior_approval = WorkflowApprovalFactory.create(
        workflow=workflow,
        approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
        approving_user=budget_officer,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=budget_officer,
        expected_state=BasicState.END,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.APPROVED,
    )

    validate_approvals(
        state_machine,
        [
            prior_approval,
            {
                "approving_user_id": budget_officer.user_id,
                "approval_type": ApprovalType.BUDGET_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


def test_agency_approval_approve_then_decline(db_session, agency, program_officer, opportunity):
    program_officer2, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        approval_response_type=ApprovalResponseType.APPROVED,
    )
    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=program_officer2,
        expected_state=BasicState.DECLINED,
        expected_is_active=False,
        approval_response_type=ApprovalResponseType.DECLINED,
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
                "approving_user_id": program_officer2.user_id,
                "approval_type": ApprovalType.PROGRAM_OFFICER_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.DECLINED,
            },
        ],
    )


def test_agency_approval_invalid_response_type(db_session, agency, budget_officer, opportunity):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    with pytest.raises(
        InvalidWorkflowResponseTypeError, match="Approval response type is not a valid value"
    ):
        send_process_event(
            db_session=db_session,
            event_to_send="receive_budget_officer_approval",
            workflow_id=workflow.workflow_id,
            user=budget_officer,
            expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
            approval_response_type="not-a-valid-type",
        )

    assert len(workflow.workflow_approvals) == 0


def test_agency_approval_null_response_type(db_session, agency, budget_officer, opportunity):
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        workflow_entity__opportunity=opportunity,
    )

    with pytest.raises(
        InvalidWorkflowResponseTypeError,
        match="Approval response type not found for state machine event",
    ):
        send_process_event(
            db_session=db_session,
            event_to_send="receive_budget_officer_approval",
            workflow_id=workflow.workflow_id,
            user=budget_officer,
            expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
            # no type passed in
        )

    assert len(workflow.workflow_approvals) == 0
