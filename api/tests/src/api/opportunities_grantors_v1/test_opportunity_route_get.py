import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.opportunity_test_utils import create_user_in_agency_with_jwt_and_api_key
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


# TODO: Add test_opportunity_get_successful_with_jwt


def test_opportunity_get_with_invalid_jwt_token(client, opportunity):
    """Test opportunity retrieval with invalid JWT token"""
    response = client.get(
        f"/v1/grantors/opportunities/{opportunity.opportunity_id}/grantor",
        headers={"X-SGG-Token": "invalid_token_value"},
    )

    assert response.status_code == 401
