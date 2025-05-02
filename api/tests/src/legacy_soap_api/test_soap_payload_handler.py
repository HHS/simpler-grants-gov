import pytest

from src.legacy_soap_api.soap_payload_handler import SoapPayload

MOCK_SOAP_OPERATION_NAME = "GetOpportunityListResponse"
MOCK_SOAP_ENVELOPE = f"""<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
        <n:APIKey xmlns:n="http://auth.com/apikey">
            apikeyinheaderexample
        </n:APIKey>
    </soap:Header>
    <soap:Body>
        <ns2:{MOCK_SOAP_OPERATION_NAME} xmlns:ns5="http://apply.grants.gov/system/ApplicantCommonElements-V1.0" xmlns:ns4="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:ns3="http://schemas.xmlsoap.org/wsdl/" xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
            <ns5:OpportunityDetails>
                <ns5:OpeningDate>2025-03-20-04:00</ns5:OpeningDate>
                <ns5:ClosingDate>2025-07-26-04:00</ns5:ClosingDate>
            </ns5:OpportunityDetails>
        </ns2:{MOCK_SOAP_OPERATION_NAME}>
    </soap:Body>
</soap:Envelope>"""
MOCK_SOAP_RESPONSE = f"""
--uuid:cb40f637-4aa7-4771-abca-3130a73794dc
Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"
Content-Transfer-Encoding: binary
Content-ID:
<root.message@cxf.apache.org>
{MOCK_SOAP_ENVELOPE}
--uuid:cb40f637-4aa7-4771-abca-3130a73794dc--"""


class TestSoapPayload:
    @pytest.fixture(scope="class")
    def soap_payload(self):
        return SoapPayload(MOCK_SOAP_RESPONSE)

    def test_payload_property(self, soap_payload):
        given = soap_payload.payload
        expected = MOCK_SOAP_RESPONSE
        assert given == expected

    def test_soap_envelope(self, soap_payload):
        given = soap_payload.envelope
        expected = MOCK_SOAP_ENVELOPE
        assert given == expected

    def test_operation_name(self, soap_payload):
        given = soap_payload.operation_name
        expected = MOCK_SOAP_OPERATION_NAME
        assert given == expected
