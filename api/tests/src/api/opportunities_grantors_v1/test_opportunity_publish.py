import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import Privilege, WorkflowType
from src.db.models.workflow_models import Workflow
from src.workflow.manager.workflow_manager import WorkflowManager
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityFactory


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with PUBLISH_OPPORTUNITY permission and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.PUBLISH_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def existing_opportunity(grantor_auth_data, enable_factory_create):
    """Create a draft opportunity belonging to the grantor's agency"""
    _, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=True,
    )


@pytest.fixture
def workflow_user(db_session, enable_factory_create, monkeypatch):
    """Get the workflow user, setting them up with expected params"""
    from src.constants.lookup_constants import RoleType
    from tests.src.db.models.factories import (
        InternalUserRoleFactory,
        RoleFactory,
        UserFactory,
        UserProfileFactory,
    )

    user = UserFactory.create()
    UserProfileFactory.create(user=user, first_name="System", last_name="User")

    role = RoleFactory.create(
        privileges=[Privilege.INTERNAL_WORKFLOW_ACCESS], role_types=[RoleType.INTERNAL]
    )
    InternalUserRoleFactory.create(user=user, role=role)

    monkeypatch.setenv("WORKFLOW_SERVICE_INTERNAL_USER_ID", str(user.user_id))

    return user


@pytest.fixture(scope="session")
def workflow_client_registry(search_client):
    """Initialize the workflow client registry"""
    from src.workflow.registry.workflow_client_registry import init_workflow_client_registry

    return init_workflow_client_registry(search_client=search_client)


def test_opportunity_publish_success(
    client,
    app,
    grantor_auth_data,
    existing_opportunity,
    db_session,
    workflow_sqs_queue,
    workflow_user,
    search_client,
    workflow_client_registry,
):
    """Test successfully publishing an opportunity"""
    _, _, token, _ = grantor_auth_data

    response = client.post(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}/publish",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    # Opportunity should still be in draft state in the response because the workflow hasn't processed it yet
    assert response_json["data"]["is_draft"] is True

    # Process the workflow event
    with app.app_context():
        messages_to_delete, messages_to_keep = WorkflowManager().process_batch()
        assert len(messages_to_delete) == 1
        assert len(messages_to_keep) == 0

    # Refresh the opportunity and check that it's no longer a draft
    db_session.refresh(existing_opportunity)
    assert existing_opportunity.is_draft is False

    # Verify a workflow was created
    workflow = db_session.execute(
        select(Workflow).where(Workflow.opportunity_id == existing_opportunity.opportunity_id)
    ).scalar_one_or_none()

    assert workflow is not None
    assert workflow.workflow_type == WorkflowType.OPPORTUNITY_PUBLISH
    assert workflow.opportunity_id == existing_opportunity.opportunity_id


def test_opportunity_publish_already_published(client, grantor_auth_data, enable_factory_create):
    """Test attempting to publish an already published opportunity"""
    _, agency, token, _ = grantor_auth_data
    published_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{published_opportunity.opportunity_id}/publish",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert response_json["message"] == "Opportunity is already published"


def test_opportunity_publish_not_simpler_grants(client, grantor_auth_data, enable_factory_create):
    """Test attempting to publish a non-Simpler Grants opportunity"""
    _, agency, token, _ = grantor_auth_data
    legacy_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=False,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{legacy_opportunity.opportunity_id}/publish",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert response_json["message"] == "Only opportunities created in Simpler Grants can be updated"


def test_opportunity_publish_no_permission(client, db_session, enable_factory_create):
    """Test attempting to publish without proper permissions"""
    # Create user without PUBLISH_OPPORTUNITY permission
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=True,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/publish",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_opportunity_publish_not_found(client, grantor_auth_data):
    """Test attempting to publish a non-existent opportunity"""
    _, _, token, _ = grantor_auth_data

    opportunity_id = uuid.uuid4()
    response = client.post(
        f"/v1/grantors/opportunities/{opportunity_id}/publish",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == f"Could not find Opportunity with ID {opportunity_id}"
