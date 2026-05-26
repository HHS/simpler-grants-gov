import uuid
from datetime import date, timedelta

import pytest

from src.constants.lookup_constants import CompetitionOpenToApplicant, Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import (
    AssistanceListingFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)


def create_competition_request(
    assistance_listing_number,
    competition_title="Proposal for Advanced Research",
    opening_date=None,
    closing_date=None,
    contact_info="Bob Smith\nFakeMail@fake.com",
    is_simpler_grants_enabled=True,
    open_to_applicants=None,
    competition_instructions=None,
    program_title="Space Technology",
):
    """Create a valid competition creation request"""
    if opening_date is None:
        opening_date = date.today().isoformat()

    if closing_date is None:
        closing_date = (date.today() + timedelta(days=30)).isoformat()

    if open_to_applicants is None:
        open_to_applicants = [
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ]

    if competition_instructions is None:
        competition_instructions = [
            {
                "file_name": "competition_instructions.pdf",
                "download_path": "s3://simpler-grants-gov-dev/competition-instructions/file.pdf",
            }
        ]

    return {
        "competition_title": competition_title,
        "opening_date": opening_date,
        "closing_date": closing_date,
        "contact_info": contact_info,
        "is_simpler_grants_enabled": is_simpler_grants_enabled,
        "open_to_applicants": open_to_applicants,
        "competition_instructions": competition_instructions,
        "opportunity_assistance_listing": {
            "assistance_listing_number": assistance_listing_number,
            "program_title": program_title,
        },
    }


@pytest.fixture
def grantor_auth_data(db_session, enable_factory_create):
    """Create a user with VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY permissions and return auth data"""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity_with_assistance_listing(grantor_auth_data, enable_factory_create):
    """Create an opportunity with an associated assistance listing"""
    _, agency, _, _ = grantor_auth_data

    # Create assistance listing
    assistance_listing = AssistanceListingFactory.create()

    # Create opportunity in the same agency as the user
    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id, agency_code=agency.agency_code
    )

    # Link opportunity to assistance listing
    opp_assistance_listing = OpportunityAssistanceListingFactory.create(
        opportunity=opportunity,
        assistance_listing_id=assistance_listing.assistance_listing_id,
        assistance_listing_number="43.012",
        program_title=assistance_listing.program_title,
    )

    return opportunity, opp_assistance_listing


def test_competition_create_successful_creation(
    client, grantor_auth_data, opportunity_with_assistance_listing
):
    """Test successful competition creation"""
    _, _, token, _ = grantor_auth_data
    opportunity, opp_assistance_listing = opportunity_with_assistance_listing

    competition_request = create_competition_request(
        assistance_listing_number=opp_assistance_listing.assistance_listing_number,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    # Verify response data structure
    competition_data = response_json["data"]
    assert competition_data["opportunity_id"] == str(opportunity.opportunity_id)
    assert competition_data["competition_title"] == competition_request["competition_title"]
    assert competition_data["opening_date"] == competition_request["opening_date"]
    assert competition_data["closing_date"] == competition_request["closing_date"]
    assert competition_data["contact_info"] == competition_request["contact_info"]
    assert (
        competition_data["is_simpler_grants_enabled"]
        == competition_request["is_simpler_grants_enabled"]
    )
    assert set(competition_data["open_to_applicants"]) == set(
        competition_request["open_to_applicants"]
    )
    assert len(competition_data["competition_instructions"]) == 1
    assert (
        competition_data["competition_instructions"][0]["file_name"]
        == "competition_instructions.pdf"
    )
    assert (
        competition_data["opportunity_assistance_listing"]["assistance_listing_number"] == "43.012"
    )


def test_competition_create_with_invalid_jwt_token(client, opportunity_with_assistance_listing):
    """Test competition creation endpoint with invalid JWT token"""
    opportunity, opp_assistance_listing = opportunity_with_assistance_listing

    competition_request = create_competition_request(
        assistance_listing_number=opp_assistance_listing.assistance_listing_number,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_competition_create_no_permissions(
    client, db_session, enable_factory_create, opportunity_with_assistance_listing
):
    """Test competition creation without UPDATE_OPPORTUNITY privilege"""
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )

    # Create opportunity in the same agency
    opportunity = OpportunityFactory.create(agency_id=agency.agency_id)
    assistance_listing = AssistanceListingFactory.create()
    opp_assistance_listing = OpportunityAssistanceListingFactory.create(
        opportunity_id=opportunity.opportunity_id,
        assistance_listing_id=assistance_listing.assistance_listing_id,
        assistance_listing_number=assistance_listing.assistance_listing_number,
        program_title=assistance_listing.program_title,
    )

    competition_request = create_competition_request(
        assistance_listing_number=opp_assistance_listing.assistance_listing_number,
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_competition_create_opportunity_not_found(client, grantor_auth_data):
    """Test competition creation with non-existent opportunity"""
    _, _, token, _ = grantor_auth_data

    fake_opportunity_id = uuid.uuid4()
    competition_request = create_competition_request(
        assistance_listing_number="43.012",
    )

    response = client.post(
        f"/v1/grantors/opportunities/{fake_opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == f"Could not find Opportunity with ID {fake_opportunity_id}"


def test_competition_create_assistance_listing_not_found(
    client, grantor_auth_data, opportunity_with_assistance_listing
):
    """Test competition creation with non-existent assistance listing"""
    _, _, token, _ = grantor_auth_data
    opportunity, _ = opportunity_with_assistance_listing

    competition_request = create_competition_request(
        assistance_listing_number="99.ZZZ",
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == "Assistance listing 99.ZZZ not found on opportunity"


def test_competition_create_missing_required_fields(
    client, grantor_auth_data, opportunity_with_assistance_listing
):
    """Test competition creation with missing required fields"""
    _, _, token, _ = grantor_auth_data
    opportunity, _ = opportunity_with_assistance_listing

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json={
            "competition_title": "Test Competition"
            # Missing other required fields
        },
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert response_json["message"] == "Validation error"
    assert any(
        "missing data for required field" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )


def test_competition_create_invalid_data_types(
    client, grantor_auth_data, opportunity_with_assistance_listing
):
    """Test competition creation with invalid data types"""
    _, _, token, _ = grantor_auth_data
    opportunity, opp_assistance_listing = opportunity_with_assistance_listing

    competition_request = create_competition_request(
        assistance_listing_number=opp_assistance_listing.assistance_listing_number,
    )

    # Invalid date format
    competition_request["opening_date"] = "not-a-date"

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert any(
        "not a valid" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )


def test_competition_create_empty_open_to_applicants(
    client, grantor_auth_data, opportunity_with_assistance_listing
):
    """Test competition creation with empty open_to_applicants list"""
    _, _, token, _ = grantor_auth_data
    opportunity, opp_assistance_listing = opportunity_with_assistance_listing

    competition_request = create_competition_request(
        assistance_listing_number=opp_assistance_listing.assistance_listing_number,
        open_to_applicants=[],
    )

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert any(
        "shorter than minimum length 1" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )
