import uuid
from datetime import date

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import create_opportunity_summary_update_request
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)


@pytest.fixture
def opportunity_summary_update_request():
    """Return a valid opportunity summary update request"""
    return create_opportunity_summary_update_request()


@pytest.fixture
def opportunity_summary_auth_data(db_session, enable_factory_create):
    """Create a user with VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY permissions and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity_with_summary(
    db_session,
    enable_factory_create,
    opportunity_summary_auth_data,
):
    """Create a test opportunity with a summary"""
    user, agency, _, _ = opportunity_summary_auth_data

    # Create opportunity with no current summary
    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        is_simpler_grants_opportunity=True,
        is_draft=True,
        no_current_summary=True,
    )

    # Create a non-forecast summary
    non_forecast_summary = OpportunitySummaryFactory.create(
        opportunity=opportunity,
        is_forecast=False,
    )

    opportunity.agency_record = agency
    return opportunity, non_forecast_summary


def test_opportunity_summary_update_with_invalid_jwt_token(
    client, opportunity_with_summary, opportunity_summary_update_request
):
    """Test opportunity summary update endpoint with invalid JWT token"""
    opportunity, summary = opportunity_with_summary

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
        json=opportunity_summary_update_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_opportunity_summary_update_missing_permissions(
    client, db_session, enable_factory_create, opportunity_summary_update_request
):
    """Test opportunity summary update with a user that has VIEW_OPPORTUNITY but not UPDATE_OPPORTUNITY privilege"""
    # Create a user with VIEW_OPPORTUNITY but without UPDATE_OPPORTUNITY privilege
    agency = AgencyFactory.create()
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY],
        agency=agency,
    )

    # Create an opportunity with a summary
    opportunity = OpportunityFactory.create(
        agency_record=agency,
        is_simpler_grants_opportunity=True,
        is_draft=True,
        no_current_summary=True,
    )

    # Create a summary for the opportunity
    summary = OpportunitySummaryFactory.create(
        opportunity=opportunity,
        is_forecast=False,
    )

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
        json=opportunity_summary_update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_opportunity_summary_update_opportunity_not_found(
    client, opportunity_summary_auth_data, opportunity_summary_update_request
):
    """Test updating a summary for a non-existent opportunity"""
    _, _, token, _ = opportunity_summary_auth_data

    non_existent_opportunity_id = uuid.uuid4()
    non_existent_summary_id = uuid.uuid4()

    response = client.put(
        f"/v1/grantors/opportunities/{non_existent_opportunity_id}/summary/{non_existent_summary_id}",
        json=opportunity_summary_update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity with ID {non_existent_opportunity_id}"
    )


def test_opportunity_summary_update_summary_not_found(
    client,
    db_session,
    enable_factory_create,
    opportunity_summary_auth_data,
    opportunity_summary_update_request,
):
    """Test updating a non-existent summary for an existing opportunity"""
    user, agency, token, _ = opportunity_summary_auth_data

    # Create an opportunity without a summary
    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        is_simpler_grants_opportunity=True,
        is_draft=True,
        no_current_summary=True,
    )

    opportunity.agency_record = agency

    # Generate a non-existent summary ID
    non_existent_summary_id = uuid.uuid4()

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{non_existent_summary_id}",
        json=opportunity_summary_update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert (
        response_json["message"]
        == f"Could not find Opportunity Summary with ID {non_existent_summary_id}"
    )


def test_opportunity_summary_update_invalid_date_validation(
    client, opportunity_with_summary, opportunity_summary_auth_data
):
    """Test validation error when post_date is after close_date in update request"""
    opportunity, summary = opportunity_with_summary
    _, _, token, _ = opportunity_summary_auth_data

    # Use Invalid Dates
    invalid_dates_request = create_opportunity_summary_update_request(
        post_date=date(3000, 12, 31), close_date=date.today()
    )

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
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


def test_opportunity_summary_update_invalid_award_amount(
    client, opportunity_with_summary, opportunity_summary_auth_data
):
    """Test validation error when award_floor is greater than award_ceiling in update request"""
    opportunity, summary = opportunity_with_summary
    _, _, token, _ = opportunity_summary_auth_data

    # Create a request with invalid award amounts (floor > ceiling)
    invalid_award_request = create_opportunity_summary_update_request(
        award_floor=100000, award_ceiling=50000
    )

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
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


def test_opportunity_summary_update_successful(
    client,
    opportunity_with_summary,
    opportunity_summary_auth_data,
    opportunity_summary_update_request,
):
    """Test successful update of an opportunity summary"""
    opportunity, summary = opportunity_with_summary
    _, _, token, _ = opportunity_summary_auth_data

    # Modify the request to have clearly different values
    opportunity_summary_update_request["summary_description"] = (
        "UPDATED: This is a modified description"
    )
    opportunity_summary_update_request["award_floor"] = 30000
    opportunity_summary_update_request["award_ceiling"] = 180000

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
        json=opportunity_summary_update_request,
        headers={"X-SGG-Token": token},
    )

    # Success check
    assert response.status_code == 200

    # Check response data
    response_json = response.get_json()
    assert "data" in response_json
    assert "message" in response_json
    assert response_json["message"] == "Success"

    # Verify the opportunity summary data was updated
    summary_data = response_json["data"]
    assert (
        summary_data["summary_description"]
        == opportunity_summary_update_request["summary_description"]
    )
    assert summary_data["is_cost_sharing"] == opportunity_summary_update_request["is_cost_sharing"]
    assert (
        summary_data["expected_number_of_awards"]
        == opportunity_summary_update_request["expected_number_of_awards"]
    )
    assert (
        summary_data["estimated_total_program_funding"]
        == opportunity_summary_update_request["estimated_total_program_funding"]
    )
    assert summary_data["award_floor"] == opportunity_summary_update_request["award_floor"]
    assert summary_data["award_ceiling"] == opportunity_summary_update_request["award_ceiling"]

    # Verify the funding instruments, categories, and applicant types
    assert len(summary_data["funding_instruments"]) == len(
        opportunity_summary_update_request["funding_instruments"]
    )
    for instrument in opportunity_summary_update_request["funding_instruments"]:
        assert instrument in summary_data["funding_instruments"]

    assert len(summary_data["funding_categories"]) == len(
        opportunity_summary_update_request["funding_categories"]
    )
    for category in opportunity_summary_update_request["funding_categories"]:
        assert category in summary_data["funding_categories"]

    assert len(summary_data["applicant_types"]) == len(
        opportunity_summary_update_request["applicant_types"]
    )
    for applicant_type in opportunity_summary_update_request["applicant_types"]:
        assert applicant_type in summary_data["applicant_types"]


def test_opportunity_summary_update_schema_validation(
    client, opportunity_with_summary, opportunity_summary_auth_data
):
    """Test schema validation for opportunity summary update"""
    opportunity, summary = opportunity_with_summary
    _, _, token, _ = opportunity_summary_auth_data

    # Create request with invalid field values
    invalid_request = {
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
        "forecasted_close_date_description": "Optional details regarding the forecasted closed date."
        * 250,  # Exceeds max length of 250
        "fiscal_year": 2101,  # Outside the range of 1900 - 2100
        "funding_category_description": "a" * 2501,  # Exceeds max length of 2500
        "applicant_eligibility_description": "a" * 4001,  # Exceeds max length of 4000
        "agency_contact_description": "a" * 1500,  # Exceeds max length of 1000
        "agency_email_address": "contact@agency.gov" * 100,  # Exceeds max length of 130
        "agency_email_address_description": "Email the agency" * 100,  # Exceeds max length of 108
        "funding_instruments": [],  # Empty list
        "funding_categories": [],  # Empty list
    }

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/summary/{summary.opportunity_summary_id}",
        json=invalid_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "errors" in response_json

    # Fields that should have validation errors
    expected_error_fields = [
        "summary_description",
        "estimated_total_program_funding",
        "award_floor",
        "award_ceiling",
        "expected_number_of_awards",
        "additional_info_url",
        "additional_info_url_description",
        "forecasted_close_date_description",
        "fiscal_year",
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
