import uuid
from datetime import date, timedelta

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import (
    create_opportunity_summary_request,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityFactory,
)


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


def test_opportunity_summary_create_successful(
    client, db_session, opportunity, opportunity_summary_auth_data
):
    """Test successful creation of an opportunity summary"""
    _, _, token, _ = opportunity_summary_auth_data

    today = date.today()
    post_date = today + timedelta(days=1)  # Tomorrow
    close_date = today + timedelta(days=30)  # 30 days from now

    summary_request = create_opportunity_summary_request(
        summary_description="Test summary description",
        is_forecast=False,
        post_date=post_date,
        close_date=close_date,
        award_floor=50000,
        award_ceiling=200000,
    )

    print(f"Request data: {json.dumps(summary_request, default=str)}")

    # Send request to create a summary
    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=summary_request,
        headers={"X-SGG-Token": token},
    )

    # Print response details for debugging
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.data.decode('utf-8')}")

    # Verify successful response
    assert response.status_code == 200
    response_data = response.get_json()
    assert "data" in response_data

    # Verify summary data in response
    summary_data = response_data["data"]
    assert summary_data["summary_description"] == summary_request["summary_description"]
    assert summary_data["is_forecast"] == summary_request["is_forecast"]


def test_opportunity_summary_create_with_invalid_jwt_token(
    client, opportunity, opportunity_summary_request
):
    """Test opportunity summary creation endpoint with invalid JWT token"""
    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
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
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
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
        f"/v1/opportunities/{non_existent_id}/summary",
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
        post_date=date(2030, 12, 31), close_date=date.today()
    )

    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=invalid_dates_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "post date" in str(response_json).lower() and "close date" in str(response_json).lower()


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
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=invalid_award_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert (
        "award floor" in str(response_json).lower()
        and "award ceiling" in str(response_json).lower()
    )
