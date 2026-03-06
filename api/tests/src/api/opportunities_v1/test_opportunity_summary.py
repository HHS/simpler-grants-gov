import uuid
from datetime import date

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.lib.opportunity_test_utils import create_opportunity_summary_request
from tests.src.db.models.factories import (
    AgencyFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)


@pytest.fixture
def opportunity_summary_auth_data(db_session, enable_factory_create):
    """Create a user with VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY permissions and return auth data"""
    agency = AgencyFactory.create()
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
        agency=agency,
    )
    return user, agency, token, api_key_id


@pytest.fixture
def opportunity(db_session, opportunity_summary_auth_data):
    """Create an opportunity for testing"""
    _, agency, _, _ = opportunity_summary_auth_data
    opportunity = OpportunityFactory.create(agency_record=agency, agency_id=agency.agency_id)
    return opportunity


@pytest.fixture
def opportunity_summary_request():
    """Return a valid opportunity summary creation request"""
    return create_opportunity_summary_request(close_date=date(2030, 12, 31))


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


def test_opportunity_summary_create_no_permissions(
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


def test_opportunity_summary_create_duplicate(
    client, db_session, enable_factory_create, opportunity_summary_request
):
    """Test creating a duplicate opportunity summary (same forecast type)"""
    # Create a user with both VIEW_OPPORTUNITY and UPDATE_OPPORTUNITY privileges
    agency = AgencyFactory.create()
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[Privilege.VIEW_OPPORTUNITY, Privilege.UPDATE_OPPORTUNITY],
        agency=agency,
    )

    # Create an opportunity associated with the agency
    opportunity = OpportunityFactory.create(agency_record=agency, agency_id=agency.agency_id)

    # Create first summary directly using the API endpoint
    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )
    assert response.status_code == 200

    # Try to create another with the same forecast type
    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=opportunity_summary_request,
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422
    response_json = response.get_json()
    assert "already exists" in str(response_json).lower()


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

    # Use the utility function with invalid dates
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


def test_opportunity_with_existing_summary(
    client, db_session, enable_factory_create, opportunity_summary_auth_data
):
    """Test that an opportunity with an existing summary of the same type returns a 422 error"""
    _, agency, token, _ = opportunity_summary_auth_data

    # Create an opportunity with a non-forecast summary using the factory
    opportunity = OpportunityFactory.create(agency_record=agency)

    # Try to create another non-forecast summary for the same opportunity
    request_data = create_opportunity_summary_request(is_forecast=False)
    response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=request_data,
        headers={"X-SGG-Token": token},
    )

    # Should fail with 422 because a non-forecast summary already exists
    assert response.status_code == 422
    response_json = response.get_json()
    assert "already exists" in str(response_json).lower()

    # Creating a forecast summary should pass
    forecast_request = create_opportunity_summary_request(is_forecast=True)
    forecast_response = client.post(
        f"/v1/opportunities/{opportunity.opportunity_id}/summary",
        json=forecast_request,
        headers={"X-SGG-Token": token},
    )

    assert forecast_response.status_code == 200
