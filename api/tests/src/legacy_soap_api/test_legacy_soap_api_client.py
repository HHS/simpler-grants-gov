from unittest.mock import MagicMock, patch

import pytest

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.applicants.schemas import OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR
from src.legacy_soap_api.legacy_soap_api_client import (
    BaseSOAPClient,
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import BASE_SOAP_API_RESPONSE_HEADERS
from tests.src.db.models.factories import CompetitionFactory, OpportunityFactory

MOCK_REQUEST_WITH_INVALID_OPPORTUNITY_FILTER = b"""
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <app:GetOpportunityListRequest>
         <app1:OpportunityFilter>
            <gran:CompetitionID>HDTRA1-25-S-0001</gran:CompetitionID>
         </app1:OpportunityFilter>
      </app:GetOpportunityListRequest>
   </soapenv:Body>
</soapenv:Envelope>
"""

MOCK_REQUEST_WITH_VALID_OPPORTUNITY_FILTER = b"""
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <app:GetOpportunityListRequest>
         <app1:OpportunityFilter>
            <gran:FundingOpportunityNumber>HDTRA1-25-S-0001</gran:FundingOpportunityNumber>
         </app1:OpportunityFilter>
      </app:GetOpportunityListRequest>
   </soapenv:Body>
</soapenv:Envelope>
"""

MOCK_COMPETITION_LEGACY_PACKAGE_ID = "PKG-SOAPCLIENT11"
MOCK_GET_OPPORTUNITY_LIST_REQUEST_WITH_PACKAGE_ID = f"""
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <app:GetOpportunityListRequest>
        <PackageID>{MOCK_COMPETITION_LEGACY_PACKAGE_ID}</PackageID>
      </app:GetOpportunityListRequest>
   </soapenv:Body>
</soapenv:Envelope>
""".encode()


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


class TestSimplerApplicantsClient:
    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list(self, mock_proxy_request, db_session):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=MOCK_REQUEST_WITH_VALID_OPPORTUNITY_FILTER,
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request, db_session=db_session)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"
        assert client.GetOpportunityListRequest() is not None

        # What we expect until we query sgg db for results.
        assert isinstance(simpler_response, SOAPResponse)

    @patch("src.legacy_soap_api.legacy_soap_api_client.logger.info")
    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list_invalid_opportunity_filter(
        self, mock_proxy_request, mock_logger, db_session
    ):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=MOCK_REQUEST_WITH_INVALID_OPPORTUNITY_FILTER,
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request, db_session=db_session)
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
    def test_get_opportunity_list_by_package_id(
        self, mock_proxy_request, db_session, enable_factory_create
    ):
        # Create an opportunity with a competition
        opportunity = OpportunityFactory.create()
        sgg_competition_result = CompetitionFactory.create(
            opportunity=opportunity, legacy_package_id=MOCK_COMPETITION_LEGACY_PACKAGE_ID
        )
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=MOCK_GET_OPPORTUNITY_LIST_REQUEST_WITH_PACKAGE_ID,
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request, db_session=db_session)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"

        assert isinstance(simpler_response, SOAPResponse)

        response = client.GetOpportunityListRequest()
        assert len(response.opportunity_details) == 1
        assert (
            response.opportunity_details[0].package_id == sgg_competition_result.legacy_package_id
        )
