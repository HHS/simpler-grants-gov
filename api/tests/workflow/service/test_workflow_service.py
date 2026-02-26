import uuid

import pytest

from src.constants.lookup_constants import WorkflowEntityType
from src.workflow.service.workflow_service import (
    get_and_validate_workflow,
    get_workflow_entity,
    is_event_valid_for_workflow,
)
from src.workflow.workflow_errors import (
    EntityNotFound,
    InactiveWorkflowError,
    InvalidEntityForWorkflow,
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
        entity_type=WorkflowEntityType.OPPORTUNITY,
        entity_id=opportunity.opportunity_id,
        config=config,
    )

    assert result["opportunity"].opportunity_id == opportunity.opportunity_id


def test_get_workflow_entity_application(db_session, enable_factory_create):
    application = ApplicationFactory.create()
    config = build_workflow_config(entity_type=WorkflowEntityType.APPLICATION)
    result = get_workflow_entity(
        db_session,
        entity_type=WorkflowEntityType.APPLICATION,
        entity_id=application.application_id,
        config=config,
    )

    assert result["application"].application_id == application.application_id


def test_get_workflow_entity_not_valid_for_config(db_session, enable_factory_create):

    opportunity = OpportunityFactory.create()
    config = build_workflow_config(entity_type=WorkflowEntityType.APPLICATION)
    with pytest.raises(
        InvalidEntityForWorkflow, match="Entity given for workflow does not match expected type"
    ):
        get_workflow_entity(
            db_session,
            entity_type=WorkflowEntityType.OPPORTUNITY,
            entity_id=opportunity.opportunity_id,
            config=config,
        )


def test_get_workflow_entity_opportunity_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_type=WorkflowEntityType.OPPORTUNITY)

    with pytest.raises(EntityNotFound, match="Opportunity not found"):
        get_workflow_entity(
            db_session,
            entity_type=WorkflowEntityType.OPPORTUNITY,
            entity_id=uuid.uuid4(),
            config=config,
        )


def test_get_workflow_entity_application_missing(db_session, enable_factory_create):
    config = build_workflow_config(entity_type=WorkflowEntityType.APPLICATION)

    with pytest.raises(EntityNotFound, match="Application not found"):
        get_workflow_entity(
            db_session,
            entity_type=WorkflowEntityType.APPLICATION,
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
