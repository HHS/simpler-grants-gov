import uuid
from datetime import UTC, datetime, timedelta

import pytest

from src.adapters.aws.sqs_adapter import SQSClient
from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    Privilege,
    WorkflowEntityType,
    WorkflowEventType,
    WorkflowType,
)
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.workflow.event.workflow_event import WorkflowEvent
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.lib.internal_user_test_utils import create_internal_user_with_jwt_and_api_key
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    OpportunityFactory,
    WorkflowApprovalFactory,
    WorkflowAuditFactory,
    WorkflowEventHistoryFactory,
    WorkflowFactory,
)
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
def budget_officer_user_jwt(db_session, agency) -> tuple[User, str]:
    user, _, token = create_user_in_agency_with_jwt(
        db_session, agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
    )
    return user, token


@pytest.fixture
def program_officer_user_jwt(db_session, agency) -> tuple[User, str]:
    user, _, token = create_user_in_agency_with_jwt(
        db_session, agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL]
    )
    return user, token


####################################
# Happy Path Tests
####################################


def test_put_workflow_event_start_workflow_internal_user_200(
    client, internal_send_user, internal_send_user_jwt, enable_factory_create, workflow_sqs_queue
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

    # Verify the message that we sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 1
    message = WorkflowEvent.model_validate_json(messages[0].body)
    assert str(message.event_id) == response.json["data"]["event_id"]
    assert message.acting_user_id == internal_send_user.user_id
    assert message.event_type == WorkflowEventType.START_WORKFLOW
    assert message.start_workflow_context.workflow_type == WorkflowType.BASIC_TEST_WORKFLOW
    assert message.start_workflow_context.entity_type == WorkflowEntityType.OPPORTUNITY
    assert message.start_workflow_context.entity_id == opportunity.opportunity_id


def test_put_workflow_event_process_workflow_internal_user_200(
    client, internal_send_user, internal_send_user_jwt, enable_factory_create, workflow_sqs_queue
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

    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 1
    message = WorkflowEvent.model_validate_json(messages[0].body)
    assert str(message.event_id) == response.json["data"]["event_id"]
    assert message.acting_user_id == internal_send_user.user_id
    assert message.event_type == WorkflowEventType.PROCESS_WORKFLOW
    assert message.process_workflow_context.workflow_id == workflow.workflow_id
    assert message.process_workflow_context.event_to_send == "start_workflow"


def test_put_workflow_event_process_workflow_internal_user_api_key_200(
    client,
    internal_send_user,
    internal_send_user_api_key,
    enable_factory_create,
    workflow_sqs_queue,
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

    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 1
    message = WorkflowEvent.model_validate_json(messages[0].body)
    assert str(message.event_id) == response.json["data"]["event_id"]
    assert message.acting_user_id == internal_send_user.user_id
    assert message.event_type == WorkflowEventType.PROCESS_WORKFLOW
    assert message.process_workflow_context.workflow_id == workflow.workflow_id
    assert message.process_workflow_context.event_to_send == "start_workflow"


def test_put_workflow_event_process_workflow_program_officer_200(
    client, program_officer_user_jwt, enable_factory_create, opportunity, workflow_sqs_queue
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
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": program_officer_user_jwt[1]}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"

    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 1
    message = WorkflowEvent.model_validate_json(messages[0].body)
    assert str(message.event_id) == response.json["data"]["event_id"]
    assert message.acting_user_id == program_officer_user_jwt[0].user_id
    assert message.event_type == WorkflowEventType.PROCESS_WORKFLOW
    assert message.process_workflow_context.workflow_id == workflow.workflow_id
    assert message.process_workflow_context.event_to_send == "receive_program_officer_approval"


def test_put_workflow_event_process_workflow_budget_officer_200(
    client, budget_officer_user_jwt, enable_factory_create, opportunity, workflow_sqs_queue
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
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_user_jwt[1]}
    )

    assert response.status_code == 200
    assert "event_id" in response.json["data"]
    assert response.json["message"] == "Event received"

    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 1
    message = WorkflowEvent.model_validate_json(messages[0].body)
    assert str(message.event_id) == response.json["data"]["event_id"]
    assert message.acting_user_id == budget_officer_user_jwt[0].user_id
    assert message.event_type == WorkflowEventType.PROCESS_WORKFLOW
    assert message.process_workflow_context.workflow_id == workflow.workflow_id
    assert message.process_workflow_context.event_to_send == "receive_budget_officer_approval"


####################################
# Auth Issue Tests
####################################


def test_put_workflow_event_missing_token_401(client, workflow_sqs_queue):
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

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


def test_put_workflow_event_unauthorized_jwt_401(client, workflow_sqs_queue):
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

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


def test_put_workflow_event_unauthorized_api_key_401(client, workflow_sqs_queue):
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

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


def test_put_workflow_event_start_workflow_non_internal_user_403(
    client, budget_officer_user_jwt, agency, opportunity, workflow_sqs_queue
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
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_user_jwt[1]}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


def test_put_workflow_event_process_workflow_program_officer_403(
    client, program_officer_user_jwt, enable_factory_create, opportunity, workflow_sqs_queue
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
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": program_officer_user_jwt[1]}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


def test_put_workflow_event_process_workflow_budget_officer_403(
    client, budget_officer_user_jwt, enable_factory_create, opportunity, workflow_sqs_queue
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
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": budget_officer_user_jwt[1]}
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


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
def test_put_workflow_request_validation_422(
    client, internal_send_user_jwt, payload, expected_msg, workflow_sqs_queue
):
    """Test that schema validation errors are returned for invalid payloads."""
    response = client.put(
        "/v1/workflows/events", json=payload, headers={"X-SGG-Token": internal_send_user_jwt}
    )

    assert response.status_code == 422

    errors = response.json.get("errors", [])
    error_messages = [err.get("message", "") for err in errors]

    assert any(expected_msg in msg for msg in error_messages)

    # Verify no message sent
    messages = SQSClient(workflow_sqs_queue).receive_messages(wait_time=0)
    assert len(messages) == 0


####################################
# GET Workflow Tests
####################################


class TestWorkflowGet:
    """Tests for GET /v1/workflows/:workflow_id endpoint."""

    def test_get_opportunity_workflow_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test successfully fetching an opportunity workflow with audits and approvals."""
        # Create a user with VIEW_OPPORTUNITY privilege in the agency
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        # Create workflow with audits and approvals
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            current_workflow_state=BasicState.MIDDLE,
            is_active=True,
            opportunity=opportunity,
        )

        # Create audit events
        event1 = WorkflowEventHistoryFactory.create()

        audit1 = WorkflowAuditFactory.create(
            workflow=workflow,
            acting_user=user,
            transition_event="start_workflow",
            source_state=BasicState.START,
            target_state=BasicState.MIDDLE,
            event_id=event1.event_id,
        )

        # Create approval
        approval1 = WorkflowApprovalFactory.create(
            workflow=workflow,
            approving_user=user,
            event=event1,
            approval_type=ApprovalType.PROGRAM_OFFICER_APPROVAL,
            approval_response_type=ApprovalResponseType.APPROVED,
            is_still_valid=True,
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify basic workflow fields
        assert data["workflow_id"] == str(workflow.workflow_id)
        assert data["workflow_type"] == WorkflowType.BASIC_TEST_WORKFLOW
        assert data["current_workflow_state"] == BasicState.MIDDLE
        assert data["is_active"] is True
        assert data["opportunity_id"] == str(opportunity.opportunity_id)
        assert data["application_id"] is None
        assert data["application_submission_id"] is None

        # Verify audit events
        assert len(data["workflow_audit_events"]) == 1
        audit_data = data["workflow_audit_events"][0]
        assert audit_data["workflow_audit_id"] == str(audit1.workflow_audit_id)
        assert audit_data["transition_event"] == "start_workflow"
        assert audit_data["source_state"] == BasicState.START
        assert audit_data["target_state"] == BasicState.MIDDLE
        assert audit_data["acting_user"]["user_id"] == str(user.user_id)
        assert audit_data["acting_user"]["email"] == user.email

        # Verify approvals
        assert len(data["workflow_approvals"]) == 1
        approval_data = data["workflow_approvals"][0]
        assert approval_data["workflow_approval_id"] == str(approval1.workflow_approval_id)
        assert approval_data["approval_type"] == ApprovalType.PROGRAM_OFFICER_APPROVAL
        assert approval_data["approval_response_type"] == ApprovalResponseType.APPROVED
        assert approval_data["is_still_valid"] is True
        assert approval_data["approving_user"]["user_id"] == str(user.user_id)

        # Verify approval config exists
        assert "workflow_approval_config" in data
        assert isinstance(data["workflow_approval_config"], dict)

    def test_get_application_workflow_200(self, client, db_session, enable_factory_create, agency):
        """Test successfully fetching an application workflow."""
        # Create a user with VIEW_APPLICATION privilege
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_APPLICATION]
        )

        # Create application (which creates competition and opportunity)
        application = ApplicationFactory.create()
        # Link the opportunity to our agency
        application.competition.opportunity.agency_code = agency.agency_code
        db_session.flush()

        # Create workflow for application
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            current_workflow_state=BasicState.START,
            is_active=True,
            application=application,
            opportunity=None,  # Explicitly set to None
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify entity IDs
        assert data["opportunity_id"] is None
        assert data["application_id"] == str(application.application_id)
        assert data["application_submission_id"] is None

    def test_approval_config_includes_possible_users_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test that approval config includes possible users with required privileges."""
        # Create multiple users with different privileges
        program_officer, _, po_token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.PROGRAM_OFFICER_APPROVAL, Privilege.VIEW_OPPORTUNITY],
        )
        budget_officer, _, _ = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
        )

        # Create workflow
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            opportunity=opportunity,
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": po_token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify approval config structure
        approval_config = data["workflow_approval_config"]
        assert "receive_program_officer_approval" in approval_config
        assert "receive_budget_officer_approval" in approval_config

        # Check program officer approval config
        po_config = approval_config["receive_program_officer_approval"]
        assert po_config["approval_type"] == ApprovalType.PROGRAM_OFFICER_APPROVAL
        assert Privilege.PROGRAM_OFFICER_APPROVAL in po_config["required_privileges"]
        po_users = po_config["possible_users"]
        assert len(po_users) == 1
        assert po_users[0]["user_id"] == str(program_officer.user_id)
        assert po_users[0]["email"] == program_officer.email

        # Check budget officer approval config
        bo_config = approval_config["receive_budget_officer_approval"]
        assert bo_config["approval_type"] == ApprovalType.BUDGET_OFFICER_APPROVAL
        assert Privilege.BUDGET_OFFICER_APPROVAL in bo_config["required_privileges"]
        bo_users = bo_config["possible_users"]
        assert len(bo_users) == 1
        assert bo_users[0]["user_id"] == str(budget_officer.user_id)

    def test_audit_events_sorted_by_created_at_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test that audit events are sorted by created_at timestamp."""
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
        )

        # Create audit events with different timestamps
        event1 = WorkflowEventHistoryFactory.create()

        now = datetime.now(UTC)
        audit3 = WorkflowAuditFactory.create(
            workflow=workflow,
            acting_user=user,
            event_id=event1.event_id,
            created_at=now + timedelta(hours=2),
        )
        audit1 = WorkflowAuditFactory.create(
            workflow=workflow,
            acting_user=user,
            event_id=event1.event_id,
            created_at=now,
        )
        audit2 = WorkflowAuditFactory.create(
            workflow=workflow,
            acting_user=user,
            event_id=event1.event_id,
            created_at=now + timedelta(hours=1),
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify sorted order
        audit_events = data["workflow_audit_events"]
        assert len(audit_events) == 3
        assert audit_events[0]["workflow_audit_id"] == str(audit1.workflow_audit_id)
        assert audit_events[1]["workflow_audit_id"] == str(audit2.workflow_audit_id)
        assert audit_events[2]["workflow_audit_id"] == str(audit3.workflow_audit_id)

    def test_approvals_sorted_by_created_at_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test that approvals are sorted by created_at timestamp."""
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
        )

        event1 = WorkflowEventHistoryFactory.create()

        # Create approvals with different timestamps
        now = datetime.now(UTC)
        approval3 = WorkflowApprovalFactory.create(
            workflow=workflow,
            approving_user=user,
            event=event1,
            created_at=now + timedelta(hours=2),
        )
        approval1 = WorkflowApprovalFactory.create(
            workflow=workflow,
            approving_user=user,
            event=event1,
            created_at=now,
        )
        approval2 = WorkflowApprovalFactory.create(
            workflow=workflow,
            approving_user=user,
            event=event1,
            created_at=now + timedelta(hours=1),
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify sorted order
        approvals = data["workflow_approvals"]
        assert len(approvals) == 3
        assert approvals[0]["workflow_approval_id"] == str(approval1.workflow_approval_id)
        assert approvals[1]["workflow_approval_id"] == str(approval2.workflow_approval_id)
        assert approvals[2]["workflow_approval_id"] == str(approval3.workflow_approval_id)

    def test_workflow_with_no_audits_or_approvals_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test fetching workflow with no audit events or approvals."""
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 200
        data = response.json["data"]

        # Verify empty lists
        assert data["workflow_audit_events"] == []
        assert data["workflow_approvals"] == []
        # Config should still be present
        assert "workflow_approval_config" in data

    def test_get_workflow_no_token_401(self, client):
        """Test that requests without auth token are rejected."""
        response = client.get(f"/v1/workflows/{uuid.uuid4()}")

        assert response.status_code == 401
        assert response.json["message"] == "Unable to process token"

    def test_get_workflow_invalid_token_401(self, client):
        """Test that requests with invalid JWT are rejected."""
        response = client.get(
            f"/v1/workflows/{uuid.uuid4()}", headers={"X-SGG-Token": "invalid-token"}
        )

        assert response.status_code == 401
        assert response.json["message"] == "Unable to process token"

    def test_get_workflow_wrong_agency_403(
        self, client, db_session, enable_factory_create, opportunity
    ):
        """Test that users from different agency cannot access workflow."""
        # Create user in different agency
        other_agency = AgencyFactory.create()
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=other_agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        # Create workflow for original opportunity
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 403
        assert response.json["message"] == "Forbidden"

    def test_get_workflow_wrong_privilege_403(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test that users without required privilege cannot access workflow."""
        # Create user with different privilege (not VIEW_OPPORTUNITY)
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL]
        )

        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW, opportunity=opportunity
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 403
        assert response.json["message"] == "Forbidden"

    def test_get_workflow_application_submission_403(
        self, client, db_session, enable_factory_create, agency
    ):
        """Test that application submission workflows return 403 (not implemented)."""
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        # Create application submission
        application = ApplicationFactory.create()
        application.competition.opportunity.agency_code = agency.agency_code
        db_session.flush()

        application_submission = ApplicationSubmissionFactory.create(application=application)

        # Create workflow for application submission
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            application_submission=application_submission,
            opportunity=None,
            application=None,
        )

        response = client.get(
            f"/v1/workflows/{workflow.workflow_id}", headers={"X-SGG-Token": token}
        )

        assert response.status_code == 403
        assert "Application submission workflows are not yet accessible" in response.json["message"]

    def test_get_workflow_not_found_404(self, client, db_session, enable_factory_create, agency):
        """Test that invalid workflow_id returns 404."""
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        non_existent_id = uuid.uuid4()
        response = client.get(f"/v1/workflows/{non_existent_id}", headers={"X-SGG-Token": token})

        assert response.status_code == 404
        assert f"Could not find Workflow with ID {non_existent_id}" in response.json["message"]
