from unittest.mock import MagicMock, patch

import pytest

from src.legacy_soap_api.applicants.fault_messages import OpportunityListRequestInvalidParams
from src.legacy_soap_api.applicants.schemas.opportunity_filter import (
    OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR,
)
from src.legacy_soap_api.legacy_soap_api_client import (
    BaseSOAPClient,
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import BASE_SOAP_API_RESPONSE_HEADERS

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


class TestSOAPClientSmokeTest:
    @pytest.fixture(scope="class")
    def mock_soap_request(self):
        return SOAPRequest(
            method="POST",
            headers={},
            data=b"",
            full_path="/",
        )

    def test_can_instantiate(self, mock_soap_request) -> None:
        assert isinstance(BaseSOAPClient(mock_soap_request), BaseSOAPClient)
        assert isinstance(SimplerApplicantsS2SClient(mock_soap_request), SimplerApplicantsS2SClient)
        assert isinstance(SimplerGrantorsS2SClient(mock_soap_request), SimplerGrantorsS2SClient)


class TestSimplerApplicantsClient:
    @patch("src.legacy_soap_api.legacy_soap_api_client.logger.info")
    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list(self, mock_proxy_request, mock_logger):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=MOCK_REQUEST_WITH_VALID_OPPORTUNITY_FILTER,
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_request_response
        assert client.soap_request_message.operation_name == "GetOpportunityListRequest"

        # What we expect until we query sgg db for results.
        assert simpler_response is None

        # Assert that the payload was validated in GetOpportunityListRequest method.
        mock_logger.assert_called_once_with(
            "soap get_opportunity_list_request validated",
            extra={
                "get_opportunity_request": {
                    "package_id": None,
                    "opportunity_filter": {
                        "funding_opportunity_number": "HDTRA1-25-S-0001",
                        "cfda_number": None,
                        "competition_id": None,
                    },
                }
            },
        )

    @patch("src.legacy_soap_api.legacy_soap_api_client.logger.info")
    @patch("src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient._proxy_soap_request")
    def test_get_opportunity_list_invalid_opportunity_filter(self, mock_proxy_request, mock_logger):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=MOCK_REQUEST_WITH_INVALID_OPPORTUNITY_FILTER,
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request)
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
            "soap_applicants_api_fault",
            extra={
                "err": OPPORTUNITY_LIST_MISSING_REQUIRED_FIELDS_ERR,
                "fault": OpportunityListRequestInvalidParams.model_dump(),
            },
        )
