from unittest import mock

from lxml import etree

from src.legacy_soap_api.legacy_soap_api_auth import USE_SOAP_JWT_HEADER_KEY
from src.legacy_soap_api.legacy_soap_api_utils import get_invalid_path_response

NSMAP = {
    "envelope": "http://schemas.xmlsoap.org/soap/envelope/",
    "application_request": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
    "tracking_number": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
}

SIMPLER_TRACKING_NUMBER = "GRANT80000008"
LEGACY_TRACKING_NUMBER = "GRANT00000008"
GET_APPLICATION_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}GetApplicationRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
GET_APPLICATION_ZIP_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}GetApplicationZipRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"


def test_successful_request(client, fixture_from_file, caplog) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    fixture_path = (
        "/legacy_soap_api/applicants/get_opportunity_list_by_funding_opportunity_number_request.xml"
    )
    mock_data = fixture_from_file(fixture_path)
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 200

    # Verify that certain logs are present with expected extra values
    post_message = next(
        record
        for record in caplog.records
        if record.message == "POST /<service_name>/services/v2/<service_port_name>"
    )
    assert post_message.service_name == "grantsws-applicant"
    assert post_message.service_port_name == "ApplicantWebServicesSoapPort"

    req_message = next(
        record for record in caplog.records if record.message == "SOAP request received"
    )
    assert req_message.soap_api == "applicants"
    assert req_message.soap_request_operation_name == "GetOpportunityListRequest"


def test_soap_jwt_flag_is_enabled_is_logged(client, fixture_from_file, caplog) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    fixture_path = (
        "/legacy_soap_api/applicants/get_opportunity_list_by_funding_opportunity_number_request.xml"
    )
    mock_data = fixture_from_file(fixture_path)
    response = client.post(full_path, data=mock_data, headers={f"{USE_SOAP_JWT_HEADER_KEY}": "1"})
    assert response.status_code == 200
    assert "soap_client_certificate: Use-Soap-Jwt flag is enabled" in caplog.messages


def test_soap_jwt_flag_is_disabled_is_not_logged(client, fixture_from_file, caplog) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    fixture_path = (
        "/legacy_soap_api/applicants/get_opportunity_list_by_funding_opportunity_number_request.xml"
    )
    mock_data = fixture_from_file(fixture_path)
    response = client.post(full_path, data=mock_data, headers={f"{USE_SOAP_JWT_HEADER_KEY}": "0"})
    assert response.status_code == 200
    post_message = [
        record
        for record in caplog.records
        if record.message == "soap_client_certificate: Use-Soap-Jwt flag is enabled"
    ]
    assert len(post_message) == 0


def test_soap_jwt_flag_is_not_included_is_treated_as_if_it_is_disabled(
    client, fixture_from_file, caplog
) -> None:
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    fixture_path = (
        "/legacy_soap_api/applicants/get_opportunity_list_by_funding_opportunity_number_request.xml"
    )
    mock_data = fixture_from_file(fixture_path)
    response = client.post(full_path, data=mock_data)
    assert response.status_code == 200

    # Verify that certain logs are present with expected extra values
    post_message = [
        record
        for record in caplog.records
        if record.message == "soap_client_certificate: use_soap_jwt flag is enabled"
    ]
    assert len(post_message) == 0


def test_invalid_service_name_not_found(client) -> None:
    full_path = "/invalid/services/v2/ApplicantWebServicesSoapPort"
    response = client.post(full_path, data="mock")
    expected_response = get_invalid_path_response()
    assert response.status_code == 404
    assert response.data == expected_response.data


def test_invalid_xml_server_error_500(client) -> None:
    """Test 500 use case

    This tests that invalid xml results in 500 status code since that
    is what the grants.gov soap api responds with in such cases.
    """
    full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
    response = client.post(full_path, data="<invalid><soap>")
    assert response.status_code == 500


