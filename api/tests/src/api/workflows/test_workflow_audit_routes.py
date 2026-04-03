import uuid

import pytest

from src.constants.lookup_constants import Privilege, WorkflowType
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityFactory,
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
def opportunity(agency, enable_factory_create):
    return OpportunityFactory.create(agency_code=agency.agency_code)


####################################
# Workflow Audit Tests
####################################


class TestWorkflowAuditEndpoint:
    """Tests for the workflow audit endpoint."""

    def test_get_opportunity_workflow_200(
        self, client, db_session, enable_factory_create, agency, opportunity
    ):
        """Test successfully fetching an opportunity workflow with audits and approvals."""
        # Create a user with VIEW_OPPORTUNITY privilege in the agency
        # if first_name or last_name provided, user profile will be created
        user, _, token = create_user_in_agency_with_jwt(
            db_session,
            agency=agency,
            privileges=[Privilege.VIEW_OPPORTUNITY],
            email="testWorkflowAudit@example.com",
            first_name="testFirstNameWA",
            last_name="testLastNameWA",
        )

        # Create workflow
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.BASIC_TEST_WORKFLOW,
            current_workflow_state=BasicState.MIDDLE,
            is_active=True,
            opportunity=opportunity,
        )

        event_ids = []

        # Create audit events
        start_event = WorkflowEventHistoryFactory.create()
        event_ids.append(str(start_event.event_id))

        audit_events = []

        audit_events.append(
            WorkflowAuditFactory.create(
                workflow=workflow,
                acting_user=user,
                transition_event="start_workflow",
                source_state=BasicState.START,
                target_state=BasicState.MIDDLE,
                event_id=start_event.event_id,
            )
        )
        for i in range(4):
            middle_event = WorkflowEventHistoryFactory.create()
            event_ids.append(str(middle_event.event_id))
            audit_events.append(
                WorkflowAuditFactory.create(
                    workflow=workflow,
                    acting_user=user,
                    transition_event=f"event_{i}",
                    source_state=BasicState.MIDDLE,
                    target_state=BasicState.MIDDLE,
                    event_id=middle_event.event_id,
                )
            )

        response = client.post(
            f"/v1/workflows/{workflow.workflow_id}/audit",
            json={"pagination": {"page_offset": 1, "page_size": 3}},
            headers={"X-SGG-Token": token},
        )

        # Verify response
        assert response.status_code == 200
        assert response.json["status_code"] == 200
        assert response.json["message"] == "Success"

        # Verify pagination info
        assert response.json["pagination_info"]["page_offset"] == 1
        assert response.json["pagination_info"]["page_size"] == 3
        assert response.json["pagination_info"]["total_records"] == 5
        assert response.json["pagination_info"]["total_pages"] == 2

        # Verify data
        assert len(response.json["data"]) == 3

        # Verify sorting (default is descending by created_at)
        for i in range(len(response.json["data"]) - 1):
            event1_created_at = response.json["data"][i]["created_at"]
            event2_created_at = response.json["data"][i + 1]["created_at"]
            assert event1_created_at >= event2_created_at

        # Verify acting user info (from user_profile) is included and correct
        # Sanity check source_state and event info
        for i in range(len(response.json["data"])):
            first_name = response.json["data"][i]["acting_user"]["first_name"]
            last_name = response.json["data"][i]["acting_user"]["last_name"]
            email = response.json["data"][i]["acting_user"]["email"]
            source_state = response.json["data"][i]["source_state"]
            event_id = response.json["data"][i]["event"]["event_id"]
            sent_at = response.json["data"][i]["event"]["sent_at"]

            assert first_name == "testFirstNameWA"
            assert last_name == "testLastNameWA"
            assert email == "testWorkflowAudit@example.com"

            assert source_state in [BasicState.START.value, BasicState.MIDDLE.value]
            assert event_id in event_ids
            assert sent_at is not None

    def test_workflow_audit_not_found(self, client, db_session, agency):
        """Test workflow audit endpoint with non-existent workflow ID."""
        # Create a user with VIEW_OPPORTUNITY privilege in the agency
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        # Generate a random workflow ID
        random_workflow_id = uuid.uuid4()

        # Make the request
        response = client.post(
            f"/v1/workflows/{random_workflow_id}/audit",
            json={"pagination": {"page_offset": 1, "page_size": 25}},
            headers={"X-SGG-Token": token},
        )

        # Verify response
        assert response.status_code == 404
        assert response.json["status_code"] == 404
        assert f"Could not find Workflow with ID {random_workflow_id}" in response.json["message"]

    def test_workflow_audit_unauthorized(self, client, db_session, opportunity, agency):
        """Test workflow audit endpoint with unauthorized user."""
        # Create a workflow
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
            opportunity=opportunity,
        )

        # Create a user WITHOUT VIEW_OPPORTUNITY privilege
        user, _, token = create_user_in_agency_with_jwt(db_session, agency=agency, privileges=[])

        # Make the request
        response = client.post(
            f"/v1/workflows/{workflow.workflow_id}/audit",
            json={"pagination": {"page_offset": 1, "page_size": 25}},
            headers={"X-SGG-Token": token},
        )

        # Verify response
        assert response.status_code == 403
        assert response.json["status_code"] == 403
        assert "Forbidden" in response.json["message"]

    def test_workflow_audit_custom_sort(self, client, db_session, opportunity, agency):
        """Test workflow audit endpoint with custom sorting."""
        # Create a workflow with audit events
        workflow = WorkflowFactory.create(
            workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
            opportunity=opportunity,
        )

        # Create a user with VIEW_OPPORTUNITY privilege in the agency
        user, _, token = create_user_in_agency_with_jwt(
            db_session, agency=agency, privileges=[Privilege.VIEW_OPPORTUNITY]
        )

        # Create audit events
        start_event = WorkflowEventHistoryFactory.create()
        audit_events = []
        audit_events.append(
            WorkflowAuditFactory.create(
                workflow=workflow,
                acting_user=user,
                transition_event="start_workflow",
                source_state=BasicState.START,
                target_state=BasicState.MIDDLE,
                event_id=start_event.event_id,
            )
        )
        for i in range(4):
            middle_event = WorkflowEventHistoryFactory.create()
            audit_events.append(
                WorkflowAuditFactory.create(
                    workflow=workflow,
                    acting_user=user,
                    transition_event=f"event_{i}",
                    source_state=BasicState.MIDDLE,
                    target_state=BasicState.MIDDLE,
                    event_id=middle_event.event_id,
                )
            )

        # Make the request with ascending sort
        response = client.post(
            f"/v1/workflows/{workflow.workflow_id}/audit",
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 5,
                    "sort_order": [{"order_by": "created_at", "sort_direction": "ascending"}],
                }
            },
            headers={"X-SGG-Token": token},
        )

        # Verify response
        assert response.status_code == 200

        # Verify sorting (ascending by created_at)
        for i in range(len(response.json["data"]) - 1):
            event1_created_at = response.json["data"][i]["created_at"]
            event2_created_at = response.json["data"][i + 1]["created_at"]
            assert event1_created_at <= event2_created_at
