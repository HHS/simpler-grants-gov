from unittest.mock import patch

import pytest

from src.legacy_soap_api.legacy_soap_api_client import (
    BaseSOAPClient,
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPProxyResponse, SOAPRequest


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
        mock_proxy_response = SOAPProxyResponse(
            data=b"""
--uuid:1558f8c1-296f-48fb-8993-ecb44df382a5
Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"
Content-Transfer-Encoding: binary
Content-ID:
<root.message@cxf.apache.org>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:GetOpportunityListResponse xmlns:ns5="http://apply.grants.gov/system/ApplicantCommonElements-V1.0" xmlns:ns4="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:ns3="http://schemas.xmlsoap.org/wsdl/" xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
            <ns5:OpportunityDetails>
                <FundingOpportunityNumber>O-BJA-2025-202930-STG</FundingOpportunityNumber>
                <FundingOpportunityTitle>DY SAM PI26  user session</FundingOpportunityTitle>
                <PackageID>PKG00112670</PackageID>
                <ns5:CFDADetails>
                    <ns5:Number>16.030</ns5:Number>
                    <ns5:Title>National Center on Restorative Justice</ns5:Title>
                </ns5:CFDADetails>
                <ns5:OpeningDate>2025-03-20-04:00</ns5:OpeningDate>
                <ns5:ClosingDate>2025-07-26-04:00</ns5:ClosingDate>
                <OfferingAgency>Bureau of Justice Assistance</OfferingAgency>
                <AgencyContactInfo>dy</AgencyContactInfo>
                <SchemaURL>https://trainingapply.grants.gov/apply/opportunities/schemas/applicant/PKG00112670.xsd</SchemaURL>
                <InstructionsURL>https://trainingapply.grants.gov/apply/opportunities/instructions/PKG00112670-instructions.pdf</InstructionsURL>
                <ns5:IsMultiProject>false</ns5:IsMultiProject>
            </ns5:OpportunityDetails>
        </ns2:GetOpportunityListResponse>
    </soap:Body>
</soap:Envelope>
--uuid:1558f8c1-296f-48fb-8993-ecb44df382a5--
""",
            status_code=200,
            headers={},
        )
        mock_proxy_request.return_value = mock_proxy_response
        mock_soap_request = SOAPRequest(
            method="POST",
            headers={},
            data=b"""
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
""",
            full_path="/",
        )
        client = SimplerApplicantsS2SClient(mock_soap_request)
        result, simpler_response = client.get_response()
        assert result == mock_proxy_response
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
