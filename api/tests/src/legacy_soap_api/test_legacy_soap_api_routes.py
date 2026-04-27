import logging
from unittest import mock

from lxml import etree

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.competition_models import ApplicationSubmissionRetrieved
from src.legacy_soap_api import legacy_soap_api_config as soap_api_config
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth, SOAPClientCertificate
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import get_invalid_path_response
from tests.lib.data_factories import setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    ApplicationSubmissionRetrievedFactory,
    ApplicationSubmissionTrackingNumberFactory,
    CompetitionFactory,
    OpportunityFactory,
)

NSMAP = {
    "envelope": "http://schemas.xmlsoap.org/soap/envelope/",
    "application_request": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
    "tracking_number": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
}

SIMPLER_TRACKING_NUMBER = "GRANT80000008"
LEGACY_TRACKING_NUMBER = "GRANT00000008"
GET_APPLICATION_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}GetApplicationRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
GET_APPLICATION_ZIP_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}GetApplicationZipRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
CONFIRM_APPLICATION_DELIVERY_PATH = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}ConfirmApplicationDeliveryRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
UPDATE_APPLICATION_INFO = f"{{{NSMAP['envelope']}}}Body/{{{NSMAP['application_request']}}}UpdateApplicationInfoRequest/{{{NSMAP['tracking_number']}}}GrantsGovTrackingNumber"
MOCK_FINGERPRINT = "123"
MOCK_CERT = "456"
MOCK_CERT_STR = "certstr"
TEST_UUID = "00000000-aaaa-0000-bbbb-000000000000"


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


