import pytest
import uuid

from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import create_opportunity_request
from tests.src.db.models.factories import AssistanceListingFactory
from src.constants.lookup_constants import (
    Privilege,
    OpportunityCategory,
)


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with CREATE_OPPORTUNITY permission and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.CREATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def assistance_listing(enable_factory_create):
    """Create an assistance_listing record """
    return AssistanceListingFactory.create()


@pytest.fixture
def opportunity_request(grantor_auth_data, assistance_listing):
    """Return a valid opportunity creation request"""
    _, agency, _, _ = grantor_auth_data
    return create_opportunity_request(agency_id=str(agency.agency_id),
                                      assistance_listing_number=str(assistance_listing.assistance_listing_number))


@pytest.fixture
def opportunity_request_no_explanation(grantor_auth_data, assistance_listing):
    """Return a bad opportunity creation request
        where category is 'other' but category explanation is empty
    """
    _, agency, _, _ = grantor_auth_data
    return create_opportunity_request(agency_id=str(agency.agency_id),
                                      category=OpportunityCategory.OTHER,
                                      category_explanation="",
                                      assistance_listing_number=str(assistance_listing.assistance_listing_number))


def test_opportunity_create_successful_creation(client, grantor_auth_data, opportunity_request):
    _, _, token, _ = grantor_auth_data

    # Create an opportunity
    response = client.post(
        "/v1/grantors/opportunities", json=opportunity_request, headers={"X-SGG-Token": token}
    )

    # Success check
    assert response.status_code == 200

    # Check response data
    response_json = response.get_json()
    assert "data" in response_json
    assert "message" in response_json
    assert response_json["message"] == "Success"

    # Verify opportunity data in response
    opportunity_data = response_json["data"]
    assert "opportunity_id" in opportunity_data  # Should have generated UUID
    assert opportunity_data["opportunity_number"] == opportunity_request["opportunity_number"]
    assert opportunity_data["opportunity_title"] == opportunity_request["opportunity_title"]
    assert opportunity_data["category"] == opportunity_request["category"]
    assert opportunity_data["category_explanation"] == opportunity_request["category_explanation"]
    assert opportunity_data["is_draft"] is True
    assert "created_at" in opportunity_data
    assert "updated_at" in opportunity_data
    assert "opportunity_assistance_listings" in opportunity_data
    opportunity_assistance_listings = opportunity_data["opportunity_assistance_listings"][0]
    assert opportunity_assistance_listings["assistance_listing_number"] == opportunity_request["assistance_listing_number"]


def test_opportunity_create_with_invalid_jwt_token(client, grantor_auth_data, opportunity_request):
    """Test opportunity creation endpoint with invalid JWT token"""
    response = client.post(
        "/v1/grantors/opportunities",
        json=opportunity_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_opportunity_create_duplicate_number(client, grantor_auth_data, opportunity_request):
    _, _, token, _ = grantor_auth_data

    # First create an opportunity
    response = client.post(
        "/v1/grantors/opportunities", json=opportunity_request, headers={"X-SGG-Token": token}
    )

    # Try to create another with the same opportunity number
    response = client.post(
        "/v1/grantors/opportunities", json=opportunity_request, headers={"X-SGG-Token": token}
    )

    response_json = response.get_json()

    assert response.status_code == 422
    assert (
        response_json["message"]
        == f"Opportunity with number '{opportunity_request['opportunity_number']}' already exists"
    )


def test_opportunity_create_invalid_data(client, grantor_auth_data):
    _, _, token, _ = grantor_auth_data

    # Missing required fields
    response = client.post(
        "/v1/grantors/opportunities",
        json={
            "opportunity_title": "Test Opportunity"
            # Missing other required fields
        },
        headers={"X-SGG-Token": token},
    )

    response_json = response.get_json()

    assert response.status_code == 422
    assert "errors" in response_json
    assert any(
        "missing data for required field" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )


def test_opportunity_create_no_permissions(client, db_session, enable_factory_create, assistance_listing):
    # Create a user without CREATE_OPPORTUNITY privilege
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],  # No privileges
    )

    opportunity_request = create_opportunity_request(
        agency_id=str(agency.agency_id),
        assistance_listing_number=str(assistance_listing.assistance_listing_number))

    response = client.post(
        "/v1/grantors/opportunities", json=opportunity_request, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_opportunity_create_no_aln(client, grantor_auth_data):
    _, agency, token, _ = grantor_auth_data

    response = client.post(
        "/v1/grantors/opportunities",
        json={
            "agency_id": str(agency.agency_id),
            "opportunity_title": "Test Opportunity",
            "opportunity_number": f"TEST-{uuid.uuid4().hex[:3]}",
            "category": "discretionary",
            # Missing assistance_listing_number
        },
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json
    assert any(
        "missing data for required field" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )
    assert any(
        "assistance_listing_number" in error.get("field", "").lower()
        for error in response_json.get("errors", [])
    )


def test_opportunity_create_category_explanation_error(client, grantor_auth_data, opportunity_request_no_explanation):
    _, _, token, _ = grantor_auth_data

    # Create an opportunity
    response = client.post(
        "/v1/grantors/opportunities", json=opportunity_request_no_explanation, headers={"X-SGG-Token": token}
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json
    assert any(
        "explanation of the category is required when category is 'other'" in error.get(
            "message", "").lower()
        for error in response_json.get("errors", [])
    )
