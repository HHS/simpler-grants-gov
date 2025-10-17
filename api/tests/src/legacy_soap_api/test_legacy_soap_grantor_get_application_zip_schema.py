import uuid
from unittest.mock import patch

import pytest

from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_client import SimplerGrantorsS2SClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException

GRANTS_GOV_TRACKING_NUMBER = "GRANT80000000"
CID_UUID = "aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"
BOUNDARY_UUID = "cccccccc-1111-2222-3333-dddddddddddd"


class TestLegacySoapGrantorGetApplicationZipSchema:
    def test_to_soap_envelop_dicts_transforms_xml_to_dict(self, db_session):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        with patch.object(uuid, "uuid4", return_value=CID_UUID):
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.GetApplicationZipRequest().to_soap_envelope_dict(
                operation_name="GetApplicationZipResponse"
            )
            expected = {
                "Body": {
                    "ns2:GetApplicationZipResponse": {
                        "ns2:FileDataHandler": {
                            "xop:Include": {"@href": f"cid:{CID_UUID}-0001@apply.grants.gov"}
                        }
                    }
                }
            }
            assert result == expected

    def test_get_simpler_soap_response_returns_mtom_xml(self, db_session):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=200, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_simpler_soap_response(mock_proxy_response)
            expected = (
                f"--uuid:{BOUNDARY_UUID}\n"
                "Content-Type: application/xop+xml; cha"
                'rset=UTF-8; type="text/xml"\n'
                "Content-Transfer-Encoding: binary\nContent-Id: <root.message@cxf.apache.org>\n\n"
                '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
                "<soap:Body><ns2:GetApplicationZipResponse "
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
                "<ns2:FileDataHandler><xop:Include "
                'xmlns:xop="http://www.w3.org/2004/08/xop/include" '
                f'href="cid:{CID_UUID}-0001@apply.grants.gov"/>'
                "</ns2:FileDataHandler></ns2:GetApplicationZipResponse></soap:Body></soap:Envelope>\n"
                f"--uuid:{BOUNDARY_UUID}\n"
            ).encode("utf-8")
            assert result.data == expected
            assert result.headers == {
                "Content-Type": f'multipart/related; type="application/xop+xml"; boundary="uuid:{BOUNDARY_UUID}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"',
                "MIME-Version": "1.0",
            }

    def test_get_simpler_soap_response_does_not_add_mtom_data_if_is_mtom_is_false_on_operation_config(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=200, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            client.operation_config.is_mtom = False
            result = client.get_simpler_soap_response(mock_proxy_response)
            assert isinstance(result.data, bytes)
            assert result.data.startswith(
                b'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            )

    def test_get_soap_request_dict_turns_request_xml_to_dict(self, db_session):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        result = client.get_soap_request_dict()
        expected = {"GrantsGovTrackingNumber": GRANTS_GOV_TRACKING_NUMBER}
        assert result == expected

    def test_GetApplicationZipRequest_schema_can_consume_incoming_soap_request_xml(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        soap_request_dict = client.get_soap_request_dict()
        result = grantors_schemas.GetApplicationZipRequest(**soap_request_dict)
        assert result.grants_gov_tracking_number == GRANTS_GOV_TRACKING_NUMBER

    def test_get_pydantic_error_if_request_xml_does_not_have_tracking_number(self, db_session):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            "<gran:GrantsGovTrackingNumber></gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        soap_request_dict = client.get_soap_request_dict()
        with pytest.raises(SOAPFaultException) as exc_info:
            grantors_schemas.GetApplicationZipRequest(**soap_request_dict)
        assert exc_info.value.message == "No grants_gov_tracking_number provided."