def test_successful_confirm_application_delivery_request(
    db_session, client, enable_factory_create
) -> None:
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.ACCEPTED
    )
    submission = ApplicationSubmissionFactory.create(application=application)
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        response = client.post(
            full_path, data=mock_data, headers={"Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}
        )
    assert response.status_code == 200
    retrieved = (
        db_session.query(ApplicationSubmissionRetrieved)
        .filter_by(application_submission_id=submission.application_submission_id)
        .all()
    )
    assert len(retrieved) == 1


@mock.patch("uuid.uuid4")
def test_successful_confirm_application_delivery_request_when_in_received_by_agency_status(
    mock_uuid, db_session, client, enable_factory_create, caplog
) -> None:
    mock_uuid.return_value = TEST_UUID
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.ACCEPTED
    )
    submission = ApplicationSubmissionFactory.create(application=application)
    ApplicationSubmissionRetrievedFactory.create(
        application_submission=submission, created_by_user=user
    )
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        response = client.post(
            full_path, data=mock_data, headers={"Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}
        )
    assert response.status_code == 500
    expected = (
        f"--uuid:{TEST_UUID}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n'
        "        <soap:Body>\n"
        "            <soap:Fault>\n"
        "                <faultcode>soap:Server</faultcode>\n"
        "                <faultstring>Failed to confirm application delivery."
        "(Expected an Application status of:'Validated' , but found a status of "
        f"'Received by Agency' for GRANT{submission.legacy_tracking_number})</faultstring>\n"
        "            </soap:Fault>\n"
        "        </soap:Body>\n"
        "    </soap:Envelope>\r\n"
        f"--uuid:{TEST_UUID}--\r\n"
    )
    assert response.data.decode() == expected
    assert (
        response.headers["Content-Type"]
        == f'multipart/related; type="application/xop+xml"; boundary="uuid:{TEST_UUID}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"'
    )
    log = next(r for r in caplog.records if r.message == "Soap Fault Exception raised")
    assert (
        log.faultstring
        == f"Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Received by Agency' for GRANT{submission.legacy_tracking_number})"
    )


@mock.patch("uuid.uuid4")
def test_successful_confirm_application_delivery_request_when_in_tracking_number_assigned_status(
    mock_uuid, db_session, client, enable_factory_create, caplog
) -> None:
    mock_uuid.return_value = TEST_UUID
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.ACCEPTED
    )
    submission = ApplicationSubmissionFactory.create(application=application)
    ApplicationSubmissionTrackingNumberFactory.create(
        application_submission=submission, created_by_user=user
    )
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        response = client.post(
            full_path, data=mock_data, headers={"Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}
        )
    assert response.status_code == 500
    expected = (
        f"--uuid:{TEST_UUID}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n'
        "        <soap:Body>\n"
        "            <soap:Fault>\n"
        "                <faultcode>soap:Server</faultcode>\n"
        "                <faultstring>Failed to confirm application delivery."
        "(Expected an Application status of:'Validated' , but found a status of "
        f"'Agency Tracking Number Assigned' for GRANT{submission.legacy_tracking_number})</faultstring>\n"
        "            </soap:Fault>\n"
        "        </soap:Body>\n"
        "    </soap:Envelope>\r\n"
        f"--uuid:{TEST_UUID}--\r\n"
    )
    assert response.data.decode() == expected
    log = next(r for r in caplog.records if r.message == "Soap Fault Exception raised")
    assert (
        log.faultstring
        == f"Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Agency Tracking Number Assigned' for GRANT{submission.legacy_tracking_number})"
    )


@mock.patch("uuid.uuid4")
def test_confirm_application_delivery_when_application_has_no_status(
    mock_uuid, db_session, client, enable_factory_create
) -> None:
    mock_uuid.return_value = TEST_UUID
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(competition=competition, application_status=None)
    submission = ApplicationSubmissionFactory.create(application=application)
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        with mock.patch(
            "src.legacy_soap_api.simpler_soap_api.get_legacy_response"
        ) as mock_legacy_response:
            mock_legacy_response.return_value = SOAPResponse(
                data=b"test response", status_code=500, headers={}
            )
            response = client.post(
                full_path,
                data=mock_data,
                headers={"Use-Simpler-Override": "1", "Use-Soap-Cert": "1"},
            )
    assert response.status_code == 500
    expected = (
        f"--uuid:{TEST_UUID}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n'
        "        <soap:Body>\n"
        "            <soap:Fault>\n"
        "                <faultcode>soap:Server</faultcode>\n"
        "                <faultstring>Application has no application_status</faultstring>\n"
        "            </soap:Fault>\n"
        "        </soap:Body>\n"
        "    </soap:Envelope>\r\n"
        f"--uuid:{TEST_UUID}--\r\n"
    )
    assert response.data.decode() == expected


@mock.patch("uuid.uuid4")
def test_if_soap_fault_exception_raised_return_correct_response_if_proxy_response_is_500(
    mock_uuid, db_session, client, enable_factory_create
) -> None:
    mock_uuid.return_value = TEST_UUID
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.IN_PROGRESS
    )
    submission = ApplicationSubmissionFactory.create(application=application)
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        response = client.post(
            full_path, data=mock_data, headers={"Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}
        )
    assert response.status_code == 500
    expected = (
        f"--uuid:{TEST_UUID}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\n'
        "Content-Transfer-Encoding: binary\r\n"
        "Content-ID: <root.message@cxf.apache.org>\r\n\r\n"
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n'
        "        <soap:Body>\n"
        "            <soap:Fault>\n"
        "                <faultcode>soap:Server</faultcode>\n"
        f"                <faultstring>Failed to confirm application delivery.(Expected an Application status of:'Validated' , but found a status of 'Received' for GRANT{submission.legacy_tracking_number})</faultstring>\n"
        "            </soap:Fault>\n"
        "        </soap:Body>\n"
        "    </soap:Envelope>\r\n"
        f"--uuid:{TEST_UUID}--\r\n"
    )
    assert response.data.decode() == expected


def test_if_soap_fault_exception_raised_return_proxy_response_if_proxy_response_status_code_is_not_500(
    db_session, client, enable_factory_create
) -> None:
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    privileges = {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
    user, role, soap_client_certificate = setup_cert_user(agency, privileges)
    application = ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.IN_PROGRESS
    )
    submission = ApplicationSubmissionFactory.create(
        application=application, legacy_tracking_number="00837443"
    )
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = (
        "<soapenv:Envelope "
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
        'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
        'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:ConfirmApplicationDeliveryRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:ConfirmApplicationDeliveryRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        with mock.patch(
            "src.legacy_soap_api.simpler_soap_api.get_legacy_response"
        ) as mock_legacy_response:
            mock_legacy_response.return_value = SOAPResponse(
                data=b"test response", status_code=200, headers={}
            )
            response = client.post(
                full_path,
                data=mock_data,
                headers={"Use-Soap-Cert": "1", "Use-Simpler-Override": "1"},
            )
    assert response.status_code == 200
    expected = "test response"
    assert response.data.decode() == expected


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


@mock.patch("uuid.uuid4")
@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_confirm_application_delivery_returns_not_found_response_if_simpler_id_is_used(
    mock_get_soap_response, mock_uuid, client, fixture_from_file, monkeypatch
) -> None:
    """
    Force the response to be the legacy response and show that we do not actually call the legacy request method
    """
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("USE_SIMPLER", "false")
    test_uuid = "00000000-aaaa-0000-bbbb-000000000000"
    mock_uuid.return_value = test_uuid
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = """
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
       <soapenv:Header/>
       <soapenv:Body>
          <agen:ConfirmApplicationDeliveryRequest>
             <gran:GrantsGovTrackingNumber>GRANT80837443</gran:GrantsGovTrackingNumber>
          </agen:ConfirmApplicationDeliveryRequest>
       </soapenv:Body>
    </soapenv:Envelope>
    """
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(CONFIRM_APPLICATION_DELIVERY_PATH)
    tracking_number.text = SIMPLER_TRACKING_NUMBER
    response = client.post(full_path, data=etree.tostring(envelope))
    expected = (
        f"--uuid:{test_uuid}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\nContent-Transfer-Encoding: binary\r\nContent-ID: <root.message@cxf.apache.org>\r\n'
        '\r\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        "<soap:Body>"
        "<soap:Fault><faultcode>soap:Server</faultcode><faultstring>Failed to confirm application delivery.(Authorization Failure)</faultstring></soap:Fault>"
        "</soap:Body></soap:Envelope>\r\n"
        f"--uuid:{test_uuid}--"
    ).encode("utf-8")
    mock_get_soap_response.assert_not_called()
    assert response.status_code == 500
    assert response.headers["Content-Length"] == "496"
    assert expected == response.data
    assert (
        response.headers["Content-Type"]
        == f'multipart/related; type="application/xop+xml"; boundary="uuid:{test_uuid}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"'
    )
    assert response.headers["Set-Cookie"] == "None; Path=/grantsws-agency; Secure; HttpOnly"


@mock.patch("uuid.uuid4")
@mock.patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response")
def test_update_application_info_returns_not_found_response_if_simpler_id_is_used(
    mock_get_soap_response, mock_uuid, client, fixture_from_file, monkeypatch
) -> None:
    """
    Force the response to be the legacy response and show that we do not actually call the legacy request method
    """
    soap_api_config.get_soap_config.cache_clear()
    monkeypatch.setenv("USE_SIMPLER", "false")
    test_uuid = "00000000-aaaa-0000-bbbb-000000000000"
    mock_uuid.return_value = test_uuid
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    mock_data = f"""
        <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
        xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0"
        xmlns:agen1="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:UpdateApplicationInfoRequest>
        <gran:GrantsGovTrackingNumber>{SIMPLER_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>
        <agen1:AssignAgencyTrackingNumber>1</agen1:AssignAgencyTrackingNumber>
        <agen1:SaveAgencyNotes>test 1</agen1:SaveAgencyNotes>
        </agen:UpdateApplicationInfoRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(UPDATE_APPLICATION_INFO)
    tracking_number.text = SIMPLER_TRACKING_NUMBER
    response = client.post(full_path, data=etree.tostring(envelope))
    expected = (
        f"--uuid:{test_uuid}\r\n"
        'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\r\nContent-Transfer-Encoding: binary\r\nContent-ID: <root.message@cxf.apache.org>\r\n'
        '\r\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        "<soap:Body>"
        "<ns2:UpdateApplicationInfoResponse "
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
        f"<GrantsGovTrackingNumber>{SIMPLER_TRACKING_NUMBER}</GrantsGovTrackingNumber>"
        "<ns2:Success>true</ns2:Success>"
        "<ns9:AssignAgencyTrackingNumberResult>"
        "<ns9:Success>false</ns9:Success>"
        "<ns9:ErrorMessage>Exception caught assigning agency tracking number.(Authorization Failure)</ns9:ErrorMessage>"
        "</ns9:AssignAgencyTrackingNumberResult>"
        "<ns9:SaveAgencyNotesResult>"
        "<ns9:Success>false</ns9:Success>"
        "<ns9:ErrorMessage>Exception caught saving agency notes.(Authorization Failure)</ns9:ErrorMessage>"
        "</ns9:SaveAgencyNotesResult>"
        "</ns2:UpdateApplicationInfoResponse>"
        "</soap:Body>"
        "</soap:Envelope>\r\n"
        f"--uuid:{test_uuid}--"
    ).encode("utf-8")
    mock_get_soap_response.assert_not_called()
    assert response.status_code == 500
    assert response.headers["Content-Length"] == "1694"
    assert expected == response.data
    assert (
        response.headers["Content-Type"]
        == f'multipart/related; type="application/xop+xml"; boundary="uuid:{test_uuid}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"'
    )
    assert response.headers["Set-Cookie"] == "None; Path=/grantsws-agency; Secure; HttpOnly"


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


def test_simpler_getapplicationzip_operation_raising_httperror_due_to_privileges_logs_info(
    client, fixture_from_file, enable_factory_create, caplog
) -> None:
    agency = AgencyFactory.create()
    opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
    competition = CompetitionFactory(
        opportunity=opportunity,
    )
    WRONG_PRIVILEGES = {Privilege.READ_TEST_USER_TOKEN}
    user, role, soap_client_certificate = setup_cert_user(agency, WRONG_PRIVILEGES)
    application = ApplicationFactory.create(competition=competition)
    submission = ApplicationSubmissionFactory.create(application=application)
    full_path = "/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    fixture_path = "/legacy_soap_api/grantors/get_application_zip_request.xml"
    mock_data = fixture_from_file(fixture_path)
    envelope = etree.fromstring(mock_data)
    tracking_number = envelope.find(GET_APPLICATION_ZIP_PATH)
    tracking_number.text = f"GRANT{submission.legacy_tracking_number}"
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number="1235",
        legacy_certificate=soap_client_certificate.legacy_certificate,
    )
    with mock.patch("src.legacy_soap_api.simpler_soap_api.get_soap_auth") as mock_get_auth:
        mock_get_auth.return_value = SOAPAuth(certificate=mock_client_cert)
        response = client.post(
            full_path, data=etree.tostring(envelope), headers={"Use-Simpler-Override": "1"}
        )
    assert response.status_code == 500
    info_messages = [
        record
        for record in caplog.records
        if record.message
        == "soap_client_certificate: User did not have permission to access this application"
    ]
    assert len(info_messages) == 1
    error_records = [record for record in caplog.records if record.levelno >= logging.ERROR]
    assert len(error_records) == 0
