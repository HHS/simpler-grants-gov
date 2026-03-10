import uuid
from datetime import date

import pytest

from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    Privilege,
)
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import create_opportunity_summary_request
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory


@pytest.fixture
def opportunity_summary_request():
    """Return a valid opportunity summary creation request"""
    return create_opportunity_summary_request()


@pytest.fixture
def opportunity_summary_auth_data(db_session, enable_factory_create):
    """Create a user with VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY permissions and return auth data"""
    agency = AgencyFactory.create()

    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity(
    db_session,
    enable_factory_create,
    opportunity_summary_auth_data,
    opportunity_number="TEST-2026-123",
    opportunity_title="Test Opportunity for GET",
):
    """Create a test opportunity"""
    user, agency, _, _ = opportunity_summary_auth_data

    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        opportunity_number=opportunity_number,
        opportunity_title=opportunity_title,
    )

    opportunity.agency_record = agency
    return opportunity


@pytest.fixture
def test_opportunities(db_session, enable_factory_create, opportunity_summary_auth_data):
    """Create test opportunities for the agency in opportunity_summary_auth_data."""
    user, agency, token, _ = opportunity_summary_auth_data

    opportunities = OpportunityFactory.create_batch(
        size=3,
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
    )

    return opportunities


def test_opportunity_summary_create_with_invalid_jwt_token(
    client, opportunity, opportunity_summary_request
):
    """Test opportunity summary creation endpoint with invalid JWT token"""
    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_opportunity_summary_create_missing_permissions(
    client, db_session, enable_factory_create, opportunity_summary_request
):
    """Test opportunity summary creation with a user that has VIEW_OPPORTUNITY but not UPDATE_OPPORTUNITY privilege"""
    # Create a user with VIEW_OPPORTUNITY but without UPDATE_OPPORTUNITY privilege
    agency = AgencyFactory.create()
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
        agency=agency,
    )

    opportunity = OpportunityFactory.create(agency_record=agency)

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert "forbidden" in str(response_json).lower()


def test_opportunity_summary_create_opportunity_not_found(
    client, opportunity_summary_auth_data, opportunity_summary_request
):
    """Test creating a summary for a non-existent opportunity"""
    _, _, token, _ = opportunity_summary_auth_data

    non_existent_id = uuid.uuid4()

    response = client.post(
        f"/v1/grantors/opportunities/{non_existent_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert "could not find opportunity" in str(response_json).lower()


def test_opportunity_summary_create_invalid_date_validation(
    client, opportunity, opportunity_summary_auth_data
):
    """Test validation error when post_date is after close_date"""
    _, _, token, _ = opportunity_summary_auth_data

    # Use Invalid Dates
    invalid_dates_request = create_opportunity_summary_request(
        post_date=date(3000, 12, 31), close_date=date.today()
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=invalid_dates_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json
    assert (
        response_json["errors"][0]["message"]
        == "Post date must be less than or equal to close date"
    )


def test_opportunity_summary_create_invalid_award_amount(
    client, opportunity, opportunity_summary_auth_data
):
    """Test validation error when award_floor is greater than award_ceiling"""
    _, _, token, _ = opportunity_summary_auth_data

    # Create a request with invalid award amounts (floor > ceiling)
    invalid_award_request = create_opportunity_summary_request(
        award_floor=100000, award_ceiling=50000
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=invalid_award_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json
    assert (
        response_json["errors"][0]["message"]
        == "Award floor must be less than or equal to award ceiling"
    )


def test_opportunity_summary_create_successful(
    client, opportunity, opportunity_summary_auth_data, opportunity_summary_request
):
    """Test successful creation of an opportunity summary"""
    _, _, token, _ = opportunity_summary_auth_data

    opportunity_summary_request["is_forecast"] = True

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )

    # Success check
    assert response.status_code == 200

    # Check response data
    response_json = response.get_json()
    assert "data" in response_json
    assert "message" in response_json
    assert response_json["message"] == "Success"

    # Verify the opportunity summary data
    summary_data = response_json["data"]
    assert summary_data["summary_description"] == opportunity_summary_request["summary_description"]
    assert summary_data["is_forecast"] == opportunity_summary_request["is_forecast"]
    assert summary_data["is_cost_sharing"] == opportunity_summary_request["is_cost_sharing"]
    assert (
        summary_data["expected_number_of_awards"]
        == opportunity_summary_request["expected_number_of_awards"]
    )
    assert (
        summary_data["estimated_total_program_funding"]
        == opportunity_summary_request["estimated_total_program_funding"]
    )
    assert summary_data["award_floor"] == opportunity_summary_request["award_floor"]
    assert summary_data["award_ceiling"] == opportunity_summary_request["award_ceiling"]

    # Verify the funding instruments, categories, and applicant types
    assert len(summary_data["funding_instruments"]) == 2
    assert FundingInstrument.GRANT in summary_data["funding_instruments"]
    assert FundingInstrument.COOPERATIVE_AGREEMENT in summary_data["funding_instruments"]

    assert len(summary_data["funding_categories"]) == 1
    assert FundingCategory.AGRICULTURE in summary_data["funding_categories"]

    assert len(summary_data["applicant_types"]) == 1
    assert ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS in summary_data["applicant_types"]


def test_opportunity_summary_create_duplicate_summary(
    client, db_session, opportunity, opportunity_summary_auth_data, opportunity_summary_request
):
    """Test that creating a duplicate opportunity summary of the same type returns a 422 error"""
    _, _, token, _ = opportunity_summary_auth_data

    # First create a summary of forecast type
    opportunity_summary_request["is_forecast"] = True

    first_response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )
    assert first_response.status_code == 200

    # Second request with the same forecast type should fail with 422
    second_response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )

    # Verify the error response
    assert second_response.status_code == 422
    response_json = second_response.get_json()
    assert "forecast already exists" in str(response_json).lower()


