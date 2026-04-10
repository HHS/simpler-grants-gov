import io
import uuid
from unittest.mock import patch

import pytest

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_client import SimplerGrantorsS2SClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    OpportunityFactory,
)

GRANTS_GOV_TRACKING_NUMBER = "GRANT80000000"
CID_UUID = "aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"
BOUNDARY_UUID = "cccccccc-1111-2222-3333-dddddddddddd"


class TestLegacySoapGrantorGetApplicationZipSchema:
    def test_to_soap_envelop_dicts_transforms_xml_to_dict(self, db_session, enable_factory_create):
        agency = AgencyFactory.create()
        opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
        competition = CompetitionFactory(
            opportunity=opportunity,
        )
        privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        user, role, soap_client_certificate = setup_cert_user(agency, privileges)
        submission = ApplicationSubmissionFactory.create(
            application__application_status=ApplicationStatus.ACCEPTED,
            application__competition=competition,
        )
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        auth = SOAPAuth(certificate=soap_client_certificate)
        soap_request = SOAPRequest(
            data=SoapRequestStreamer(stream=io.BytesIO(request_xml_bytes)),
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
            auth=auth,
        )
        with patch.object(uuid, "uuid4", return_value=CID_UUID):
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_application_zip_request().to_soap_envelope_dict(
                operation_name="GetApplicationZipResponse"
            )
            result.pop("_mtom_file_stream")
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
