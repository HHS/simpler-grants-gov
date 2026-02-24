import io
import uuid
from unittest.mock import patch

import pytest

from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_client import SimplerGrantorsS2SClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.loegacy_soap_api_utils import SOAPFaultException

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
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        with patch.object(uuid, "uuid4", return_value=CID_UUID):
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_application_zip_request().to_soap_envelope_dict(
                operation_name="GetApplicationZipResponse"
            )
            expected = {
                "Envelope": {
                    "Body": {
                        "ns2:GetApplicationZipResponse": {
                            "ns2:FileDataHandler": {
                                "xop:Include": {"@href": f"cid:{CID_UUID}-0001@apply.grants.gov"}
                            }
                        }
                    }
                }
            }
            assert result == expected

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
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
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

    def test_getapplicationziprequest_schema_can_consume_incoming_soap_request_xml(
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
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
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
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
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
