from unittest.mock import MagicMock, patch

import pytest

from src.db.models.competition_models import Competition
from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.applicants.schemas import (
    OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR,
    CFDADetails,
)
from src.legacy_soap_api.legacy_soap_api_client import (
    BaseSOAPClient,
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import BASE_SOAP_API_RESPONSE_HEADERS
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)
from tests.src.legacy_soap_api.soap_request_templates import (
    get_opportunity_list_requests as mock_requests,
)


class TestSOAPClientSmokeTest:
    @pytest.fixture(scope="class")
    def mock_soap_request(self):
        return SOAPRequest(
            method="POST",
            headers={},
            data=b"",
            full_path="/",
        )

    def test_can_instantiate(self, mock_soap_request, db_session) -> None:
        assert isinstance(BaseSOAPClient(mock_soap_request, db_session), BaseSOAPClient)
        assert isinstance(
            SimplerApplicantsS2SClient(mock_soap_request, db_session), SimplerApplicantsS2SClient
        )
        assert isinstance(
            SimplerGrantorsS2SClient(mock_soap_request, db_session), SimplerGrantorsS2SClient
        )


class TestGetOpportunityList:
    @pytest.fixture(autouse=True)
    def truncate_competitions(self, db_session):
        # This will truncate the competitions before each test that uses this fixture
        cascade_delete_from_db_table(db_session, Competition)
        yield

    @pytest.fixture
    def soap_request(self):
        return SOAPRequest(method="POST", headers={}, data=b"", full_path="/")

    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list_response(self, mock_proxy_request, soap_request, db_session):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        soap_request.data = mock_requests.get_opportunity_list_by_opportunity_number_request(
            opportunity_number="HDTRA1-25-S-0001"
        ).encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session=db_session)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"
        assert client.GetOpportunityListRequest() is not None
        assert isinstance(simpler_response, SOAPResponse)

    @patch("src.legacy_soap_api.legacy_soap_api_client.logger.info")
    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list_invalid_opportunity_filter(
        self, mock_proxy_request, mock_logger, soap_request, db_session
    ):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        soap_request.data = mock_requests.get_opportunity_list_invalid_opportunity_filter().encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session=db_session)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"

        expected_fault_xml = OpportunityListRequestInvalidParams.to_xml()
        expected_simpler_response = SOAPResponse(
            data=expected_fault_xml,
            status_code=500,
            headers={"Content-Length": len(expected_fault_xml), **BASE_SOAP_API_RESPONSE_HEADERS},
        )
        assert expected_simpler_response == simpler_response

        # Assert that the GetOpportunityListRequest failed validation.
        mock_logger.assert_called_once_with(
            "simpler_soap_api_fault",
            extra={
                "err": OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR,
                "fault": OpportunityListRequestInvalidParams.model_dump(),
            },
        )

    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list_response_by_package_id(
        self, mock_proxy_request, db_session, soap_request, enable_factory_create
    ):
        # Create an opportunity with a competition
        package_id = "PKG-SOAPCLIENT11"
        CompetitionFactory.create(
            opportunity=OpportunityFactory.create(), legacy_package_id=package_id
        )
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        soap_request.data = mock_requests.get_opportunity_list_by_package_id_request(
            package_id
        ).encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session=db_session)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"

        assert isinstance(simpler_response, SOAPResponse)

        response = client.GetOpportunityListRequest()
        assert len(response.opportunity_details) == 1
        assert response.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_package_id(
        self, soap_request, db_session, enable_factory_create
    ):
        package_id = "PKG-00260155"
        opportunity = OpportunityFactory.create()
        CompetitionFactory.create(opportunity=opportunity, legacy_package_id=package_id)
        soap_request.data = mock_requests.get_opportunity_list_by_package_id_request(
            package_id
        ).encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session)
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_competition_id_and_opportunity_number(
        self, soap_request, db_session, enable_factory_create
    ):
        opportunity_number = "123"
        competition_id = "ABC-134-56789"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity, public_competition_id=competition_id)
        soap_request.data = (
            mock_requests.get_opportunity_list_by_competition_id_and_opportunity_number_request(
                competition_id, opportunity_number
            ).encode()
        )
        client = SimplerApplicantsS2SClient(soap_request, db_session)
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].competition_id == competition_id
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

    def test_get_opportunity_list_by_opportunity_filter_opportunity_number(
        self, soap_request, db_session, enable_factory_create
    ):
        opportunity_number = "1234"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity)
        soap_request.data = mock_requests.get_opportunity_list_by_opportunity_number_request(
            opportunity_number
        ).encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session)
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

        # Test adding another competition results in entries returned
        CompetitionFactory.create(opportunity=opportunity, public_competition_id="ABC-134-22222")
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 2

    def test_get_opportunity_list_by_assistance_listing_number(
        self, soap_request, db_session, enable_factory_create
    ):
        assistance_listing_number = "10.10"
        program_title = "Fake program title"
        CompetitionFactory.create(
            opportunity_assistance_listing=OpportunityAssistanceListingFactory(
                assistance_listing_number=assistance_listing_number,
                program_title=program_title,
            )
        )
        soap_request.data = mock_requests.get_opportunity_list_by_assistance_listing_number(
            assistance_listing_number
        ).encode()
        client = SimplerApplicantsS2SClient(soap_request, db_session)
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].cfda_details == CFDADetails(
            number=assistance_listing_number,
            title=program_title,
        )
