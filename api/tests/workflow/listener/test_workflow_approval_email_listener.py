import logging

import pytest

from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.constants.lookup_constants import ApprovalResponseType, Privilege, WorkflowType
from src.db.models.agency_models import Agency
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow
from tests.lib.agency_test_utils import create_user_in_agency
from tests.src.db.models.factories import (
    OpportunityFactory,
    SuppressedEmailFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.workflow.state_machine.test_state_machines import BasicState
from tests.workflow.workflow_test_util import send_process_event


@pytest.fixture(autouse=True)
def clear_emails() -> None:
    _clear_mock_responses()


def verify_email(
    raw_email: dict,
    user: User,
    workflow: Workflow,
    agency: Agency,
    expected_state: BasicState,
    expected_privilege: Privilege,
) -> None:
    assert user.email in raw_email["MessageRequest"]["Addresses"]
    email = raw_email["MessageRequest"]["MessageConfiguration"]["EmailMessage"]["SimpleEmail"]

    subject = email["Subject"]["Data"]
    assert subject == "Approval required for 'Basic Test Workflow'"

    body = email["TextPart"]["Data"]

    assert (
        f"An approval is required for a Basic Test Workflow that is currently in state '{expected_state}' from a user with the following privilege(s): {expected_privilege}"
        in body
    )
    assert f"ID: {workflow.workflow_id}" in body
    assert f"Agency: {agency.agency_code}: {agency.agency_name}" in body


def test_workflow_approval_email_listener_moving_into_budget_officer_state(
    db_session, agency, budget_officer, opportunity
):
    """Verify that when we first enter the pending budget officer approval state, an email is sent"""

    # A random user that caused the prior event
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
    )

    emails = _get_mock_responses()
    assert len(emails) == 1
    verify_email(
        emails[0][0],
        user=budget_officer,
        workflow=workflow,
        agency=agency,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        expected_privilege=Privilege.BUDGET_OFFICER_APPROVAL,
    )


def test_workflow_approval_email_listener_moving_into_program_officer_state(
    db_session, agency, program_officer, opportunity
):
    """Verify that when we first enter the pending program officer approval state, an email is sent"""

    # A random user that caused the prior event
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_program_officer_approval",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
    )

    emails = _get_mock_responses()
    assert len(emails) == 1
    verify_email(
        emails[0][0],
        user=program_officer,
        workflow=workflow,
        agency=agency,
        expected_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        expected_privilege=Privilege.PROGRAM_OFFICER_APPROVAL,
    )


def test_workflow_approval_email_listener_multiple_users_can_approve(
    db_session, agency, budget_officer, opportunity
):
    # Create a few additional budget officers
    budget_officer2, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    budget_officer3, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )

    # This user has a suppressed email - and won't be picked up
    suppressed_budget_officer, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    SuppressedEmailFactory(email=suppressed_budget_officer.email)

    # This user has no email - and won't be picked up either
    no_email_budget_officer, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    db_session.delete(no_email_budget_officer.linked_login_gov_external_user)
    db_session.commit()

    # A random user that caused the prior event
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
    )

    emails = _get_mock_responses()

    # We can know the order the emails were sent because
    # we order by when the user was created.
    assert len(emails) == 3
    verify_email(
        emails[0][0],
        user=budget_officer,
        workflow=workflow,
        agency=agency,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        expected_privilege=Privilege.BUDGET_OFFICER_APPROVAL,
    )
    verify_email(
        emails[1][0],
        user=budget_officer2,
        workflow=workflow,
        agency=agency,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        expected_privilege=Privilege.BUDGET_OFFICER_APPROVAL,
    )
    verify_email(
        emails[2][0],
        user=budget_officer3,
        workflow=workflow,
        agency=agency,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
        expected_privilege=Privilege.BUDGET_OFFICER_APPROVAL,
    )


def test_workflow_approval_email_listener_staying_in_budget_officer_state_no_email(
    db_session, agency, program_officer, opportunity, caplog
):
    """Verify that if a workflow re-enters an approval state that it's already in, no email is sent"""

    caplog.set_level(logging.DEBUG)

    # This state requires multiple approvals, we'll do 2 to show
    # that no emails get sent as long as it stays in the state.
    program_officer2, _ = create_user_in_agency(
        agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.PENDING_PROGRAM_OFFICER_APPROVAL,
        opportunity=opportunity,
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

    emails = _get_mock_responses()
    assert len(emails) == 0

    # Verify using the logs that this was the path it went down
    # and that it happened four times (each event moves it twice due to checking the count of approvals)
    assert caplog.messages.count("State is not changing, not sending approval emails.") == 4


def test_workflow_approval_email_listener_non_approval_states(
    db_session, agency, opportunity, caplog
):
    """Test that if a state isn't an approval state, no emails are sent"""

    caplog.set_level(logging.DEBUG)

    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.START,
        opportunity=opportunity,
    )

    # Send this from START to MIDDLE to END
    send_process_event(
        db_session=db_session,
        event_to_send="start_workflow",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.MIDDLE,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_end",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.END,
        expected_is_active=False,
    )

    emails = _get_mock_responses()
    assert len(emails) == 0

    # Verify using the logs that this was the path it went down
    assert (
        caplog.messages.count("State does not have approval, no email notification required") == 2
    )


def test_workflow_approval_email_listener_no_users(db_session, agency, opportunity, caplog):
    """Verify behavior if no users have the privilege"""

    # A random user that caused the prior event
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
    )

    emails = _get_mock_responses()
    assert len(emails) == 0

    assert caplog.messages.count("No users can do approval - cannot send email") == 1


def test_workflow_approval_email_listener_no_agency_on_opportunity(db_session, caplog):
    """Verify behavior if opportunity has no agency"""
    # Note that there's half a dozen checks upstream that would prevent this
    # but test it just to be safe.

    # A random user that caused the prior event
    user = UserFactory.create()

    opportunity = OpportunityFactory.create(agency_code="a-code-that-won't-connect-to-an-agency")

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.MIDDLE,
        opportunity=opportunity,
    )

    send_process_event(
        db_session=db_session,
        event_to_send="middle_to_budget_officer_approval",
        workflow_id=workflow.workflow_id,
        user=user,
        expected_state=BasicState.PENDING_BUDGET_OFFICER_APPROVAL,
    )

    emails = _get_mock_responses()
    assert len(emails) == 0

    caplog.messages.count(
        "Opportunity associated with workflow does not have an agency - cannot determine users."
    )
