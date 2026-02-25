import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.opportunity_test_utils import (
    build_opportunity_list_request_body,
    create_test_opportunities,
    create_user_in_agency_with_jwt_and_api_key,
)
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):

    agency = AgencyFactory.create()

    """Create a user with VIEW_OPPORTUNITY permission and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity(db_session, enable_factory_create, grantor_auth_data):
    """Create a test opportunity"""
    user, agency, _, _ = grantor_auth_data
    opportunity = OpportunityFactory.create(agency_record=agency)
    return opportunity


@pytest.fixture
def test_opportunities(db_session, enable_factory_create, grantor_auth_data):
    """Create test opportunities for the agency in grantor_auth_data."""
    user, agency, token, _ = grantor_auth_data
    return create_test_opportunities(db_session, agency)


def test_get_opportunity_success(client, db_session, grantor_auth_data, enable_factory_create):
    """Test successful opportunity retrieval with JWT"""
    user, agency, token, _ = grantor_auth_data

    # Create a test opportunity with the correct agency
    test_opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number="TEST-2026-123",
        opportunity_title="Test Opportunity for GET",
    )

    test_opportunity.agency_record = agency

    response = client.get(
        f"/v1/grantors/opportunities/{test_opportunity.opportunity_id}/grantor",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    response_data = response_json["data"]

    assert response_data["opportunity_id"] == str(test_opportunity.opportunity_id)
    assert response_data["opportunity_number"] == test_opportunity.opportunity_number
    assert response_data["opportunity_title"] == test_opportunity.opportunity_title
    assert response_data["agency_code"] == test_opportunity.agency_code
    assert response_data["category"] == test_opportunity.category.value


def test_get_opportunity_with_invalid_jwt_token(client, opportunity):
    """Test opportunity retrieval with invalid JWT token"""
    response = client.get(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/grantor",
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_get_opportunity_list_success(client, grantor_auth_data, test_opportunities):
    """Test successful opportunity list retrieval with JWT"""
    user, agency, token, _ = grantor_auth_data

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    # Verify response
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    # Verify pagination info
    assert "pagination_info" in response_json
    pagination = response_json["pagination_info"]
    assert pagination["total_records"] >= len(test_opportunities)
    assert pagination["page_offset"] == 1
    assert pagination["page_size"] == 25

    # Verify opportunity data fields
    returned_opportunities = response_json["data"]
    for opp in returned_opportunities:
        assert "opportunity_id" in opp
        assert "opportunity_number" in opp
        assert "opportunity_title" in opp
        assert "agency_code" in opp
        assert "category" in opp

    # Verify all created opportunities are in the response
    returned_ids = {opp["opportunity_id"] for opp in returned_opportunities}
    created_ids = {str(opp.opportunity_id) for opp in test_opportunities}
    assert returned_ids.issuperset(created_ids)


def test_get_opportunity_list_with_invalid_jwt_token(client, db_session, enable_factory_create):
    """Test opportunity list retrieval with invalid JWT token"""
    agency = AgencyFactory.create()

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": "invalid_token_value"},
        json=request_json,
    )

    assert response.status_code == 401


def test_get_opportunity_list_no_permission(client, db_session, enable_factory_create):
    """Test that user without VIEW_OPPORTUNITY privilege gets 403"""
    # Create user without VIEW_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],  # No privileges
    )

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert "forbidden" in str(response_json).lower()
