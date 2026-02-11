import base64
import logging
import os
from unittest.mock import ANY, patch

import jwt
from freezegun import freeze_time

import tests.src.db.models.factories as factories
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
)
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig, get_soap_config
from src.legacy_soap_api.legacy_soap_api_proxy import (
    get_cert_file,
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


def test_get_cert_file_returns_cert_data_from_soap_request(enable_factory_create):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    legacy_certificate = soap_request.auth.certificate.legacy_certificate
    cert_str = "-----BEGIN CERTIFICATE-----\nFAKE_CERT\n-----END CERTIFICATE-----"
    config = LegacySoapAPIConfig()
    config.soap_auth_map = {f"{legacy_certificate.legacy_certificate_id}": f"{cert_str}"}
    tmp = get_cert_file(soap_request.auth, config)
    assert os.path.exists(tmp.name) is True
    with open(tmp.name) as f:
        assert f.read() == f"{cert_str}\n\n{soap_request.auth.certificate.cert}"


def test_get_proxy_response(enable_factory_create, monkeypatch, db_session):
    soap_request = create_soap_request(SOAP_PAYLOAD)
    legacy_certificate = soap_request.auth.certificate.legacy_certificate
    with db_session.begin():
        legacy_certificate.legacy_certificate_id = "e57e1c7f-cf2e-455e-9db5-3e03650174a7"
        db_session.add(legacy_certificate)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send:
        get_proxy_response(soap_request)
        args, kwargs = mock_send.call_args
        cert_path = kwargs.get("cert")
        assert os.path.exists(cert_path) is False
        mock_send.assert_called_once_with(ANY, stream=True, cert=cert_path, timeout=3600)


def test_get_proxy_response_logs_soap_client_lookup_error_and_returns_proxy_response(
    caplog, enable_factory_create
):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD)
    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_cert_file"
    ) as mock_cert_file:
        mock_cert_file.side_effect = SOAPClientCertificateLookupError()
        get_proxy_response(soap_request)
        assert "soap_client_certificate: Unknown or invalid client certificate" in caplog.messages
        mock_send.assert_called_once_with(ANY, stream=True, cert="", timeout=3600)


def test_get_proxy_response_logs_soap_client_certificate_not_configured_error_and_returns_error_response(
    caplog, enable_factory_create
):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD)
    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_error_response"
    ) as mock_error_response, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_cert_file"
    ) as mock_cert_file:
        mock_cert_file.side_effect = SOAPClientCertificateNotConfigured()
        get_proxy_response(soap_request)
        assert (
            "soap_client_certificate: Certificate validated but not configured" in caplog.messages
        )
        mock_error_response.assert_called_once_with(
            faultstring="Client certificate not configured for Simpler SOAP."
        )


@freeze_time("2024-04-03 12:00:00", tz_offset=0)
def test_get_soap_jwt_auth_jwt(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    legacy_certificate = factories.LegacyAgencyCertificateFactory.create()
    config = get_soap_config()
    s2s_partner_certid_jwt_b64 = get_soap_jwt_auth_jwt(
        config,
        legacy_certificate,
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
def test_get_soap_jwt_auth_request_when_use_jwt_is_set_on_headers(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD, use_soap_jwt=True)
    legacy_certificate = soap_request.auth.certificate.legacy_certificate
    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response"
    ) as mock_get_soap_response:
        get_proxy_response(soap_request)
        encoded = mock_get_soap_response.call_args_list[0][0][0].headers.get(
            "S2S_PARTNER_CERTID_JWT_B64"
        )
        decoded_base64 = base64.b64decode(encoded).decode("utf-8")
        original_payload = jwt.decode(
            decoded_base64, key="soap_partner_gateway_auth_key", algorithms=["HS256"]
        )
        config = get_soap_config()
        expected = {
            "sub": "partner_soap_call",
            "iss": config.soap_partner_gateway_uri,
            "exp": 1712145660,
            "certId": legacy_certificate.cert_id,
        }
        assert original_payload == expected


@freeze_time("2024-04-03 12:00:00", tz_offset=0)
def test_request_with_jwt_is_created_when_use_soap_jwt_auth_is_flagged(
    enable_factory_create, caplog
):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD, use_soap_jwt=True)
    legacy_certificate = soap_request.auth.certificate.legacy_certificate
    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response"
    ) as mock_get_soap_response:
        get_proxy_response(soap_request)
        encoded = mock_get_soap_response.call_args_list[0][0][0].headers.get(
            "S2S_PARTNER_CERTID_JWT_B64"
        )
        decoded_base64 = base64.b64decode(encoded).decode("utf-8")
        original_payload = jwt.decode(
            decoded_base64, key="soap_partner_gateway_auth_key", algorithms=["HS256"]
        )
        config = get_soap_config()
        expected = {
            "sub": "partner_soap_call",
            "iss": config.soap_partner_gateway_uri,
            "exp": 1712145660,
            "certId": legacy_certificate.cert_id,
        }
        assert original_payload == expected
        assert "soap_client_certificate: created SOAP JWT" in caplog.messages
        assert (
            "soap_client_certificate: Sending soap request without client certificate"
            in caplog.messages
        )


def test_request_with_jwt_gets_correct_proxy_url(enable_factory_create, caplog):
    caplog.set_level(logging.INFO)
    soap_request = create_soap_request(SOAP_PAYLOAD, use_soap_jwt=True)
    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy._get_soap_response"
    ) as mock_get_soap_response:
        get_proxy_response(soap_request)
        config = get_soap_config()
        expected = f"{config.soap_partner_gateway_uri}/{soap_request.full_path.lstrip('/')}"
        assert mock_get_soap_response.call_args_list[0][0][0].url == expected
