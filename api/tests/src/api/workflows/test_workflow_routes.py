import uuid

import pytest

from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType
from tests.src.db.models.factories import OpportunityFactory, WorkflowFactory


def test_workflow_event_put_unauthorized(client):
    """Test that requests without auth token are rejected."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }
    response = client.put("/v1/workflows/events", json=payload)
    assert response.status_code == 401


@pytest.mark.parametrize(
    "payload, expected_msg",
    [
        ({"event_type": WorkflowEventType.START_WORKFLOW}, "start_workflow_context is required"),
        (
            {"event_type": WorkflowEventType.PROCESS_WORKFLOW},
            "process_workflow_context is required",
        ),
        (
            {
                "event_type": WorkflowEventType.START_WORKFLOW,
                "start_workflow_context": {
                    "workflow_type": WorkflowType.OPPORTUNITY_PUBLISH,
                    "entity_type": WorkflowEntityType.OPPORTUNITY,
                    "entity_id": str(uuid.uuid4()),
                },
                "process_workflow_context": {
                    "workflow_id": str(uuid.uuid4()),
                    "event_to_send": "approve",
                },
            },
            "process_workflow_context should not be provided",
        ),
    ],
)
def test_workflow_event_put_schema_validation(client, user_auth_token, payload, expected_msg):
    """Test that schema validation errors are returned for invalid payloads."""
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 422

    errors = response.json.get("errors", [])
    error_messages = [err.get("message", "") for err in errors]

    assert any(expected_msg in msg for msg in error_messages)


def test_start_workflow_integration(client, user_auth_token, enable_factory_create):
    """Test successful start_workflow event via HTTP endpoint (integration test)."""
    opportunity = OpportunityFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.INITIAL_PROTOTYPE,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(opportunity.opportunity_id),
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_process_workflow_integration(client, user_auth_token, enable_factory_create):
    """Test successful process_workflow event via HTTP endpoint (integration test)."""
    workflow = WorkflowFactory.create(is_active=True, workflow_type=WorkflowType.INITIAL_PROTOTYPE)

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",  # Valid event for INITIAL_PROTOTYPE
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"
