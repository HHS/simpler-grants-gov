import uuid

import pytest

from src.constants.lookup_constants import (
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.lib.internal_user_test_utils import create_internal_user_with_jwt_and_api_key
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory, WorkflowFactory
from tests.workflow.state_machine.test_state_machines import BasicState

####################################
# Fixtures
####################################


@pytest.fixture
def agency(enable_factory_create):
    # Putting this in a fixture so the other fixtures can reference the same agency
    return AgencyFactory.create()


@pytest.fixture
def opportunity(agency) -> Opportunity:
    return OpportunityFactory.create(agency_code=agency.agency_code)


##################
# Internal User
# Always allowed through the auth
##################


@pytest.fixture
def internal_workflow_send_user_values(db_session, enable_factory_create):
    user, token, api_key = create_internal_user_with_jwt_and_api_key(
        db_session, privileges=[Privilege.INTERNAL_WORKFLOW_EVENT_SEND]
    )

    return user, token, api_key


@pytest.fixture
def internal_send_user(internal_workflow_send_user_values):
    return internal_workflow_send_user_values[0]


@pytest.fixture
def internal_send_user_jwt(internal_workflow_send_user_values):
    return internal_workflow_send_user_values[1]


@pytest.fixture
def internal_send_user_api_key(internal_workflow_send_user_values):
    return internal_workflow_send_user_values[2]


##################
# Users for the above agency
# With specific privileges
##################


@pytest.fixture
def budget_officer_jwt(db_session, agency) -> str:
    _, _, token = create_user_in_agency_with_jwt(
        db_session, agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    return token


@pytest.fixture
def program_officer_jwt(db_session, agency) -> str:
    _, _, token = create_user_in_agency_with_jwt(
        db_session, agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    return token


####################################
# Happy Path Tests
####################################


def test_put_workflow_event_start_workflow_internal_user_200(
    client, internal_send_user_jwt, enable_factory_create, workflow_sqs_queue
):
    """Test successful start_workflow event via HTTP endpoint (integration test)."""
    opportunity = OpportunityFactory.create()

    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(opportunity.opportunity_id),
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": internal_send_user_jwt}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_put_workflow_event_process_workflow_internal_user_200(
    client, internal_send_user_jwt, enable_factory_create
):
    """Test successful process_workflow event via HTTP endpoint (integration test)."""
    workflow = WorkflowFactory.create(
        is_active=True,
        workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
        current_workflow_state=BasicState.START,
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": internal_send_user_jwt}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_put_workflow_event_process_workflow_internal_user_api_key_200(
    client, internal_send_user_api_key, enable_factory_create
):
    """Same as above. but verifies API key works as well"""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "start_workflow",  # Valid event for BASIC_TEST_WORKFLOW
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-API-Key": internal_send_user_api_key}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_put_workflow_event_process_workflow_program_officer_200(
    client, program_officer_jwt, enable_factory_create, opportunity
):
    """Test successful process_workflow event via HTTP endpoint (integration test)."""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "receive_program_officer_approval",
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": program_officer_jwt}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


def test_put_workflow_event_process_workflow_budget_officer_200(
    client, budget_officer_jwt, enable_factory_create, opportunity
):
    """Test successful process_workflow event via HTTP endpoint (integration test)."""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "receive_budget_officer_approval",
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_jwt}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"


####################################
# Auth Issue Tests
####################################


def test_put_workflow_event_missing_token_401(client):
    """Test that requests without auth token are rejected."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }
    response = client.put("/v1/workflows/events", json=payload)
    assert response.status_code == 401
    assert response.get_json()["message"] == "Unable to process token"


def test_put_workflow_event_unauthorized_jwt_401(client):
    """Test that requests without auth token are rejected."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": "not-a-token"}
    )
    assert response.status_code == 401
    assert response.get_json()["message"] == "Unable to process token"


def test_put_workflow_event_unauthorized_api_key_401(client):
    """Test that requests without auth token are rejected."""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": str(uuid.uuid4()),
        },
    }
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-API-Key": "not-an-api-key"}
    )
    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid API key"


def test_put_workflow_event_start_workflow_non_internal_user_403(
    client, budget_officer_jwt, agency, opportunity
):
    """Test that start workflow events can't be called by other users"""
    payload = {
        "event_type": WorkflowEventType.START_WORKFLOW,
        "start_workflow_context": {
            "workflow_type": WorkflowType.BASIC_TEST_WORKFLOW,
            "entity_type": WorkflowEntityType.OPPORTUNITY,
            "entity_id": opportunity.opportunity_id,
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_jwt}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_put_workflow_event_process_workflow_program_officer_403(
    client, program_officer_jwt, enable_factory_create, opportunity
):
    """Test that a program officer can't do a budget officer approval"""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "receive_budget_officer_approval",
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": program_officer_jwt}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_put_workflow_event_process_workflow_budget_officer_403(
    client, budget_officer_jwt, enable_factory_create, opportunity
):
    """Test that a budget officer can't do a program officer approval"""
    workflow = WorkflowFactory.create(
        is_active=True, workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
    )

    payload = {
        "event_type": WorkflowEventType.PROCESS_WORKFLOW,
        "process_workflow_context": {
            "workflow_id": str(workflow.workflow_id),
            "event_to_send": "receive_program_officer_approval",
        },
    }

    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_jwt}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


####################################
# Validation Tests
####################################


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
def test_put_workflow_request_validation_422(client, internal_send_user_jwt, payload, expected_msg):
    """Test that schema validation errors are returned for invalid payloads."""
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": internal_send_user_jwt}
    )

    assert response.status_code == 422

    errors = response.json.get("errors", [])
    error_messages = [err.get("message", "") for err in errors]

    assert any(expected_msg in msg for msg in error_messages)
