import pytest

from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException
from src.legacy_soap_api.soap_payload_handler import (
    SOAPPayload,
    build_mtom_response_from_dict,
    get_soap_operation_dict,
)

GRANTS_GOV_TRACKING_NUMBER = "GRANT80000000"
BOUNDARY_UUID = "9b15c243-6601-47b3-8f90-3877f0646f7d"
RESPONSE_MESSAGE = "Success"


class TestLegacySoapGrantorConfirmApplicationRequestSchema:
    def test_can_convert_confirm_application_delivery_request_soap_payload_dict(self, db_session):
        request_xml = (
            "<soapenv:Envelope "
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:ConfirmApplicationDeliveryRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:ConfirmApplicationDeliveryRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_payload_dict = SOAPPayload(request_xml).to_dict()
        expected = {
            "Envelope": {
                "@xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
                "@xmlns:agen": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
                "@xmlns:gran": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
                "Header": None,
                "Body": {
                    "ConfirmApplicationDeliveryRequest": {
                        "GrantsGovTrackingNumber": f"{GRANTS_GOV_TRACKING_NUMBER}"
                    }
                },
            }
        }
        assert soap_payload_dict == expected

    def test_can_convert_confirm_application_delivery_request_xml_bytes_to_dict(self, db_session):
        request_xml = (
            "<soapenv:Envelope "
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:ConfirmApplicationDeliveryRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:ConfirmApplicationDeliveryRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_operation_dict = get_soap_operation_dict(
            request_xml, "ConfirmApplicationDeliveryRequest"
        )
        schema = grantors_schemas.ConfirmApplicationDeliveryRequest(**soap_operation_dict)
        assert schema.grants_gov_tracking_number == GRANTS_GOV_TRACKING_NUMBER
        assert schema.model_dump() == {
            "grants_gov_tracking_number": f"{GRANTS_GOV_TRACKING_NUMBER}"
        }

    def test_confirm_application_delivery_request_validates_there_is_a_grants_gov_tracking_number(
        self, db_session
    ):
        request_xml = (
            "<soapenv:Envelope "
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:ConfirmApplicationDeliveryRequest>"
            "<gran:GrantsGovTrackingNumber></gran:GrantsGovTrackingNumber>"
            "</agen:ConfirmApplicationDeliveryRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        )
        soap_operation_dict = get_soap_operation_dict(
            request_xml, "ConfirmApplicationDeliveryRequest"
        )
        with pytest.raises(SOAPFaultException) as e:
            grantors_schemas.ConfirmApplicationDeliveryRequest(**soap_operation_dict)
        assert e.value.message == "No grants_gov_tracking_number provided."

    def test_confirm_application_delivery_request_raises_validation_error_when_invalid_data(
        self, db_session
    ):
        request_xml = ""
        soap_operation_dict = get_soap_operation_dict(
            request_xml, "ConfirmApplicationDeliveryRequest"
        )
        with pytest.raises(SOAPFaultException):
            grantors_schemas.ConfirmApplicationDeliveryRequest(**soap_operation_dict)


class TestLegacySoapGrantorConfirmApplicationResponseSchema:
    def test_can_convert_confirm_application_delivery_response_xml_bytes_to_dict(self, db_session):
        response_xml_bytes = (
            f"--uuid:{BOUNDARY_UUID}"
            'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"'
            "Content-Transfer-Encoding: binary"
            "Content-ID: <root.message@cxf.apache.org>"
            '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            "<soap:Body>"
            "<ns2:ConfirmApplicationDeliveryResponse "
            'xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" '
            'xmlns:ns11="http://schemas.xmlsoap.org/wsdl/" '
            'xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0" '
            'xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" '
            'xmlns:ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" '
            'xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0" '
            'xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0" '
            'xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0" '
            'xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0" '
            'xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0" '
            'xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            f"<GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</GrantsGovTrackingNumber>"
            f"<ResponseMessage>{RESPONSE_MESSAGE}</ResponseMessage>"
            "</ns2:ConfirmApplicationDeliveryResponse>"
            "</soap:Body>"
            "</soap:Envelope>"
        ).encode("utf-8")
        soap_payload_dict = SOAPPayload(soap_payload=response_xml_bytes.decode()).to_dict()
        schema = grantors_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            Body=soap_payload_dict.get("Envelope", {}).get("Body")
        )
        assert (
            schema.body.confirm_application_delivery_response.grants_gov_tracking_number
            == GRANTS_GOV_TRACKING_NUMBER
        )
        assert (
            schema.body.confirm_application_delivery_response.response_message == RESPONSE_MESSAGE
        )
        result = schema.to_soap_envelope_dict(operation_name="ConfirmApplicationDeliveryResponse")
        expected = {
            "Envelope": {
                "Body": {
                    "ns2:ConfirmApplicationDeliveryResponse": {
                        "GrantsGovTrackingNumber": f"{GRANTS_GOV_TRACKING_NUMBER}",
                        "ResponseMessage": f"{RESPONSE_MESSAGE}",
                    }
                }
            }
        }
        assert result == expected

    def test_can_convert_confirm_application_delivery_response_to_dict(self, db_session):
        response_xml_bytes = (
            f"--uuid:{BOUNDARY_UUID}"
            'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"'
            "Content-Transfer-Encoding: binary"
            "Content-ID: <root.message@cxf.apache.org>"
            '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            "<soap:Body>"
            "<ns2:ConfirmApplicationDeliveryResponse "
            'xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" '
            'xmlns:ns11="http://schemas.xmlsoap.org/wsdl/" '
            'xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0" '
            'xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" '
            'xmlns:ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" '
            'xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0" '
            'xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0" '
            'xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0" '
            'xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0" '
            'xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0" '
            'xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            f"<GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</GrantsGovTrackingNumber>"
            f"<ResponseMessage>{RESPONSE_MESSAGE}</ResponseMessage>"
            "</ns2:ConfirmApplicationDeliveryResponse>"
            "</soap:Body>"
            "</soap:Envelope>"
        ).encode("utf-8")
        soap_xml_dict = SOAPPayload(soap_payload=response_xml_bytes.decode()).to_dict()
        expected = {
            "Envelope": {
                "@xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "Body": {
                    "ConfirmApplicationDeliveryResponse": {
                        "@xmlns:ns12": "http://schemas.xmlsoap.org/wsdl/soap/",
                        "@xmlns:ns11": "http://schemas.xmlsoap.org/wsdl/",
                        "@xmlns:ns10": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
                        "@xmlns:ns9": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
                        "@xmlns:ns8": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
                        "@xmlns:ns7": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
                        "@xmlns:ns6": "http://apply.grants.gov/system/GrantsPackage-V1.0",
                        "@xmlns:ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
                        "@xmlns:ns4": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
                        "@xmlns:ns3": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
                        "@xmlns:ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
                        "@xmlns": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
                        "GrantsGovTrackingNumber": f"{GRANTS_GOV_TRACKING_NUMBER}",
                        "ResponseMessage": f"{RESPONSE_MESSAGE}",
                    }
                },
            }
        }
        assert soap_xml_dict == expected

    def test_can_convert_confirm_application_delivery_response_dict_to_mtom_message(
        self, db_session
    ):
        response_xml_bytes = (
            f"--uuid:{BOUNDARY_UUID}"
            'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"'
            "Content-Transfer-Encoding: binary"
            "Content-ID: <root.message@cxf.apache.org>"
            '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            "<soap:Body>"
            "<ns2:ConfirmApplicationDeliveryResponse "
            'xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" '
            'xmlns:ns11="http://schemas.xmlsoap.org/wsdl/" '
            'xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0" '
            'xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" '
            'xmlns:ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" '
            'xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0" '
            'xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0" '
            'xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0" '
            'xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0" '
            'xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0" '
            'xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            f"<GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</GrantsGovTrackingNumber>"
            f"<ResponseMessage>{RESPONSE_MESSAGE}</ResponseMessage>"
            "</ns2:ConfirmApplicationDeliveryResponse>"
            "</soap:Body>"
            "</soap:Envelope>"
        ).encode("utf-8")
        soap_payload_dict = SOAPPayload(soap_payload=response_xml_bytes.decode()).to_dict()
        result = grantors_schemas.ConfirmApplicationDeliveryResponseSOAPEnvelope(
            Body=soap_payload_dict.get("Envelope", {}).get("Body")
        ).to_soap_envelope_dict(operation_name="ConfirmApplicationDeliveryResponse")
        ns = {
            "ns12": "http://schemas.xmlsoap.org/wsdl/soap/",
            "ns11": "http://schemas.xmlsoap.org/wsdl/",
            "ns10": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
            "ns9": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
            "ns8": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
            "ns7": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
            "ns6": "http://apply.grants.gov/system/GrantsPackage-V1.0",
            "ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
            "ns4": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
            "ns3": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
            "ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
            "soap": "http://schemas.xmlsoap.org/soap/envelope/",
            "xop": "http://www.w3.org/2004/08/xop/include",
            None: "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
        }
        mtom_response = build_mtom_response_from_dict(
            result, raw_uuid=BOUNDARY_UUID, root="", namespaces=ns
        )
        cleaned_mtom_response = mtom_response.decode().replace("\n", "").encode("utf-8")
        assert cleaned_mtom_response == response_xml_bytes
