import uuid
from datetime import date, timedelta

import pytest

from src.constants.lookup_constants import CompetitionOpenToApplicant, Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import OpportunityFactory


def create_competition_request(
    competition_title="Proposal for Advanced Research",
    opening_date=None,
    closing_date=None,
    contact_info="Bob Smith\nFakeMail@fake.com",
    open_to_applicants=None,
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

    return {
        "competition_title": competition_title,
        "opening_date": opening_date,
        "closing_date": closing_date,
        "contact_info": contact_info,
        "open_to_applicants": open_to_applicants,
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
def opportunity_for_competition(grantor_auth_data, enable_factory_create):
    """Create an opportunity in the user's agency"""
    _, agency, _, _ = grantor_auth_data

    # Create opportunity in the same agency as the user
    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id, agency_code=agency.agency_code
    )

    return opportunity


def test_competition_create_successful_creation(
    client, grantor_auth_data, opportunity_for_competition
):
    """Test successful competition creation"""
    _, _, token, _ = grantor_auth_data
    opportunity = opportunity_for_competition

    competition_request = create_competition_request()

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
    assert set(competition_data["open_to_applicants"]) == set(
        competition_request["open_to_applicants"]
    )


def test_competition_create_with_invalid_jwt_token(client, opportunity_for_competition):
    """Test competition creation endpoint with invalid JWT token"""
    opportunity = opportunity_for_competition

    competition_request = create_competition_request()

    response = client.post(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_competition_create_no_permissions(
    client, db_session, enable_factory_create, opportunity_for_competition
):
    """Test competition creation without UPDATE_OPPORTUNITY privilege"""
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )

    # Create opportunity in the same agency
    opportunity = OpportunityFactory.create(agency_id=agency.agency_id)

    competition_request = create_competition_request()

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
    competition_request = create_competition_request()

    response = client.post(
        f"/v1/grantors/opportunities/{fake_opportunity_id}/competitions",
        json=competition_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == f"Could not find Opportunity with ID {fake_opportunity_id}"


def test_competition_create_missing_required_fields(
    client, grantor_auth_data, opportunity_for_competition
):
    """Test competition creation with missing required fields"""
    _, _, token, _ = grantor_auth_data
    opportunity = opportunity_for_competition

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
    client, grantor_auth_data, opportunity_for_competition
):
    """Test competition creation with invalid data types"""
    _, _, token, _ = grantor_auth_data
    opportunity = opportunity_for_competition

    competition_request = create_competition_request()

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
    client, grantor_auth_data, opportunity_for_competition
):
    """Test competition creation with empty open_to_applicants list"""
    _, _, token, _ = grantor_auth_data
    opportunity = opportunity_for_competition

    competition_request = create_competition_request(
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