@mock.patch("uuid.uuid4")
@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_getapplication_operation_returns_not_found_response_if_simpler_id_is_used(
    mock_get_soap_response, mock_uuid, client, fixture_from_file
) -> None:
    test_uuid = "00000000-aaaa-0000-bbbb-000000000000"
    mock_uuid.return_value = test_uuid
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_PATH)
    tracking_number.text = SIMPLER_TRACKING_NUMBER
    response = client.post(
        full_path, data=etree.tostring(envelope), headers={"Connection": "close"}
    )
    expected = (
        f"--uuid:{test_uuid}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>"
        '\r\n\r\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        "<soap:Body><soap:Fault>"
        "<faultcode>soap:Server</faultcode>"
        f"<faultstring>Failed to get application.(Grant Application not found for tracking number:{tracking_number.text})"
        "</faultstring></soap:Fault></soap:Body></soap:Envelope>\r\n"
        f"--uuid:{test_uuid}--"
    ).encode("utf-8")
    mock_get_soap_response.assert_not_called()
    assert response.status_code == 500
    assert expected == response.data
    assert response.headers["Content-Length"] == "523"
    assert (
        response.headers["Content-Type"]
        == f'multipart/related; type="application/xop+xml"; boundary="uuid:{test_uuid}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"'
    )
    assert response.headers["Set-Cookie"] == "None; Path=/grantsws-agency; Secure; HttpOnly"


@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_getapplicationzip_operation_calls_soap_proxy_if_tracking_number_is_a_legacy_id(
    mock_get_soap_response, client, fixture_from_file
) -> None:
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_zip_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_ZIP_PATH)
    tracking_number.text = LEGACY_TRACKING_NUMBER
    client.post(full_path, data=etree.tostring(envelope))
    mock_get_soap_response.assert_called_once()


@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_getapplication_operation_calls_soap_proxy_if_tracking_number_is_a_legacy_id(
    mock_get_soap_response, client, fixture_from_file
) -> None:
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_PATH)
    tracking_number.text = LEGACY_TRACKING_NUMBER
    client.post(full_path, data=etree.tostring(envelope))
    mock_get_soap_response.assert_called_once()


@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_getapplication_operation_calls_proxy_if_xml_throws_parsing_error(
    mock_get_soap_response, client, fixture_from_file
) -> None:
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    data = """
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
           <soapenv:Header/>
           <soapenv:Body>
              <agen:GetApplicationRequest>
                   <gran:GrantsGovTrackingNumber>GRAN
    """
    client.post(full_path, data=data)
    mock_get_soap_response.assert_called_once()


@mock.patch("uuid.uuid4")
@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_getapplicationzip_operation_returns_not_found_response_if_simpler_id_is_used(
    mock_get_soap_response, mock_uuid, client, fixture_from_file
) -> None:
    test_uuid = "00000000-aaaa-0000-bbbb-000000000000"
    mock_uuid.return_value = test_uuid
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_zip_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_ZIP_PATH)
    tracking_number.text = SIMPLER_TRACKING_NUMBER
    response = client.post(full_path, data=etree.tostring(envelope))
    expected = (
        f"--uuid:{test_uuid}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>"
        '\r\n\r\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        "<soap:Body><soap:Fault>"
        "<faultcode>soap:Server</faultcode>"
        f"<faultstring>Failed to get application zip.(Grant Application not found for tracking number:{tracking_number.text})"
        "</faultstring></soap:Fault></soap:Body></soap:Envelope>\r\n"
        f"--uuid:{test_uuid}--"
    ).encode("utf-8")
    mock_get_soap_response.assert_not_called()
    assert response.status_code == 500
    assert response.headers["Content-Length"] == "527"
    assert expected == response.data
    assert (
        response.headers["Content-Type"]
        == f'multipart/related; type="application/xop+xml"; boundary="uuid:{test_uuid}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"'
    )


@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_simpler_getapplicationzip_operation_returns_not_found_response_includes_cookie(
    mock_get_soap_response, client, fixture_from_file
) -> None:
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_zip_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_ZIP_PATH)
    tracking_number.text = SIMPLER_TRACKING_NUMBER
    client.set_cookie("JSESSIONID", "xyz")
    response = client.post(full_path, data=etree.tostring(envelope))
    mock_get_soap_response.assert_not_called()
    assert response.status_code == 500
    assert (
        response.headers["Set-Cookie"] == "JSESSIONID=xyz; Path=/grantsws-agency; Secure; HttpOnly"
    )
