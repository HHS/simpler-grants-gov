import pytest

from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.instructions import Tinstructions
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListRequest,
    OpportunityFilter,
)
from src.legacy_soap_api.applicants.services.get_opportunity_list_response import (
    get_opportunity_list_response,
)
from src.legacy_soap_api.legacy_soap_api_config import get_soap_config
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    StagingTinstructionsFactory,
)


@pytest.fixture(autouse=True)
def truncate_competitions(db_session):
    # This will truncate the competitions and related data for each test within this test file.
    cascade_delete_from_db_table(db_session, Competition)
    cascade_delete_from_db_table(db_session, Opportunity)
    cascade_delete_from_db_table(db_session, Tinstructions)


def test_get_opportunity_list_by_package_id(db_session, enable_factory_create):
    mock_package_id = "PKG-00260155"
    mock_legacy_competition_id = 1000
    mock_instructions_extension = ".doc"

    opportunity_list_request = GetOpportunityListRequest(package_id=mock_package_id)
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(
        opportunity=opportunity,
        legacy_competition_id=mock_legacy_competition_id,
        legacy_package_id=mock_package_id,
    )
    StagingTinstructionsFactory.create(
        competition=None,
        comp_id=competition.legacy_competition_id,
        extension=mock_instructions_extension,
    )

    result = get_opportunity_list_response(db_session, opportunity_list_request)

    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].package_id == mock_package_id
    assert (
        result.opportunity_details[0].schema_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/schemas/applicant/{mock_package_id}.xsd"
    )
    assert (
        result.opportunity_details[0].instructions_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/instructions/{mock_package_id}-instructions{mock_instructions_extension}"
    )


def test_get_opportunity_list_by_opportunity_filter_opportunity_id_and_competition_id(
    db_session, enable_factory_create
):
    mock_opportunity_number = "123"
    mock_competition_id = "ABC-134-56789"
    mock_package_id = "PKG-00260155"
    mock_legacy_competition_id = 1000
    mock_instructions_extension = ".doc"

    opportunity = OpportunityFactory.create(opportunity_number=mock_opportunity_number)
    competition = CompetitionFactory.create(
        opportunity=opportunity,
        public_competition_id=mock_competition_id,
        legacy_package_id=mock_package_id,
        legacy_competition_id=mock_legacy_competition_id,
    )
    StagingTinstructionsFactory.create(
        competition=None,
        comp_id=competition.legacy_competition_id,
        extension=mock_instructions_extension,
    )
    opportunity_list_request = GetOpportunityListRequest(
        opportunity_filter=OpportunityFilter(
            competition_id=mock_competition_id, funding_opportunity_number=mock_opportunity_number
        )
    )

    result = get_opportunity_list_response(db_session, opportunity_list_request)

    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].competition_id == mock_competition_id
    assert (
        result.opportunity_details[0].schema_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/schemas/applicant/{mock_package_id}.xsd"
    )
    assert (
        result.opportunity_details[0].instructions_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/instructions/{mock_package_id}-instructions{mock_instructions_extension}"
    )


def test_get_opportunity_list_by_opportunity_filter_opportunity_id(
    db_session, enable_factory_create
):
    mock_opportunity_number = "1234"
    mock_package_id = "PKG-00260155"
    mock_legacy_competition_id = 1000
    mock_instructions_extension = ".doc"

    opportunity = OpportunityFactory.create(opportunity_number=mock_opportunity_number)
    competition = CompetitionFactory.create(
        opportunity=opportunity,
        legacy_competition_id=mock_legacy_competition_id,
        legacy_package_id=mock_package_id,
    )
    StagingTinstructionsFactory.create(
        competition=None,
        comp_id=competition.legacy_competition_id,
        extension=mock_instructions_extension,
    )
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
    assert (
        result.opportunity_details[0].schema_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/schemas/applicant/{mock_package_id}.xsd"
    )
    assert (
        result.opportunity_details[0].instructions_url
        == f"{get_soap_config().grants_gov_uri}/apply/opportunities/instructions/{mock_package_id}-instructions{mock_instructions_extension}"
    )


def test_get_opportunity_list_by_assistance_listing_number(db_session, enable_factory_create):
    mock_opportunity_assistance_listing_number = "10.10"
    mock_program_title = "Fake program title"
    opportunity_assistance_listing = OpportunityAssistanceListingFactory(
        assistance_listing_number=mock_opportunity_assistance_listing_number,
        program_title=mock_program_title,
    )
    CompetitionFactory.create(opportunity_assistance_listing=opportunity_assistance_listing)
    opportunity_list_request = GetOpportunityListRequest(
        opportunity_filter=OpportunityFilter(cfda_number=mock_opportunity_assistance_listing_number)
    )
    result = get_opportunity_list_response(db_session, opportunity_list_request)
    assert len(result.opportunity_details) == 1
    assert result.opportunity_details[0].cfda_details == CFDADetails(
        number=mock_opportunity_assistance_listing_number,
        title=mock_program_title,
    )


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
        opportunities_list_response = get_opportunity_list_response(
            db_session, dne_opportunity_list_request
        )
        assert len(opportunities_list_response.opportunity_details) == 0
