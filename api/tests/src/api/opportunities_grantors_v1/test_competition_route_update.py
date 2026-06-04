import uuid
from datetime import date, timedelta

import pytest

from src.constants.lookup_constants import CompetitionOpenToApplicant, Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory


def create_competition_update_request(
    competition_title="Updated Proposal for Advanced Research",
    closing_date=None,
    contact_info="Jane Doe\nUpdatedEmail@updated.com",
    open_to_applicants=None,
):
    """Create a valid competition update request"""
    if closing_date is None:
        closing_date = (date.today() + timedelta(days=60)).isoformat()

    if open_to_applicants is None:
        open_to_applicants = [
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ]

    return {
        "competition_title": competition_title,
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
def existing_competition(grantor_auth_data, enable_factory_create):
    """Create an opportunity and competition in the user's agency"""
    _, agency, _, _ = grantor_auth_data

    opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id, agency_code=agency.agency_code
    )

    competition = CompetitionFactory.create(
        opportunity=opportunity,
        competition_title="Original Competition Title",
        opening_date=date.today(),
        closing_date=date.today() + timedelta(days=30),
        contact_info="Original Contact\noriginal@example.com",
        open_to_applicants={CompetitionOpenToApplicant.INDIVIDUAL},
    )

    return opportunity, competition


def test_competition_update_successful(client, grantor_auth_data, existing_competition):
    """Test successful competition update"""
    _, _, token, _ = grantor_auth_data
    opportunity, competition = existing_competition

    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json["message"] == "Success"

    # Verify updated fields
    competition_data = response_json["data"]
    assert competition_data["competition_title"] == update_request["competition_title"]
    assert competition_data["closing_date"] == update_request["closing_date"]
    assert competition_data["contact_info"] == update_request["contact_info"]
    assert set(competition_data["open_to_applicants"]) == set(update_request["open_to_applicants"])

    # Verify preserved fields
    assert competition_data["competition_id"] == str(competition.competition_id)
    assert competition_data["opportunity_id"] == str(opportunity.opportunity_id)
    assert competition_data["opening_date"] is not None
    assert competition_data["opportunity_assistance_listing"] is not None


def test_competition_update_with_invalid_jwt_token(client, existing_competition):
    """Test competition update with invalid JWT token"""
    opportunity, competition = existing_competition
    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401


def test_competition_update_no_permissions(
    client, db_session, enable_factory_create, existing_competition
):
    """Test competition update without UPDATE_OPPORTUNITY privilege"""
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[],
    )

    opportunity, competition = existing_competition
    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_competition_update_opportunity_not_found(client, grantor_auth_data, existing_competition):
    """Test competition update with non-existent opportunity"""
    _, _, token, _ = grantor_auth_data
    _, competition = existing_competition

    fake_opportunity_id = uuid.uuid4()
    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{fake_opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == f"Could not find Opportunity with ID {fake_opportunity_id}"


def test_competition_update_competition_not_found(client, grantor_auth_data, existing_competition):
    """Test competition update with non-existent competition"""
    _, _, token, _ = grantor_auth_data
    opportunity, _ = existing_competition

    fake_competition_id = uuid.uuid4()
    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{fake_competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert response_json["message"] == f"Competition {fake_competition_id} not found"


def test_competition_update_competition_wrong_opportunity(
    client, grantor_auth_data, enable_factory_create, existing_competition
):
    """Test competition update when competition doesn't belong to the specified opportunity"""
    _, agency, token, _ = grantor_auth_data
    _, competition = existing_competition

    # Create a different opportunity in the same agency
    different_opportunity = OpportunityFactory.create(
        agency_id=agency.agency_id, agency_code=agency.agency_code
    )

    update_request = create_competition_update_request()

    response = client.put(
        f"/v1/grantors/opportunities/{different_opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404
    response_json = response.get_json()
    assert (
        response_json["message"]
        == f"Competition {competition.competition_id} not found for opportunity {different_opportunity.opportunity_id}"
    )


def test_competition_update_missing_required_fields(
    client, grantor_auth_data, existing_competition
):
    """Test competition update with missing required fields"""
    _, _, token, _ = grantor_auth_data
    opportunity, competition = existing_competition

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json={
            "competition_title": "Only Title Provided"
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


def test_competition_update_empty_open_to_applicants(
    client, grantor_auth_data, existing_competition
):
    """Test competition update with empty open_to_applicants list"""
    _, _, token, _ = grantor_auth_data
    opportunity, competition = existing_competition

    update_request = create_competition_update_request(open_to_applicants=[])

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert any(
        "shorter than minimum length 1" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )


def test_competition_update_invalid_data_types(client, grantor_auth_data, existing_competition):
    """Test competition update with invalid data types"""
    _, _, token, _ = grantor_auth_data
    opportunity, competition = existing_competition

    update_request = create_competition_update_request()
    update_request["closing_date"] = "not-a-valid-date"

    response = client.put(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/competitions/{competition.competition_id}",
        json=update_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert any(
        "not a valid" in error.get("message", "").lower()
        for error in response_json.get("errors", [])
    )
