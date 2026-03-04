import uuid

import apiflask.exceptions
import pytest

from src.adapters import db
from src.constants.lookup_constants import (
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
from src.services.workflows.ingest_workflow_event import ingest_workflow_event
from tests.lib.internal_user_test_utils import create_internal_user
from tests.src.db.models.factories import ApplicationFactory, OpportunityFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState


@pytest.fixture
def internal_workflow_send_user(enable_factory_create):
    # For these tests, make a user that'll always pass AuthZ
    # Note we test AuthZ on the route tests.
    return create_internal_user(privileges=[Privilege.INTERNAL_WORKFLOW_EVENT_SEND])


# ========================================
# Start Workflow Validation Tests
# ========================================


def test_start_workflow_entity_not_found(db_session: db.Session, internal_workflow_send_user):
    """Test that a 404 error is raised when opportunity doesn't exist."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "The specified resource was not found"


def test_start_workflow_invalid_workflow_type(db_session: db.Session, internal_workflow_send_user):
    """Test that a 422 error is raised when workflow type is not configured."""
    # OPPORTUNITY_PUBLISH is in the enum but not registered in WorkflowRegistry
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.OPPORTUNITY_PUBLISH,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Invalid workflow type specified"


def test_start_workflow_entity_type_mismatch(
    db_session: db.Session, enable_factory_create, internal_workflow_send_user
):
    """Test that a 422 error is raised when entity type doesn't match workflow configuration."""
    # Create an application, but BASIC_TEST_WORKFLOW workflow expects opportunities
    application = ApplicationFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.APPLICATION,
            "entity_id": str(application.application_id),
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "The provided entity is not valid for this workflow type"


def test_start_workflow_valid_entity(
    db_session: db.Session, enable_factory_create, internal_workflow_send_user
):
    """Test that validation passes when entity exists and matches workflow configuration."""
    opportunity = OpportunityFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(opportunity.opportunity_id),
        },
    }

    event_id = ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert event_id is not None
    assert isinstance(event_id, uuid.UUID)


# ========================================
# Process Workflow Validation Tests
# ========================================


def test_process_workflow_workflow_not_found(db_session: db.Session, internal_workflow_send_user):
    """Test that a 404 error is raised when workflow doesn't exist."""
    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(uuid.uuid4()),
            "event_to_send": "start_workflow",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "The specified workflow was not found"


def test_process_workflow_workflow_inactive(
    db_session: db.Session, enable_factory_create, internal_workflow_send_user
):
    """Test that a 422 error is raised when workflow is not active."""
    workflow = WorkflowFactory.create(
        is_active=False,
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.END,
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "This workflow is not currently active"


def test_process_workflow_invalid_event(
    db_session: db.Session, enable_factory_create, internal_workflow_send_user
):
    """Test that a 422 error is raised when event is not valid for the workflow."""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "invalid_event_name",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "The specified event is not valid for this workflow"


def test_process_workflow_valid_event(
    db_session: db.Session, enable_factory_create, internal_workflow_send_user
):
    """Test that validation passes when workflow exists, is active, and event is valid."""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",
        },
    }

    event_id = ingest_workflow_event(db_session, payload, internal_workflow_send_user)

    assert event_id is not None
    assert isinstance(event_id, uuid.UUID)
