from unittest.mock import MagicMock, patch

import pytest

from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListResponse,
    OpportunityDetails,
)
from src.legacy_soap_api.legacy_soap_api_client import SimplerApplicantsS2SClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)
from tests.src.legacy_soap_api.soap_request_templates import (
    get_opportunity_list_requests as mock_requests,
)


def get_simpler_applicants_soap_client(request_data, db_session):
    soap_request = SOAPRequest(
        method="POST",
        headers={},
        data=request_data,
        full_path="/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort",
        api_name=SimplerSoapAPI.APPLICANTS,
    )
    return SimplerApplicantsS2SClient(soap_request, db_session)


class TestSimplerSOAPApplicantsClientGetOpportunityList:
    @pytest.fixture(autouse=True)
    def truncate_competitions(self, db_session):
        # This will truncate the competitions and related data for each test within this test class.
        cascade_delete_from_db_table(db_session, Competition)
        cascade_delete_from_db_table(db_session, Opportunity)

    @patch("src.legacy_soap_api.legacy_soap_api_proxy.get_proxy_response")
    def test_get_opportunity_list_response(self, mock_proxy_request, db_session):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_opportunity_number_request(
                opportunity_number="HDTRA1-25-S-0001"
            ).encode(),
            db_session=db_session,
        )
        assert client.operation_config.request_operation_name == "GetOpportunityListRequest"
        assert client.operation_config.response_operation_name == "GetOpportunityListResponse"
        assert client.GetOpportunityListRequest() is not None
        simpler_soap_response, use_simpler = client.get_simpler_soap_response(
            mock_proxy_request_response
        )
        assert isinstance(simpler_soap_response, SOAPResponse)

    @patch("src.legacy_soap_api.legacy_soap_api_proxy.get_proxy_response")
    def test_get_opportunity_list_response_by_package_id(
        self, mock_proxy_request, db_session, enable_factory_create
    ):
        # Create an opportunity with a competition
        package_id = "PKG-SOAPCLIENT11"
        CompetitionFactory.create(
            opportunity=OpportunityFactory.create(), legacy_package_id=package_id
        )
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_package_id_request(package_id).encode(),
            db_session=db_session,
        )
        assert client.operation_config.request_operation_name == "GetOpportunityListRequest"
        assert client.operation_config.response_operation_name == "GetOpportunityListResponse"
        opportunity_list_response = client.GetOpportunityListRequest()
        assert len(opportunity_list_response.opportunity_details) == 1
        assert opportunity_list_response.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_package_id(self, db_session, enable_factory_create):
        package_id = "PKG-00260155"
        opportunity = OpportunityFactory.create()
        CompetitionFactory.create(opportunity=opportunity, legacy_package_id=package_id)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_package_id_request(package_id).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_competition_id_and_opportunity_number(
        self, db_session, enable_factory_create
    ):
        opportunity_number = "123"
        competition_id = "ABC-134-56789"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity, public_competition_id=competition_id)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_competition_id_and_opportunity_number_request(
                competition_id, opportunity_number
            ).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].competition_id == competition_id
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

    def test_get_opportunity_list_by_opportunity_filter_opportunity_number(
        self, db_session, enable_factory_create
    ):
        opportunity_number = "1234"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_opportunity_number_request(
                opportunity_number
            ).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

        # Test adding another competition results in entries returned
        CompetitionFactory.create(opportunity=opportunity, public_competition_id="ABC-134-22222")
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 2

    def test_get_opportunity_list_by_assistance_listing_number(
        self, db_session, enable_factory_create
    ):
        assistance_listing_number = "10.10"
        program_title = "Fake program title"
        legacy_package_id = "PKG-SOAPPACKAGE"
        is_multi_package = True  # will resolve to "true"

        mock_competition = CompetitionFactory.create(
            is_multi_package=is_multi_package,
            legacy_package_id=legacy_package_id,
            opportunity_assistance_listing=OpportunityAssistanceListingFactory(
                assistance_listing_number=assistance_listing_number,
                program_title=program_title,
            ),
        )

        simpler_soap_client = get_simpler_applicants_soap_client(
            request_data=mock_requests.get_opportunity_list_by_assistance_listing_number(
                assistance_listing_number
            ).encode(),
            db_session=db_session,
        )

        assert simpler_soap_client._get_simpler_soap_response_schema() == GetOpportunityListResponse

        expected_soap_request_dict = {
            "OpportunityFilter": {"CFDANumber": assistance_listing_number}
        }
        assert simpler_soap_client.get_soap_request_dict() == expected_soap_request_dict

        expected_simpler_data = GetOpportunityListResponse(
            opportunity_details=[
                OpportunityDetails(
                    is_multi_project="true",
                    cfda_details=CFDADetails(
                        number=mock_competition.opportunity_assistance_listing.assistance_listing_number,
                        title=mock_competition.opportunity_assistance_listing.program_title,
                    ),
                    package_id=mock_competition.legacy_package_id,
                    agency_contact_info=mock_competition.contact_info,
                    schema_url=f"http://mock-applicants-soap-api/apply/opportunities/schemas/applicant/{mock_competition.legacy_package_id}.xsd",
                    funding_opportunity_title=mock_competition.opportunity.opportunity_title,
                    funding_opportunity_number=mock_competition.opportunity.opportunity_number,
                    competition_title=mock_competition.competition_title,
                    competition_id=mock_competition.public_competition_id,
                    closing_date=mock_competition.closing_date,
                    opening_date=mock_competition.opening_date,
                )
            ]
        )

        assert (
            simpler_soap_client.get_soap_response_dict()
            == expected_simpler_data.to_soap_envelope_dict(
                simpler_soap_client.operation_config.response_operation_name
            )
        )
