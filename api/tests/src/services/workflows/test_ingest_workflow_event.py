import uuid

import apiflask.exceptions
import pytest

from src.adapters import db
from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from src.services.workflows.ingest_workflow_event import ingest_workflow_event
from tests.src.db.models.factories import ApplicationFactory, OpportunityFactory, WorkflowFactory

# ========================================
# Start Workflow Validation Tests
# ========================================


def test_start_workflow_entity_not_found(db_session: db.Session):
    """Test that a 404 error is raised when opportunity doesn't exist."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entities": [
                {"entity_type": WorkflowEntityType.OPPORTUNITY, "entity_id": str(uuid.uuid4())}
            ],
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 404
    assert "Opportunity not found" in exc_info.value.message


def test_start_workflow_invalid_workflow_type(db_session: db.Session):
    """Test that a 422 error is raised when workflow type is not configured."""
    # OPPORTUNITY_PUBLISH is in the enum but not registered in WorkflowRegistry
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.OPPORTUNITY_PUBLISH,
            "entities": [
                {"entity_type": WorkflowEntityType.OPPORTUNITY, "entity_id": str(uuid.uuid4())}
            ],
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 422
    assert "does not map to an actual state machine" in exc_info.value.message


def test_start_workflow_entity_type_mismatch(db_session: db.Session, enable_factory_create):
    """Test that a 422 error is raised when entity type doesn't match workflow configuration."""
    # Create an application, but INITIAL_PROTOTYPE workflow expects opportunities
    application = ApplicationFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entities": [
                {
                    "entity_type": WorkflowEntityType.APPLICATION,
                    "entity_id": str(application.application_id),
                }
            ],
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 422
    assert "do not match expected types" in exc_info.value.message


def test_start_workflow_valid_entity(db_session: db.Session, enable_factory_create):
    """Test that validation passes when entity exists and matches workflow configuration."""
    opportunity = OpportunityFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entities": [
                {
                    "entity_type": WorkflowEntityType.OPPORTUNITY,
                    "entity_id": str(opportunity.opportunity_id),
                }
            ],
        },
    }

    event_id = ingest_workflow_event(db_session, payload)

    assert event_id is not None
    assert isinstance(event_id, uuid.UUID)


# ========================================
# Process Workflow Validation Tests
# ========================================


def test_process_workflow_workflow_not_found(db_session: db.Session):
    """Test that a 404 error is raised when workflow doesn't exist."""
    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(uuid.uuid4()),
            "event_to_send": "start_workflow",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 404
    assert "Workflow does not exist" in exc_info.value.message


def test_process_workflow_workflow_inactive(db_session: db.Session, enable_factory_create):
    """Test that a 422 error is raised when workflow is not active."""
    workflow = WorkflowFactory.create(is_active=False, workflow_type=WorkflowType.INITIAL_PROTOTYPE)

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 422
    assert "not active" in exc_info.value.message


def test_process_workflow_invalid_event(db_session: db.Session, enable_factory_create):
    """Test that a 422 error is raised when event is not valid for the workflow."""
    workflow = WorkflowFactory.create(is_active=True, workflow_type=WorkflowType.INITIAL_PROTOTYPE)

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "invalid_event_name",
        },
    }

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        ingest_workflow_event(db_session, payload)

    assert exc_info.value.status_code == 422
    assert "not valid for this workflow" in exc_info.value.message


def test_process_workflow_valid_event(db_session: db.Session, enable_factory_create):
    """Test that validation passes when workflow exists, is active, and event is valid."""
    workflow = WorkflowFactory.create(is_active=True, workflow_type=WorkflowType.INITIAL_PROTOTYPE)

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",
        },
    }

    event_id = ingest_workflow_event(db_session, payload)

    assert event_id is not None
    assert isinstance(event_id, uuid.UUID)
