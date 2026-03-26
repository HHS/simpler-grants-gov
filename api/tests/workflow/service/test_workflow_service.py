import uuid

import pytest

from src.constants.lookup_constants import WorkflowEntityType, WorkflowType
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entity,
    is_event_valid_for_workflow,
    validate_no_concurrent_workflow,
)
from src.workflow.workflow_errors import (
    ConcurrentWorkflowError,
    EntityNotFound,
    InactiveWorkflowError,
    WorkflowDoesNotExistError,
)
from tests.src.db.models.factories import ApplicationFactory, OpportunityFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicTestStateMachine
from tests.workflow.workflow_test_util import build_workflow_config


def test_get_workflow_entity_opportunity(db_session, enable_factory_create):
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(entity_type=WorkflowEntityType.OPPORTUNITY)
    result = get_workflow_entity(
        db_session,
        entity_id=opportunity.opportunity_id,
        config=config,
    )

    assert result["opportunity"].opportunity_id == opportunity.opportunity_id


def test_get_workflow_entity_application(db_session, enable_factory_create):
    application = ApplicationFactory.create()
    config = build_workflow_config(entity_type=WorkflowEntityType.APPLICATION)
    result = get_workflow_entity(
        db_session,
        entity_id=application.application_id,
        config=config,
    )

    assert result["application"].application_id == application.application_id


def test_get_workflow_entity_opportunity_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_type=WorkflowEntityType.OPPORTUNITY)

    with pytest.raises(EntityNotFound, match="Opportunity not found"):
        get_workflow_entity(
            db_session,
            entity_id=uuid.uuid4(),
            config=config,
        )


def test_get_workflow_entity_application_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_type=WorkflowEntityType.APPLICATION)

    with pytest.raises(EntityNotFound, match="Application not found"):
        get_workflow_entity(
            db_session,
            entity_id=uuid.uuid4(),
            config=config,
        )


@pytest.mark.parametrize(
    "event,state_machine_cls,expected_is_valid",
    [
        ("start_workflow", BasicTestStateMachine, True),
        ("middle_to_end", BasicTestStateMachine, True),
        ("receive_program_officer_approval", BasicTestStateMachine, True),
        ("fake_event", BasicTestStateMachine, False),
        ("declinedabc", BasicTestStateMachine, False),
    ],
)
def test_is_event_valid_for_workflow(event, state_machine_cls, expected_is_valid):
    assert is_event_valid_for_workflow(event, state_machine_cls) == expected_is_valid


def test_get_workflow(db_session, enable_factory_create):
    workflow = WorkflowFactory.create()

    fetched_workflow = get_and_validate_workflow(db_session, workflow.workflow_id)
    assert fetched_workflow.workflow_id == workflow.workflow_id


def test_get_workflow_not_found(db_session):
    with pytest.raises(WorkflowDoesNotExistError, match="Workflow does not exist"):
        get_and_validate_workflow(db_session, uuid.uuid4())


def test_get_workflow_is_not_active(db_session, enable_factory_create):
    workflow = WorkflowFactory.create(is_active=False)

    with pytest.raises(InactiveWorkflowError, match="Workflow is not active"):
        get_and_validate_workflow(db_session, workflow.workflow_id)


def test_validate_no_concurrent_workflow_allowed_by_config(db_session, enable_factory_create):
    """When allow_concurrent_workflow_for_entity=True, no error is raised even if active workflow exists."""
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        entity_type=WorkflowEntityType.OPPORTUNITY,
    )
    # Default is True, so this should be a no-op
    assert config.allow_concurrent_workflow_for_entity is True

    WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        opportunity=opportunity,
        is_active=True,
    )

    # Should not raise
    validate_no_concurrent_workflow(
        db_session,
        entity_id=opportunity.opportunity_id,
        config=config,
    )


def test_validate_no_concurrent_workflow_errors_when_active_exists(
    db_session, enable_factory_create
):
    """When allow_concurrent_workflow_for_entity=False, should error if active workflow exists."""
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        entity_type=WorkflowEntityType.OPPORTUNITY,
    )
    config.allow_concurrent_workflow_for_entity = False

    WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        opportunity=opportunity,
        is_active=True,
    )

    with pytest.raises(
        ConcurrentWorkflowError,
        match="An active workflow of this type already exists for this entity",
    ):
        validate_no_concurrent_workflow(
            db_session,
            entity_id=opportunity.opportunity_id,
            config=config,
        )


def test_validate_no_concurrent_workflow_ok_when_inactive_exists(db_session, enable_factory_create):
    """When allow_concurrent_workflow_for_entity=False, should NOT error if existing workflow is inactive."""
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        entity_type=WorkflowEntityType.OPPORTUNITY,
    )
    config.allow_concurrent_workflow_for_entity = False

    WorkflowFactory.create(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        opportunity=opportunity,
        is_active=False,
    )

    # Should not raise since existing workflow is inactive
    validate_no_concurrent_workflow(
        db_session,
        entity_id=opportunity.opportunity_id,
        config=config,
    )


def test_validate_no_concurrent_workflow_ok_when_no_workflow_exists(
    db_session, enable_factory_create
):
    """When allow_concurrent_workflow_for_entity=False, should NOT error if no workflow exists."""
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        entity_type=WorkflowEntityType.OPPORTUNITY,
    )
    config.allow_concurrent_workflow_for_entity = False

    # No workflow created for this opportunity
    validate_no_concurrent_workflow(
        db_session,
        entity_id=opportunity.opportunity_id,
        config=config,
    )


def test_validate_no_concurrent_workflow_different_workflow_type(db_session, enable_factory_create):
    """Active workflow of a different type should not block starting a new one."""
    opportunity = OpportunityFactory.create()
    config = build_workflow_config(
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        entity_type=WorkflowEntityType.OPPORTUNITY,
    )
    config.allow_concurrent_workflow_for_entity = False

    # Create an active workflow of a DIFFERENT type
    WorkflowFactory.create(
        workflow_type=WorkflowType.NO_CONCURRENT_TEST_WORKFLOW,
        opportunity=opportunity,
        is_active=True,
    )

    # Should not raise since the existing workflow is a different type
    validate_no_concurrent_workflow(
        db_session,
        entity_id=opportunity.opportunity_id,
        config=config,
    )
