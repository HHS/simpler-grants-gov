import uuid

import pytest

from src.constants.lookup_constants import WorkflowEntityType, WorkflowEventType, WorkflowType


def get_start_payload():
    return {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.OPPORTUNITY_PUBLISH,
            "entities": [
                {"entity_type": WorkflowEntityType.OPPORTUNITY, "entity_id": str(uuid.uuid4())}
            ],
        },
    }


def get_process_payload():
    return {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {"workflow_id": str(uuid.uuid4()), "event_to_send": "approve"},
    }


@pytest.mark.parametrize("payload_func", [get_start_payload, get_process_payload])
def test_workflow_event_put_happy_path(client, user_auth_token, payload_func):
    payload = payload_func()
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_workflow_event_put_unauthorized(client):
    response = client.put("/v1/workflows/events", json=get_start_payload())
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
                "start_workflow_context": get_start_payload()["start_workflow_context"],
                "process_workflow_context": get_process_payload()["process_workflow_context"],
            },
            "process_workflow_context should not be provided",
        ),
        (
            {
                "event_type": WorkflowEventType.START_WORKFLOW,
                "start_workflow_context": {
                    "workflow_type": WorkflowType.OPPORTUNITY_PUBLISH,
                    "entities": [{"entity_type": "opportunity", "entity_id": str(uuid.uuid4())}]
                    * 6,
                },
            },
            "maximum length 5",
        ),
    ],
)
def test_workflow_event_put_schema_validation(client, user_auth_token, payload, expected_msg):
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": user_auth_token}
    )

    assert response.status_code == 422

    errors = response.json.get("errors", [])
    error_messages = [err.get("message", "") for err in errors]

    assert any(expected_msg in msg for msg in error_messages)
