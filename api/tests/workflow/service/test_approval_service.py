from src.constants.lookup_constants import WorkflowType
from src.workflow.service.approval_service import can_user_do_agency_approval
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    OpportunityFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.workflow.state_machine.test_state_machines import (
    BasicTestStateMachine,
    basic_test_workflow_config,
)


def verify_can_do_only(
    user, workflow, expected_allowed_events: set[str], all_events: set[str], config
):

    for event in all_events:
        result = can_user_do_agency_approval(
            user=user,
            workflow=workflow,
            config=config,
            event_to_send=event,
        )

        if event in expected_allowed_events:
            assert result is True, f"Expected user to be able to do {event}"
        else:
            assert result is False, f"Expected user to NOT be able to do {event}"


def test_can_user_do_agency_approval_opportunity(
    db_session,
    agency,
    budget_officer,
    program_officer,
    other_agency_program_officer,
    other_agency_budget_officer,
    opportunity,
):
    config = basic_test_workflow_config

    opportunity_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, workflow_entity__opportunity=opportunity
    )

    all_events = BasicTestStateMachine.get_valid_events()

    # Budget Officer can only do their approval
    verify_can_do_only(
        user=budget_officer,
        workflow=opportunity_workflow,
        expected_allowed_events={"receive_budget_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # Program officer can only do their approval
    verify_can_do_only(
        user=program_officer,
        workflow=opportunity_workflow,
        expected_allowed_events={"receive_program_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # The users in another agency cannot do any approvals
    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=opportunity_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )

    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=opportunity_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )


def test_can_user_do_agency_approval_application(
    db_session,
    agency,
    budget_officer,
    program_officer,
    other_agency_program_officer,
    other_agency_budget_officer,
    opportunity,
):
    config = basic_test_workflow_config

    competition = CompetitionFactory.create(opportunity=opportunity)
    application = ApplicationFactory.create(competition=competition)

    application_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        workflow_entity__application=application,
        has_application=True,
    )

    all_events = BasicTestStateMachine.get_valid_events()

    # Budget Officer can only do their approval
    verify_can_do_only(
        user=budget_officer,
        workflow=application_workflow,
        expected_allowed_events={"receive_budget_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # Program officer can only do their approval
    verify_can_do_only(
        user=program_officer,
        workflow=application_workflow,
        expected_allowed_events={"receive_program_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # The users in another agency cannot do any approvals
    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=application_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )

    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=application_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )


def test_can_user_do_agency_approval_application_submission(
    db_session,
    agency,
    budget_officer,
    program_officer,
    other_agency_program_officer,
    other_agency_budget_officer,
    opportunity,
):
    config = basic_test_workflow_config

    competition = CompetitionFactory.create(opportunity=opportunity)
    application = ApplicationFactory.create(competition=competition)
    application_submission = ApplicationSubmissionFactory.create(application=application)

    application_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        workflow_entity__application_submission=application_submission,
        has_application_submission=True,
    )

    all_events = BasicTestStateMachine.get_valid_events()

    # Budget Officer can only do their approval
    verify_can_do_only(
        user=budget_officer,
        workflow=application_workflow,
        expected_allowed_events={"receive_budget_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # Program officer can only do their approval
    verify_can_do_only(
        user=program_officer,
        workflow=application_workflow,
        expected_allowed_events={"receive_program_officer_approval"},
        all_events=all_events,
        config=config,
    )

    # The users in another agency cannot do any approvals
    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=application_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )

    verify_can_do_only(
        user=other_agency_program_officer,
        workflow=application_workflow,
        expected_allowed_events=set(),
        all_events=all_events,
        config=config,
    )


def test_can_user_do_agency_approval_with_null_opp_agency(db_session, enable_factory_create):
    # Privileges won't matter, we don't check them in this case
    user = UserFactory.create()

    opportunity = OpportunityFactory.create(
        agency_id=None, agency_code="a-code-that-won't-connect-to-anything"
    )
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, workflow_entity__opportunity=opportunity
    )

    verify_can_do_only(
        user=user,
        workflow=workflow,
        expected_allowed_events=set(),
        all_events=BasicTestStateMachine.get_valid_events(),
        config=basic_test_workflow_config,
    )
