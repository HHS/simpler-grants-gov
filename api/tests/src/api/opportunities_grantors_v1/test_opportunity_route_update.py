import uuid

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityFactory


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with UPDATE_OPPORTUNITY permission and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def existing_opportunity(grantor_auth_data, enable_factory_create):
    """Create an opportunity belonging to the grantor's agency"""
    _, agency, _, _ = grantor_auth_data
    return OpportunityFactory.create(agency_code=agency.agency_code, is_draft=True)


def test_opportunity_update_200_full_update(client, grantor_auth_data, existing_opportunity):
    """Test updating all updatable fields"""
    _, _, token, _ = grantor_auth_data

    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={
            "opportunity_title": "Updated Title",
            "category": "discretionary",
            "category_explanation": "Updated explanation",
        },
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Success"
    assert data["data"]["opportunity_title"] == "Updated Title"
    assert data["data"]["category"] == "discretionary"
    assert data["data"]["category_explanation"] == "Updated explanation"


def test_opportunity_update_200_partial_update(client, grantor_auth_data, existing_opportunity):
    """Test that only provided fields are updated"""
    _, _, token, _ = grantor_auth_data
    original_category = existing_opportunity.category

    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "Only Title Changed"},
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["data"]["opportunity_title"] == "Only Title Changed"
    assert data["data"]["category"] == original_category.value


def test_opportunity_update_200_api_key_auth(client, grantor_auth_data, existing_opportunity):
    """Test that API key auth works for update"""
    _, _, _, api_key_id = grantor_auth_data

    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "Updated via API Key"},
        headers={"X-API-Key": api_key_id},
    )

    assert resp.status_code == 200
    assert resp.get_json()["data"]["opportunity_title"] == "Updated via API Key"


def test_opportunity_update_401_no_token(client, existing_opportunity):
    """Test that missing auth returns 401"""
    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "No Auth"},
    )

    assert resp.status_code == 401


def test_opportunity_update_401_invalid_token(client, existing_opportunity):
    """Test that invalid token returns 401"""
    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "Bad Token"},
        headers={"X-SGG-Token": "invalid-token"},
    )

    assert resp.status_code == 401


def test_opportunity_update_403_no_permission(
    client, db_session, enable_factory_create, existing_opportunity
):
    """Test that a user without UPDATE_OPPORTUNITY privilege gets 403"""
    _, agency, _, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )

    # Use a different user's token on the existing opportunity
    _, _, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )

    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "No Permission"},
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 403


def test_opportunity_update_404_not_found(client, grantor_auth_data):
    """Test that a non-existent opportunity_id returns 404"""
    _, _, token, _ = grantor_auth_data

    resp = client.put(
        f"/v1/grantors/opportunities/{uuid.uuid4()}",
        json={"opportunity_title": "Does Not Exist"},
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 404


def test_opportunity_update_422_field_too_long(client, grantor_auth_data, existing_opportunity):
    """Test that a field exceeding max length returns 422"""
    _, _, token, _ = grantor_auth_data

    resp = client.put(
        f"/v1/grantors/opportunities/{existing_opportunity.opportunity_id}",
        json={"opportunity_title": "x" * 256},  # max is 255
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422


def test_opportunity_update_422_not_draft(client, grantor_auth_data, enable_factory_create):
    """Test that updating a published (non-draft) opportunity returns 422"""
    _, agency, token, _ = grantor_auth_data
    published_opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code, is_draft=False
    )

    resp = client.put(
        f"/v1/grantors/opportunities/{published_opportunity.opportunity_id}",
        json={"opportunity_title": "Trying to update published"},
        headers={"X-SGG-Token": token},
    )

    assert resp.status_code == 422
