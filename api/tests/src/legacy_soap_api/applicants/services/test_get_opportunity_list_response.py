from src.legacy_soap_api.applicants.schemas import GetOpportunityListRequest, OpportunityFilter
from src.legacy_soap_api.applicants.services.get_opportunity_list_response import (
    get_opportunity_list_response,
)
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory


def test_get_opportunity_list_by_package_id(db_session, enable_factory_create):
    mock_package_id = "PKG-00260155"
    opportunity_list_request = GetOpportunityListRequest(package_id=mock_package_id)
    opportunity = OpportunityFactory.create()
    CompetitionFactory.create(opportunity=opportunity, legacy_package_id=mock_package_id)
    db_session.commit()
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
    db_session.commit()
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
    db_session.commit()
    opportunity_list_request = GetOpportunityListRequest(
        opportunity_filter=OpportunityFilter(funding_opportunity_number=mock_opportunity_number)
    )
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].funding_opportunity_number == mock_opportunity_number

    # Test adding another competition results in entries returned
    CompetitionFactory.create(opportunity=opportunity, public_competition_id="ABC-134-22222")
    db_session.commit()
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 2
