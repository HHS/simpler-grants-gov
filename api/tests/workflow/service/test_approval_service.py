from src.constants.lookup_constants import Privilege, WorkflowType
from src.workflow.service.approval_service import can_user_do_agency_approval
from tests.lib.agency_test_utils import create_user_in_agency, give_user_privilege_in_agency
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    CompetitionFactory,
    OpportunityFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.workflow.state_machine.test_state_machines import (
    BasicTestStateMachine,
    basic_test_workflow_config,
)


def test_can_user_do_agency_approval(db_session, enable_factory_create):
    config = basic_test_workflow_config

    # create a few different agencies
    agency_a = AgencyFactory.create()
    agency_b = AgencyFactory.create()

    # Create a few users
    agency_a_budget_officer, _ = create_user_in_agency(
        agency=agency_a, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    agency_b_budget_officer, _ = create_user_in_agency(
        agency=agency_b, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )

    agency_a_program_officer, _ = create_user_in_agency(
        agency=agency_a, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    agency_b_program_officer, _ = create_user_in_agency(
        agency=agency_b, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )

    # These users are in both agency A & B
    agency_ab_program_officer, _ = create_user_in_agency(
        agency=agency_a, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    give_user_privilege_in_agency(
        agency_ab_program_officer, agency_b, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )

    agency_ab_budget_officer, _ = create_user_in_agency(
        agency=agency_a, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    give_user_privilege_in_agency(
        agency_ab_budget_officer, agency_b, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )

    # Create a few opportunities for various agencies
    opportunity_a1 = OpportunityFactory.create(agency_code=agency_a.agency_code)
    opportunity_a2 = OpportunityFactory.create(agency_code=agency_a.agency_code)

    opportunity_b = OpportunityFactory.create(agency_code=agency_b.agency_code)

    competition_a1 = CompetitionFactory.create(opportunity=opportunity_a1)
    competition_b = CompetitionFactory.create(opportunity=opportunity_b)

    application_a1 = ApplicationFactory.create(competition=competition_a1)

    application_b = ApplicationFactory.create(competition=competition_b)

    ##################
    # Simple Opportunity/Application Workflow
    ##################
    # The access ends up the same between opp/application for this
    simple_opportunity_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunities=[opportunity_a1]
    )
    simple_application_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, applications=[application_a1]
    )

    # Budget officer can do budget officer approval
    assert (
        can_user_do_agency_approval(
            agency_a_budget_officer,
            simple_opportunity_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            agency_a_program_officer,
            simple_opportunity_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is False
    )

    assert (
        can_user_do_agency_approval(
            agency_a_budget_officer,
            simple_application_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            agency_a_program_officer,
            simple_application_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is False
    )

    # Program officer can do program officer approval
    assert (
        can_user_do_agency_approval(
            agency_a_program_officer,
            simple_opportunity_workflow,
            config,
            "receive_program_officer_approval",
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            agency_a_budget_officer,
            simple_opportunity_workflow,
            config,
            "receive_program_officer_approval",
        )
        is False
    )

    assert (
        can_user_do_agency_approval(
            agency_a_program_officer,
            simple_application_workflow,
            config,
            "receive_program_officer_approval",
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            agency_a_budget_officer,
            simple_application_workflow,
            config,
            "receive_program_officer_approval",
        )
        is False
    )

    # Other random users can't do anything
    for event in BasicTestStateMachine.get_valid_events():
        assert (
            can_user_do_agency_approval(
                agency_b_program_officer, simple_opportunity_workflow, config, event
            )
            is False
        )
        assert (
            can_user_do_agency_approval(
                agency_b_budget_officer, simple_opportunity_workflow, config, event
            )
            is False
        )

        assert (
            can_user_do_agency_approval(
                agency_b_program_officer, simple_application_workflow, config, event
            )
            is False
        )
        assert (
            can_user_do_agency_approval(
                agency_b_budget_officer, simple_application_workflow, config, event
            )
            is False
        )

    ##################
    # Multiple Opportunity/Application Workflow
    ##################
    # To do anything here, you'd need to have the privilege
    # against both agency A & B

    multiple_entity_workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        opportunities=[opportunity_a1, opportunity_a2],
        applications=[application_b],
    )

    # Program officer can do program officer approval
    assert (
        can_user_do_agency_approval(
            agency_ab_program_officer,
            multiple_entity_workflow,
            config,
            "receive_program_officer_approval",
        )
        is True
    )
    assert (
        can_user_do_agency_approval(
            agency_ab_program_officer,
            multiple_entity_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is False
    )

    # Budget officer can do budget officer approval
    assert (
        can_user_do_agency_approval(
            agency_ab_budget_officer,
            multiple_entity_workflow,
            config,
            "receive_program_officer_approval",
        )
        is False
    )
    assert (
        can_user_do_agency_approval(
            agency_ab_budget_officer,
            multiple_entity_workflow,
            config,
            "receive_budget_officer_approval",
        )
        is True
    )

    # The users in only one of the agencies cannot do anything
    for event in BasicTestStateMachine.get_valid_events():
        assert (
            can_user_do_agency_approval(
                agency_a_program_officer, multiple_entity_workflow, config, event
            )
            is False
        )
        assert (
            can_user_do_agency_approval(
                agency_a_budget_officer, multiple_entity_workflow, config, event
            )
            is False
        )

        assert (
            can_user_do_agency_approval(
                agency_b_program_officer, multiple_entity_workflow, config, event
            )
            is False
        )
        assert (
            can_user_do_agency_approval(
                agency_b_budget_officer, multiple_entity_workflow, config, event
            )
            is False
        )


def test_can_user_do_agency_approval_with_null_opp_agency(db_session, enable_factory_create):
    # Privileges won't matter, we don't check them in this case
    user = UserFactory.create()

    opportunity = OpportunityFactory.create(
        agency_id=None, agency_code="a-code-that-won't-connect-to-anything"
    )
    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunities=[opportunity]
    )

    assert (
        can_user_do_agency_approval(
            user, workflow, basic_test_workflow_config, "receive_program_officer_approval"
        )
        is False
    )
