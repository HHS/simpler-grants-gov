import pytest

from src.db.models.competition_models import Competition
from src.legacy_soap_api.applicants.schemas import GetOpportunityListRequest, OpportunityFilter
from src.legacy_soap_api.applicants.services.get_opportunity_list_response import (
    get_opportunity_list_response,
)
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory


@pytest.fixture(autouse=True)
def truncate_competitions(db_session):
    # This will truncate the competitions and opportunities before each
    # test that uses this fixture
    cascade_delete_from_db_table(db_session, Competition)
    yield


def test_get_opportunity_list_by_package_id(db_session, enable_factory_create):
    mock_package_id = "PKG-00260155"
    opportunity_list_request = GetOpportunityListRequest(package_id=mock_package_id)
    opportunity = OpportunityFactory.create()
    CompetitionFactory.create(opportunity=opportunity, legacy_package_id=mock_package_id)
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].package_id == mock_package_id


def test_get_opportunity_list_by_opportunity_filter_opportunity_id_and_competition_id(
    db_session, enable_factory_create
):
    mock_opportunity_number = "123"
    mock_competition_id = "ABC-134-56789"
    opportunity = OpportunityFactory.create(opportunity_number=mock_opportunity_number)
    CompetitionFactory.create(opportunity=opportunity, public_competition_id=mock_competition_id)
    opportunity_list_request = GetOpportunityListRequest(
        opportunity_filter=OpportunityFilter(
            competition_id=mock_competition_id, funding_opportunity_number=mock_opportunity_number
        )
    )
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].competition_id == mock_competition_id


def test_get_opportunity_list_by_opportunity_filter_opportunity_id(
    db_session, enable_factory_create
):
    mock_opportunity_number = "1234"
    opportunity = OpportunityFactory.create(opportunity_number=mock_opportunity_number)
    CompetitionFactory.create(opportunity=opportunity)
    opportunity_list_request = GetOpportunityListRequest(
        opportunity_filter=OpportunityFilter(funding_opportunity_number=mock_opportunity_number)
    )
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].funding_opportunity_number == mock_opportunity_number

    # Test adding another competition results in entries returned
    CompetitionFactory.create(opportunity=opportunity, public_competition_id="ABC-134-22222")
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 2


def test_get_opportunity_list_by_opportunity_filter_opportunity_id_no_results(db_session):
    for dne_opportunity_list_request in (
        GetOpportunityListRequest(package_id="dne"),
        GetOpportunityListRequest(
            opportunity_filter=OpportunityFilter(
                competition_id="dne",
                funding_opportunity_number="dne",
            )
        ),
        GetOpportunityListRequest(
            opportunity_filter=OpportunityFilter(competition_id="dne", cfda_number="dne")
        ),
    ):
        assert (
            len(
                get_opportunity_list_response(
                    db_session, dne_opportunity_list_request
                ).opportunity_details
            )
            == 0
        )
