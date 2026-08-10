import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityFactory


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with delete-related permissions and return auth data."""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def existing_opportunity(grantor_auth_data, enable_factory_create):
    """Create a draft SGM opportunity belonging to the grantor's agency."""
    _, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=True,
        is_deleted=False,
    )


def test_opportunity_delete_200_success(
    client, db_session, grantor_auth_data, existing_opportunity
):
    """Test successful delete marks the opportunity as soft deleted."""
    _, _, token, _ = grantor_auth_data

    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 200
    assert (
        db_session.execute(
            select(Opportunity.is_deleted).where(
                Opportunity.opportunity_id == existing_opportunity.opportunity_id
            )
        ).scalar_one()
        is True
    )


def test_opportunity_delete_401_no_token(client, existing_opportunity):
    """Test missing auth returns 401."""
    resp = client.delete(f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}")

    assert resp.status_code == 401


def test_opportunity_delete_401_invalid_token(client, existing_opportunity):
    """Test invalid token returns 401."""
    resp = client.delete(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        headers={"X-SGG-Token": "invalid-token"},
    )

    assert resp.status_code == 401


def test_opportunity_delete_403_no_permission(client, db_session, enable_factory_create):
    """Test user without UPDATE_OPPORTUNITY permission gets 403."""
    _, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )
    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=True,
        is_deleted=False,
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_opportunity_delete_404_not_found(client, grantor_auth_data):
    """Test non-existent opportunity returns 404."""
    _, _, token, _ = grantor_auth_data

    opportunity_id = uuid.uuid4()
    resp = client.delete(
        f"/v1/grantors/opportunities/{opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Opportunity with ID {opportunity_id}"


def test_opportunity_delete_422_published_opportunity(
    client, grantor_auth_data, enable_factory_create
):
    """Test published opportunities cannot be deleted."""
    _, agency, token, _ = grantor_auth_data
    published_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
        is_deleted=False,
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{published_opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422
    assert resp.get_json()["message"] == "Only draft opportunities can be updated"


def test_opportunity_delete_422_non_simpler_grants_opportunity(
    client, grantor_auth_data, enable_factory_create
):
    """Test non-SGM opportunities cannot be deleted."""
    _, agency, token, _ = grantor_auth_data
    legacy_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=True,
        is_simpler_grants_opportunity=False,
        is_deleted=False,
    )

    resp = client.delete(
        f"/v1/grantors/opportunities/{legacy_opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422
    assert (
        resp.get_json()["message"] == "Only opportunities created in Simpler Grants can be updated"
    )
