import pytest

from src.legacy_soap_api.soap_payload_handler import (
    SOAPEnvelopeData,
    SOAPPayload,
    get_envelope_dict,
    get_soap_envelope_from_payload,
)

MOCK_SOAP_OPERATION_NAME = "GetOpportunityListResponse"
MOCK_SOAP_ENVELOPE = f"""<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
        <soap:APIKey>apikeyinheaderexample</soap:APIKey>
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


def test_invalid_soap_string():
    soap_payload = SOAPPayload("randomdata939023")
    assert soap_payload.envelope_data.envelope == ""
    assert soap_payload.operation_name == ""
    assert soap_payload.to_dict() == {}


def test_soap_payload_from_dict():
    soap_dict = {"Envelope": {"Body": {"Tag": "10"}}}
    soap_str = "<Envelope><Body><Tag>10</Tag></Body></Envelope>"
    payload_from_dict = SOAPPayload(soap_payload=soap_dict)
    assert payload_from_dict.envelope_data.envelope.strip() == soap_str.strip()
    assert payload_from_dict.to_dict() == soap_dict


def test_soap_payload_from_string():
    soap_dict = {"Envelope": {"Body": {"Tag": "10"}}}
    soap_str = "<soap:Envelope><Body><Tag>10</Tag></Body></soap:Envelope>"
    payload_from_string = SOAPPayload(soap_payload=soap_str)
    assert payload_from_string.envelope_data.envelope.strip() == soap_str.strip()
    assert payload_from_string.to_dict() == soap_dict


class TestSOAPPayload:
    @pytest.fixture(scope="class")
    def soap_payload(self):
        return SOAPPayload(MOCK_SOAP_RESPONSE, force_list_attributes=("OpportunityDetails",))

    def test_payload_property(self, soap_payload):
        given = soap_payload.payload
        expected = MOCK_SOAP_RESPONSE
        assert given == expected

    def test_soap_envelope(self, soap_payload):
        given = soap_payload.envelope_data.envelope
        expected = MOCK_SOAP_ENVELOPE
        assert given == expected

    def test_operation_name(self, soap_payload):
        given = soap_payload.operation_name
        expected = MOCK_SOAP_OPERATION_NAME
        assert given == expected

    def test_to_dict_only_non_attr_namespace_keys_modified(self, soap_payload):
        given = soap_payload.to_dict()
        expected = {
            "Envelope": {
                "@xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "Header": {"APIKey": "apikeyinheaderexample"},
                "Body": {
                    "GetOpportunityListResponse": {
                        "@xmlns:ns5": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
                        "@xmlns:ns4": "http://schemas.xmlsoap.org/wsdl/soap/",
                        "@xmlns:ns3": "http://schemas.xmlsoap.org/wsdl/",
                        "@xmlns:ns2": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
                        "@xmlns": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
                        "OpportunityDetails": [
                            {"OpeningDate": "2025-03-20-04:00", "ClosingDate": "2025-07-26-04:00"}
                        ],
                    }
                },
            }
        }
        assert given == expected

    def test_update_envelope_from_dict(self, soap_payload):
        original_dict = soap_payload.to_dict()
        new_operation_name = "GetOpportunityListResponse1"
        expected_updated_dict = {
            "Envelope": {
                "@xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "Header": {"APIKey": "apikeyinheaderexample"},
                "Body": {
                    new_operation_name: {
                        "@xmlns:ns5": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
                        "@xmlns:ns4": "http://schemas.xmlsoap.org/wsdl/soap/",
                        "@xmlns:ns3": "http://schemas.xmlsoap.org/wsdl/",
                        "@xmlns:ns2": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
                        "@xmlns": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
                        "OpportunityDetails": [
                            {"OpeningDate": "2025-03-20-04:00", "ClosingDate": "2025-07-26-04:00"},
                            {"OpeningDate": "2026-03-20-04:00", "ClosingDate": "2027-07-26-04:00"},
                        ],
                    }
                },
            }
        }
        soap_payload.update_envelope_from_dict(expected_updated_dict)
        assert original_dict != soap_payload.to_dict()
        assert expected_updated_dict == soap_payload.to_dict()
        assert new_operation_name == soap_payload.operation_name


def test_get_envelope_dict() -> None:
    operation_name = "a"
    soap_xml_dict = {"Envelope": {"Body": {operation_name: {1: 1}}}}
    assert get_envelope_dict(soap_xml_dict, operation_name) == {1: 1}


def test_get_envelope_from_payload():
    pre_envelope = """--uuid:8531b3f8-7467-42a6-baae-9a2c4393ec39
Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"
Content-Transfer-Encoding: binary
Content-ID: <root.message@cxf.apache.org>"""
    envelope = """<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:GetOpportunityListResponse>
            <PackageID>PKG00112670</PackageID>
        </ns2:GetOpportunityListResponse>
    </soap:Body>
</soap:Envelope>"""
    post_envelope = "--uuid:8531b3f8-7467-42a6-baae-9a2c4393ec39--"
    payload_xml = f"{pre_envelope}{envelope}{post_envelope}"
    expected = SOAPEnvelopeData(
        pre_envelope=pre_envelope, envelope=envelope, post_envelope=post_envelope
    )
    assert get_soap_envelope_from_payload(payload_xml) == expected

    # test that xml with only envelope data can parse correctly
    assert get_soap_envelope_from_payload(envelope) == SOAPEnvelopeData(envelope=envelope)

    # test only pre envelope characters
    assert get_soap_envelope_from_payload(f"{pre_envelope}{envelope}") == SOAPEnvelopeData(
        pre_envelope=pre_envelope, envelope=envelope
    )

    # test no envelope
    assert get_soap_envelope_from_payload("noenvelope") == SOAPEnvelopeData()
