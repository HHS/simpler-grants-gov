import base64
import logging
from unittest.mock import ANY, patch

import jwt
import pytest
from freezegun import freeze_time

import tests.src.db.models.factories as factories
from src.legacy_soap_api.legacy_soap_api_auth import (
    REQUEST_SOAP_ACTION_KEY,
    SOAPClientCertificate,
    SOAPClientMissingCertificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, get_soap_config
from src.legacy_soap_api.legacy_soap_api_proxy import (
    get_proxy_headers,
    get_proxy_response,
    get_soap_jwt_auth_jwt,
)
from tests.lib.data_factories import create_soap_request

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


def test_get_proxy_response(enable_factory_create, monkeypatch, db_session):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    legacy_certificate = soap_request.auth.certificate.legacy_certificate
    with db_session.begin():
        legacy_certificate.legacy_certificate_id = "e57e1c7f-cf2e-455e-9db5-3e03650174a7"
        db_session.add(legacy_certificate)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send:
        get_proxy_response(soap_request)
        mock_send.assert_called_once_with(ANY, stream=True, cert=None, timeout=3600)


def test_get_proxy_response_preserves_soap_action(enable_factory_create, monkeypatch, db_session):
    config = get_soap_config()
    soap_request = create_soap_request(SOAP_PAYLOAD, with_soap_action=True)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send:
        get_proxy_response(soap_request)
        assert (
            mock_send.call_args_list[0][0][0].headers.get(REQUEST_SOAP_ACTION_KEY, "")
            == f"{config.grants_gov_uri}/grantsws-agency/services/v2/AgencyWebServicesSoapPort/GetApplicationZip"
        )


def test_get_proxy_response_skips_soap_action_if_not_included(
    enable_factory_create, monkeypatch, db_session
):
    soap_request = create_soap_request(SOAP_PAYLOAD, with_soap_action=False)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send:
        get_proxy_response(soap_request)
        assert mock_send.call_args_list[0][0][0].headers.get(REQUEST_SOAP_ACTION_KEY, "") == ""


@freeze_time("2024-04-03 12:00:00", tz_offset=0)
def test_get_soap_jwt_auth_jwt(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    legacy_certificate = factories.LegacyAgencyCertificateFactory.create()
    config = get_soap_config()
    soap_client_certificate = SOAPClientCertificate(
        cert="x",
        fingerprint="1234",
        issuer="issuer_string",
        serial_number=legacy_certificate.serial_number,
        legacy_certificate=legacy_certificate,
        cert_id=legacy_certificate.cert_id,
    )
    s2s_partner_certid_jwt_b64 = get_soap_jwt_auth_jwt(
        config,
        soap_client_certificate,
    )
    decoded_base64 = base64.b64decode(s2s_partner_certid_jwt_b64).decode("utf-8")
    original_claims = jwt.decode(
        decoded_base64, key=config.soap_partner_gateway_auth_key, algorithms=["HS256"]
    )
    expected = {
        "sub": "partner_soap_call",
        "iss": f"{config.soap_partner_gateway_uri}",
        "exp": 1712145660,
        "certId": legacy_certificate.cert_id,
    }
    assert original_claims == expected
    assert "soap_client_certificate: created SOAP JWT" in caplog.messages


@freeze_time("2024-04-03 12:00:00", tz_offset=0)
def test_get_soap_jwt_auth_jwt_throws_exception_when_no_cert_id(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    legacy_certificate = factories.LegacyAgencyCertificateFactory.create()
    config = get_soap_config()
    soap_client_certificate = SOAPClientCertificate(
        cert="x",
        fingerprint="1234",
        issuer="issuer_string",
        serial_number=legacy_certificate.serial_number,
        legacy_certificate=legacy_certificate,
        cert_id=None,
    )
    with pytest.raises(SOAPClientMissingCertificate):
        get_soap_jwt_auth_jwt(
            config,
            soap_client_certificate,
        )
    assert "soap_client_certificate: No cert_id" in caplog.messages


def test_request_gets_correct_proxy_url_when_no_auth(enable_factory_create):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    soap_request.auth = None
    with patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response") as mock_request:
        get_proxy_response(soap_request)
        expected = "https://google.com/xyz/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
        assert mock_request.call_args_list[0][0][0].url == expected


def test_request_gets_correct_proxy_url_when_request_has_auth_for_grantors(enable_factory_create):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response") as mock_request:
        get_proxy_response(soap_request)
        config = get_soap_config()
        expected = f"{config.soap_partner_gateway_uri}/grantsws-agency-partner/services/v2/AgencyWebServicesSoapPort"
        assert mock_request.call_args_list[0][0][0].url == expected


def test_request_gets_correct_proxy_url_when_request_has_auth_for_applicants(enable_factory_create):
    soap_payload = """
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <app:GetOpportunityListRequest>
     <gran:PackageID>PKG00116771</gran:PackageID>
      </app:GetOpportunityListRequest>
   </soapenv:Body>
</soapenv:Envelope>
""".encode()
    soap_request = create_soap_request(
        soap_payload,
        operation_name="GetOpportunityList",
        full_path="/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort",
        api_name=SimplerSoapAPI.APPLICANTS,
    )
    with patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response") as mock_request:
        get_proxy_response(soap_request)
        config = get_soap_config()
        expected = f"{config.soap_partner_gateway_uri}/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"
        assert mock_request.call_args_list[0][0][0].url == expected


def test_request_gets_correct_proxy_headers_when_no_auth(enable_factory_create):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    soap_request.auth = None
    soap_request.headers = {"X-Gg-S2S-Uri": "https://google.com/xyz", "x": "1"}
    config = get_soap_config()
    headers = get_proxy_headers(soap_request, config, soap_request.auth)
    expected = {"x": "1"}
    assert headers == expected


def test_request_gets_correct_proxy_headers_when_there_is_auth(enable_factory_create):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    config = get_soap_config()
    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.generate_soap_jwt"
    ) as mock_generate_soap_jwt:
        mock_generate_soap_jwt.return_value = "123456"
        headers = get_proxy_headers(soap_request, config, soap_request.auth)
        expected = {"S2S_PARTNER_CERTID_JWT_B64": "MTIzNDU2"}
        assert headers == expected


def test_request_logs_locally(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD, log_local=True)
    config = get_soap_config()
    config.enable_verbose_logging = True
    response_bytes = (
        b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>"
        b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"
    )
    with patch("src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response") as mock_get_response:
        mock_get_response.return_value.to_bytes.return_value = response_bytes
        get_proxy_response(soap_request)
        assert f"\nsoap jwt proxy response:\n{response_bytes.decode('utf-8')}" in caplog.messages
