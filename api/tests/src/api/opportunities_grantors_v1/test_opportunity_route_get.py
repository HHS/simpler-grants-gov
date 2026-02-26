import uuid

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import build_opportunity_list_request_body
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
def opportunity(
    db_session,
    enable_factory_create,
    grantor_auth_data,
    opportunity_number="TEST-2026-123",
    opportunity_title="Test Opportunity for GET",
):
    """Create a test opportunity"""
    user, agency, _, _ = grantor_auth_data

    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number=opportunity_number,
        opportunity_title=opportunity_title,
    )

    opportunity.agency_record = agency
    return opportunity


@pytest.fixture
def test_opportunities(db_session, enable_factory_create, grantor_auth_data):
    """Create test opportunities for the agency in grantor_auth_data."""
    user, agency, token, _ = grantor_auth_data

    opportunities = OpportunityFactory.create_batch(
        size=3,
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    return opportunities


def test_get_opportunity_success(client, db_session, grantor_auth_data, opportunity):
    """Test successful opportunity retrieval with JWT"""
    user, agency, token, _ = grantor_auth_data

    response = client.get(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    response_data = response_json["data"]

    assert response_data["opportunity_id"] == str(opportunity.opportunity_id)
    assert response_data["opportunity_number"] == opportunity.opportunity_number
    assert response_data["opportunity_title"] == opportunity.opportunity_title
    assert response_data["agency_code"] == opportunity.agency_code
    assert response_data["category"] == opportunity.category.value


def test_get_opportunity_with_invalid_jwt_token(client, opportunity):
    """Test 401 response for opportunity retrieval with invalid JWT token"""
    response = client.get(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_get_opportunity_no_permission(client, db_session, enable_factory_create):
    """Test 403 response for a user without VIEW_OPPORTUNITY privilege"""
    # Create user without VIEW_OPPORTUNITY privilege
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],  # No privileges
    )

    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    response = client.get(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_get_opportunity_not_found(client, grantor_auth_data):
    """Test 404 response when opportunity doesn't exist"""
    user, agency, token, _ = grantor_auth_data
    opportunity_id = uuid.uuid4()
    response = client.get(
        f"/v1/grantors/opportunities/{opportunity_id}",
        headers={"X-SGG-Token": token},
    )
    assert response.status_code == 404
    assert response.get_json()["message"] == f"Could not find Opportunity with ID {opportunity_id}"


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
    """Test 401 response for opportunity list retrieval with invalid JWT token"""
    agency = AgencyFactory.create()

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": "invalid_token_value"},
        json=request_json,
    )

    assert response.status_code == 401


def test_get_opportunity_list_no_permission(client, db_session, enable_factory_create):
    """Test 403 response for a user without VIEW_OPPORTUNITY privilege"""
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
    assert response_json["message"] == "Forbidden"


def test_get_opportunity_list_agency_not_found(client, grantor_auth_data):
    """Test 404 response when agency doesn't exist"""
    user, agency, token, _ = grantor_auth_data

    # Generate a random UUID that doesn't correspond to any agency
    nonexistent_agency_id = uuid.uuid4()

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{nonexistent_agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    assert response.status_code == 404
    assert (
        response.get_json()["message"] == f"Could not find Agency with ID {nonexistent_agency_id}"
    )


def test_get_opportunity_list_with_other_agency_data(
    client, db_session, grantor_auth_data, test_opportunities
):
    """Test that opportunities from other agencies are not included in results"""
    user, agency, token, _ = grantor_auth_data

    # Create opportunities for another agency
    other_agency = AgencyFactory.create()
    other_agency_opportunities = OpportunityFactory.create_batch(
        size=3,
        agency_id=other_agency.agency_id,
        agency_code=other_agency.agency_code,
    )

    request_json = build_opportunity_list_request_body()
    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    assert response.status_code == 200
    response_json = response.get_json()

    # Verify other agency opportunities are not included
    returned_ids = {opp["opportunity_id"] for opp in response_json["data"]}
    other_agency_ids = {str(opp.opportunity_id) for opp in other_agency_opportunities}

    # Assert that none of the other agency's opportunities are in the results
    assert not returned_ids.intersection(other_agency_ids)


def test_get_opportunity_list_sort_by_created_at_descending(client, db_session, grantor_auth_data):
    """Test sorting opportunities by created_at in descending order (newest first)"""
    user, agency, token, _ = grantor_auth_data

    # Create opportunities with different creation times
    opportunities = []
    for _ in range(3):
        opp = OpportunityFactory.create(
            agency_id=agency.agency_id,
            agency_code=agency.agency_code,
        )
        opportunities.append(opp)

    request_json = build_opportunity_list_request_body()

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    # Verify response
    assert response.status_code == 200
    response_json = response.get_json()

    # Check that the default sort is by created_at descending
    returned_ids = [opp["opportunity_id"] for opp in response_json["data"]]
    created_ids = [str(opp.opportunity_id) for opp in reversed(opportunities)]

    # Check that the ordering matches (newest first)
    assert returned_ids == created_ids


def test_get_opportunity_list_pagination(client, db_session, grantor_auth_data):
    """Test pagination of opportunity list"""
    user, agency, token, _ = grantor_auth_data

    # Create 10 opportunities
    _ = OpportunityFactory.create_batch(
        size=10,
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    # Request first page with 3 items per page
    request_json = build_opportunity_list_request_body(page_size=3, page_offset=1)

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    # Verify first page
    assert response.status_code == 200
    response_json = response.get_json()
    assert len(response_json["data"]) == 3
    assert response_json["pagination_info"]["page_size"] == 3
    assert response_json["pagination_info"]["page_offset"] == 1

    # Get IDs from first page
    first_page_ids = {opp["opportunity_id"] for opp in response_json["data"]}

    # Request second page
    request_json["pagination"]["page_offset"] = 2

    response = client.post(
        f"/v1/grantors/agencies/{agency.agency_id}/opportunities",
        headers={"X-SGG-Token": token},
        json=request_json,
    )

    # Verify second page
    assert response.status_code == 200
    response_json = response.get_json()
    assert len(response_json["data"]) == 3
    assert response_json["pagination_info"]["page_size"] == 3
    assert response_json["pagination_info"]["page_offset"] == 2

    # Get IDs from second page
    second_page_ids = {opp["opportunity_id"] for opp in response_json["data"]}

    # Verify first and second pages have different opportunities
    assert not first_page_ids.intersection(second_page_ids)