def test_opportunity_summary_create_schema_validation(
    client, db_session, opportunity, opportunity_summary_auth_data
):
    """Test schema validation for opportunity summary creation"""
    _, _, token, _ = opportunity_summary_auth_data

    # Create request with invalid field values
    invalid_request = {
        "is_forecast": True,
        "summary_description": "a" * 20000,  # Exceeds max length of 18000
        "is_cost_sharing": True,
        "post_date": "2026-03-10",
        "close_date": "2027-03-10",
        "estimated_total_program_funding": -1000000,  # Negative value
        "award_floor": -1000000,  # Negative value
        "award_ceiling": -500000,  # Negative value
        "expected_number_of_awards": -5,  # Negative value
        "additional_info_url": "https://example.com" * 250,  # Exceeds max length of 250
        "additional_info_url_description": "https://example.com" * 250,  # Exceeds max length of 250
        "funding_category_description": "a" * 2501,  # Exceeds max length of 2500
        "applicant_eligibility_description": "a" * 4001,  # Exceeds max length of 4000
        "agency_contact_description": "a" * 1500,  # Exceeds max length of 1000
        "agency_email_address": "contact@agency.gov" * 100,  # Exceeds max length of 130
        "agency_email_address_description": "Email the agency" * 100,  # Exceeds max length of 108
        "funding_instruments": [],  # Empty list
        "funding_categories": [],  # Empty list
        "applicant_types": [],  # Empty list
    }

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary",
        json=invalid_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json

    # Expected fields with validation errors
    expected_error_fields = [
        "summary_description",
        "estimated_total_program_funding",
        "award_floor",
        "award_ceiling",
        "expected_number_of_awards",
        "additional_info_url",
        "additional_info_url_description",
        "funding_category_description",
        "applicant_eligibility_description",
        "agency_contact_description",
        "agency_email_address",
        "agency_email_address_description",
        "funding_instruments",
        "funding_categories",
        "applicant_types",
    ]

    # Collect fields with errors
    erroring_fields = []
    for err in response_json["errors"]:
        field = err["field"]
        erroring_fields.append(field)
        assert field in expected_error_fields

    assert len(erroring_fields) == len(expected_error_fields)
