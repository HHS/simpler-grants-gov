import unittest

import pytest

from src.legacy_soap_api.soap_payload_handler import (
    SOAPEnvelopeData,
    SOAPPayload,
    build_xml_from_dict,
    get_envelope_dict,
    get_soap_envelope_from_payload,
    get_soap_operation_name,
)
from tests.util.minifiers import minify_xml

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

MOCK_SOAP_REQUEST_HEADER = b"""
    \r\n------=_Part_41_486913496.1757620327503\r\nContent-Type: application/xop+xml; c
    harset=UTF-8; type="text/xml"\r\nContent-Transfer-Encoding: 8bit\r\nContent-ID: <test>\r\n\r\n
"""
MOCK_SOAP_REQUEST_ENVELOPE = f"""
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://schemas.xmlsoap.org/services/ApplicantWebServices-V2.0">
    \n   <soapenv:Header/>\n   <soapenv:Body>\n      <app:{MOCK_SOAP_OPERATION_NAME}>\n         <app:OperationName2>
    </app:OperationName2>\n<!--Zero or more repetitions:-->\n          <gran:Attachment>\n
                 <gran:FileContentId>Dummy.pdf</gran:FileContentId>\n\t        <gran:FileDataHandler>
    <inc:Include href="cid:0000" xmlns:inc="http://www.w3.org/2004/08/xop/include"/>
    </gran:FileDataHandler>\n         </gran:Attachment>\n\n       </app:{MOCK_SOAP_OPERATION_NAME}>\n   </soapenv:Body>\n
    </soapenv:Envelope>
""".encode(
    "utf-8"
)
MOCK_SOAP_REQUEST_ALT_ENVELOPE = f"""
    <soap:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://schemas.xmlsoap.org/services/ApplicantWebServices-V2.0">
    \n   <soapenv:Header/>\n   <soapenv:Body>\n      <app:{MOCK_SOAP_OPERATION_NAME}>\n         <app:OperationName2>
    </app:OperationName2>\n<!--Zero or more repetitions:-->\n          <gran:Attachment>\n
                 <gran:FileContentId>Dummy.pdf</gran:FileContentId>\n\t        <gran:FileDataHandler>
    <inc:Include href="cid:0000" xmlns:inc="http://www.w3.org/2004/08/xop/include"/>
    </gran:FileDataHandler>\n         </gran:Attachment>\n\n       </app:{MOCK_SOAP_OPERATION_NAME}>\n
    </soapenv:Body>\n</soapenv:Envelope>
""".encode(
    "utf-8"
)
MOCK_SOAP_REQUEST_NO_TAG_ENVELOPE = """
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://schemas.xmlsoap.org/services/ApplicantWebServices-V2.0">'
    "\n   <soapenv:Header/>\n   <soapenv:Body>\n      "
"""
MOCK_SOAP_REQUEST_INCOMPLETE_ENVELOPE = f"""
    <soap:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://schemas.xmlsoap.org/services/ApplicantWebServices-V2.0">
    "\n   <soapenv:Header/>\n
    <soapenv:Body>\n
    <app:{MOCK_SOAP_OPERATION_NAME}>\n
"""
MOCK_SOAP_REQUEST_ATTACHMENT = b"""
    \r\n------=_Part_41_486913496.1757620327503\r\nConte
    nt-Type: text/plain; charset=us-ascii; name=test.txt\r\nContent-Transfer-Encoding:
    7bit\r\nContent-ID: <budget>\r\nContent-Disposition: attachment; name="test.txt"; filename="test.txt"\r\n\r\nhello\nhello\nhello\nh
    ello\nworld\n\n\r\n------=_Part_41_486913496.1757620327503--\r\n
"""
ALMOST_ONE_CHUNK = "a" * 997
FIVE_CHUNKS = "a" * 5000


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


