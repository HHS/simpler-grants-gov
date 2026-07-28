import json
import logging
import uuid

import boto3
import flask
from grants_shared.util import file_util

from src.legacy_soap_api import legacy_soap_api_config as soap_api_config
from src.legacy_soap_api.legacy_soap_api_config import GRANTOR_SOAP_ACTION_PATH
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_internal_request_id,
    write_debug_data_to_s3,
)
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
    app,
    db_session,
    enable_factory_create,
    monkeypatch,
    mock_s3_bucket,
    s3_config,
) -> None:
    test_uuid = uuid.uuid4()
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("SAVE_SOAP_MESSAGES_TO_S3", "true")
    soap_legacy_response = SOAPResponse(
        data=SOAP_LEGACY_RESPONSE_PAYLOAD, status_code=200, headers={"xyz": "abc"}
    )
    soap_request = create_soap_request(
        SOAP_PAYLOAD, operation_name="GetSubmissionListExpandedRequest"
    )
    with app.test_request_context("/"):
        flask.g.internal_request_id = test_uuid
        write_debug_data_to_s3(soap_request, soap_legacy_response)
    request_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/request.txt"
    )
    response_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/response.txt"
    )
    response_headers_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/response_headers.txt"
    )
    request_headers_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/request_headers.txt"
    )
    assert request_contents.replace("\n", "") == SOAP_PAYLOAD.decode().replace("\n", "")
    assert response_contents.replace("\r", "") == SOAP_LEGACY_RESPONSE_PAYLOAD.decode().replace(
        "\r", ""
    )
    assert response_headers_contents.replace("\r", "") == json.dumps({"xyz": "abc"})
    assert request_headers_contents.replace("\r", "") == json.dumps(
        {
            "X-Gg-S2S-Uri": "https://google.com/xyz",
            "Soapaction": f"{GRANTOR_SOAP_ACTION_PATH}/GetSubmissionListExpanded",
        }
    )


def test_write_debug_data_to_s3_handles_a_null_soap_request(
    app,
    caplog,
    db_session,
    enable_factory_create,
    monkeypatch,
    mock_s3_bucket,
    s3_config,
    mock_s3,
) -> None:
    test_uuid = uuid.uuid4()
    caplog.set_level(logging.INFO)
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("SAVE_SOAP_MESSAGES_TO_S3", "true")
    soap_legacy_response = SOAPResponse(
        data=SOAP_LEGACY_RESPONSE_PAYLOAD, status_code=200, headers={}
    )
    with app.test_request_context("/"):
        flask.g.internal_request_id = test_uuid
        write_debug_data_to_s3(None, soap_legacy_response)
    record = next(
        r for r in caplog.records if r.message == "soap_client: debug info uploaded to s3"
    )
    assert record
    assert not file_util.file_exists(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/request.txt"
    )
    response_contents = file_util.read_file(
        f"s3://local-mock-draft-bucket/soap-debug/{test_uuid}/response.txt"
    )
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


def test_write_debug_data_to_s3_runs_on_any_endpoint(
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
    assert len(objects.get("Contents")) == 28


def test_get_internal_request_id_returns_flask_internal_request_id_if_in_context(app):
    with app.test_request_context("/"):
        TEST_UUID = "aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb"
        flask.g.internal_request_id = TEST_UUID
        # The internal id is consistent and not recalculated after every call if in context
        result_1 = get_internal_request_id()
        assert result_1 == TEST_UUID
        result_2 = get_internal_request_id()
        assert result_2 == TEST_UUID
    result_3 = get_internal_request_id()
    assert result_3 != TEST_UUID
