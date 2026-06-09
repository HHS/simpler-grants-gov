import logging

import boto3

from src.legacy_soap_api import legacy_soap_api_config as soap_api_config
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import write_debug_data_to_s3
from src.util import file_util
from tests.lib.data_factories import create_soap_request

NSMAP = {
    "envelope": "http://schemas.xmlsoap.org/soap/envelope/",
    "application_request": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
    "tracking_number": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
}
GET_APPLICATION_ZIP_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}GetApplicationZipRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
LEGACY_TRACKING_NUMBER = "GRANT00000008"
SOAP_PAYLOAD = (
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
    'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
    'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
    "<soapenv:Header/>"
    "<soapenv:Body>"
    "<agen:GetApplicationZipRequest>"
    "<gran:GrantsGovTrackingNumber>GRANT9000000</gran:GrantsGovTrackingNumber>"
    "</agen:GetApplicationZipRequest>"
    "</soapenv:Body>"
    "</soapenv:Envelope>"
).encode("utf-8")
SOAP_LEGACY_RESPONSE_PAYLOAD = (
    "--uuid:def0358e-9646-4696-a879-59956dedfabc"
    'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"'
    "Content-Transfer-Encoding: binary"
    "Content-ID: <root.message@cxf.apache.org>"
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
    "<soap:Body><ns2:GetSubmissionListExpandedResponse"
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
    "<ns2:Success>true</ns2:Success>"
    "<ns2:AvailableApplicationNumber>0</ns2:AvailableApplicationNumber>"
    "</ns2:GetSubmissionListExpandedResponse>"
    "</soap:Body>"
    "</soap:Envelope>"
    "--uuid:def0358e-9646-4696-a879-59956dedfabc--"
).encode("utf-8")


def test_write_debug_data_to_s3(
    caplog, db_session, enable_factory_create, monkeypatch, mock_s3_bucket, s3_config, mock_s3
) -> None:
    caplog.set_level(logging.INFO)
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("SAVE_SOAP_MESSAGES_TO_S3", "true")
    soap_legacy_response = SOAPResponse(
        data=SOAP_LEGACY_RESPONSE_PAYLOAD, status_code=200, headers={}
    )
    soap_request = create_soap_request(
        SOAP_PAYLOAD, operation_name="GetSubmissionListExpandedRequest"
    )
    write_debug_data_to_s3(soap_request, soap_legacy_response)
    record = next(
        r for r in caplog.records if r.message == "soap_client: debug info uploaded to s3"
    )
    request_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap/{record.debug_identifier}/request.txt"
    )
    response_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap/{record.debug_identifier}/response.txt"
    )
    assert request_contents.replace("\n", "") == SOAP_PAYLOAD.decode().replace("\n", "")
    assert response_contents.replace("\r", "") == SOAP_LEGACY_RESPONSE_PAYLOAD.decode().replace(
        "\r", ""
    )


def test_write_debug_data_to_s3_does_not_run_if_flag_is_set_to_false(
    db_session, enable_factory_create, monkeypatch, mock_s3_bucket, s3_config, mock_s3
) -> None:
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("SAVE_SOAP_MESSAGES_TO_S3", "false")
    s3_client = boto3.client("s3", region_name="us-east-1")
    soap_legacy_response = SOAPResponse(
        data=SOAP_LEGACY_RESPONSE_PAYLOAD, status_code=200, headers={}
    )
    soap_request = create_soap_request(
        SOAP_PAYLOAD, operation_name="GetSubmissionListExpandedRequest"
    )
    write_debug_data_to_s3(soap_request, soap_legacy_response)
    objects = s3_client.list_objects_v2(Bucket="local-mock-draft-bucket")
    assert objects.get("Contents", None) is None


def test_write_debug_data_to_s3_does_not_run_if_not_in_specified_operations(
    db_session, enable_factory_create, monkeypatch, mock_s3_bucket, s3_config, mock_s3
) -> None:
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("SAVE_SOAP_MESSAGES_TO_S3", "true")
    s3_client = boto3.client("s3", region_name="us-east-1")
    soap_legacy_response = SOAPResponse(
        data=SOAP_LEGACY_RESPONSE_PAYLOAD, status_code=200, headers={}
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="GetSubmissionListExpandedRequest"),
        soap_legacy_response,
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="GetSubmissionListRequest"),
        soap_legacy_response,
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="GetApplicationZipRequest"),
        soap_legacy_response,
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="ConfirmApplicationDeliveryRequest"),
        soap_legacy_response,
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="UpdateApplicationInfoRequest"),
        soap_legacy_response,
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="X"), soap_legacy_response
    )
    write_debug_data_to_s3(
        create_soap_request(SOAP_PAYLOAD, operation_name="Y"), soap_legacy_response
    )
    objects = s3_client.list_objects_v2(Bucket="local-mock-draft-bucket")
    # If it triggered on everything it should be 14
    assert len(objects.get("Contents")) == 10