class TestBuildXMLFromDict(unittest.TestCase):
    def setUp(self):
        self.operation_name = "Operation1"
        self.namespaces = {
            "soap": "http://schemas.xmlsoap.org/soap/envelope/",
            "ns0": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
            "ns1": "http://nsuri.gov/app",
            None: "http://default_ns_uri.gov/",
        }
        self.namespace_keymap = {
            self.operation_name: "ns1",
            "DataWithNS": "ns0",
        }

    def test_basic_xml_to_dict_with_ns(self):
        xml_dict = {self.operation_name: {"DataWithNS": "a"}}
        result = build_xml_from_dict(
            self.operation_name, xml_dict, self.namespace_keymap, self.namespaces
        )
        assert (
            result
            == minify_xml(
                """
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
	<soap:Body>
		<ns1:Operation1 xmlns:ns0="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:ns1="http://nsuri.gov/app" xmlns="http://default_ns_uri.gov/">
			<ns1:Operation1>
				<ns0:DataWithNS>a</ns0:DataWithNS>
			</ns1:Operation1>
		</ns1:Operation1>
	</soap:Body>
</soap:Envelope>
        """
            ).encode()
        )

    def test_lists_xml_to_dict_with_ns(self):
        xml_dict = {self.operation_name: {"DataWithNS": ["10", "10"]}}
        result = build_xml_from_dict(
            self.operation_name, xml_dict, self.namespace_keymap, self.namespaces
        )
        assert (
            result
            == minify_xml(
                """
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
	<soap:Body>
		<ns1:Operation1 xmlns:ns0="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:ns1="http://nsuri.gov/app" xmlns="http://default_ns_uri.gov/">
			<ns1:Operation1>
				<ns0:DataWithNS>10</ns0:DataWithNS>
				<ns0:DataWithNS>10</ns0:DataWithNS>
			</ns1:Operation1>
		</ns1:Operation1>
	</soap:Body>
</soap:Envelope>
        """
            ).encode()
        )


class TestGetSoapOperationName(unittest.TestCase):
    def test_get_soap_operation_name_ignores_header_and_attachment(self):
        result = get_soap_operation_name(
            (
                MOCK_SOAP_REQUEST_HEADER.decode()
                + MOCK_SOAP_REQUEST_ENVELOPE.decode()
                + MOCK_SOAP_REQUEST_ATTACHMENT.decode()
            ).encode("utf-8")
        )
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_when_just_xml(self):
        result = get_soap_operation_name(MOCK_SOAP_REQUEST_ENVELOPE)
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_when_passed_a_string_instead_of_bytes(self):
        result = get_soap_operation_name(MOCK_SOAP_REQUEST_ENVELOPE.decode())
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_checks_for_older_soap_envelope_tag(self):
        result = get_soap_operation_name(MOCK_SOAP_REQUEST_ALT_ENVELOPE)
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_returns_first_tag_after_body_even_if_invalid_xml(
        self,
    ):
        result = get_soap_operation_name(MOCK_SOAP_REQUEST_INCOMPLETE_ENVELOPE)
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_returns_empty_string_when_xml_does_not_have_operation_tag(
        self,
    ):
        result = get_soap_operation_name(MOCK_SOAP_REQUEST_NO_TAG_ENVELOPE)
        assert result == ""

    def test_get_soap_operation_name_returns_empty_string_when_passed_empty_string(self):
        result = get_soap_operation_name("")
        assert result == ""

    def test_get_soap_operation_name_handles_when_soap_pattern_is_divided_between_two_chunks_of_1000(
        self,
    ):
        result = get_soap_operation_name(
            (ALMOST_ONE_CHUNK + MOCK_SOAP_REQUEST_ENVELOPE.decode()).encode("utf-8")
        )
        assert result == MOCK_SOAP_OPERATION_NAME

    def test_get_soap_operation_name_stops_checking_after_five_chunks(
        self,
    ):
        result = get_soap_operation_name(
            (FIVE_CHUNKS + MOCK_SOAP_REQUEST_ENVELOPE.decode()).encode("utf-8")
        )
        assert result == ""
