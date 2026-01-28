import logging
import os
from unittest.mock import ANY, MagicMock, patch

from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
)
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_proxy import get_cert_file, get_proxy_response
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest

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


def test_get_cert_file_returns_cert_data_from_soap_request():
    mock_cert_str = "-----BEGIN CERTIFICATE-----\nFAKE_CERT\n-----END CERTIFICATE-----"
    mock_soap_request = MagicMock(spec=SOAPRequest)
    mock_soap_request.headers = {}
    mock_soap_request.full_path = "/grantors/x"
    mock_soap_request.data = SOAP_PAYLOAD
    mock_soap_request.auth = MagicMock()
    mock_soap_request.auth.certificate.get_pem.return_value = mock_cert_str

    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as _, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_config"
    ) as mock_get_config:
        mock_config = MagicMock(spec=LegacySoapAPIConfig)
        mock_config.gg_url = "https://grants.gov"
        mock_config.gg_s2s_proxy_header_key = "X-Gg-S2S-Uri"
        mock_config.soap_auth_map = {"test": "config"}
        mock_get_config.return_value = mock_config

        tmp = get_cert_file(mock_soap_request.auth, mock_config)

        assert os.path.exists(tmp.name) is True
        with open(tmp.name) as f:
            assert f.read() == mock_cert_str


def test_get_proxy_response():
    mock_cert_str = "-----BEGIN CERTIFICATE-----\nFAKE_CERT\n-----END CERTIFICATE-----"
    mock_soap_request = MagicMock(spec=SOAPRequest)
    mock_soap_request.headers = {}
    mock_soap_request.full_path = "/grantors/x"
    mock_soap_request.data = SOAP_PAYLOAD
    mock_soap_request.auth = MagicMock()
    mock_soap_request.auth.certificate.get_pem.return_value = mock_cert_str

    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_config"
    ) as mock_get_config:

        mock_config = MagicMock(spec=LegacySoapAPIConfig)
        mock_config.gg_url = "https://grants.gov"
        mock_config.gg_s2s_proxy_header_key = "X-Gg-S2S-Uri"
        mock_config.soap_auth_map = {"test": "config"}
        mock_get_config.return_value = mock_config

        get_proxy_response(mock_soap_request)

        args, kwargs = mock_send.call_args
        cert_path = kwargs.get("cert")
        assert os.path.exists(cert_path) is False
        mock_send.assert_called_once_with(ANY, stream=True, cert=cert_path, timeout=3600)


def test_get_proxy_response_logs_soap_client_lookup_error_and_returns_proxy_response(caplog):
    caplog.set_level(logging.INFO)
    mock_cert_str = "-----BEGIN CERTIFICATE-----\nFAKE_CERT\n-----END CERTIFICATE-----"
    mock_soap_request = MagicMock(spec=SOAPRequest)
    mock_soap_request.headers = {}
    mock_soap_request.full_path = "/grantors/x"
    mock_soap_request.data = SOAP_PAYLOAD
    mock_soap_request.auth = MagicMock()
    mock_soap_request.auth.certificate.get_pem.return_value = mock_cert_str

    with patch("src.legacy_soap_api.legacy_soap_api_proxy.Session.send") as mock_send, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_config"
    ) as mock_get_config, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_cert_file"
    ) as mock_cert_file:

        mock_config = MagicMock(spec=LegacySoapAPIConfig)
        mock_config.gg_url = "https://grants.gov"
        mock_config.gg_s2s_proxy_header_key = "X-Gg-S2S-Uri"
        mock_config.soap_auth_map = {"test": "config"}
        mock_get_config.return_value = mock_config

        mock_cert_file.side_effect = SOAPClientCertificateLookupError()

        get_proxy_response(mock_soap_request)
        assert "soap_client_certificate: Unknown or invalid client certificate" in caplog.messages
        mock_send.assert_called_once_with(ANY, stream=True, cert="", timeout=3600)


def test_get_proxy_response_logs_soap_client_certificate_not_configured_error_and_returns_error_response(
    caplog,
):
    caplog.set_level(logging.INFO)
    mock_cert_str = "-----BEGIN CERTIFICATE-----\nFAKE_CERT\n-----END CERTIFICATE-----"
    mock_soap_request = MagicMock(spec=SOAPRequest)
    mock_soap_request.headers = {}
    mock_soap_request.full_path = "/grantors/x"
    mock_soap_request.data = SOAP_PAYLOAD
    mock_soap_request.auth = MagicMock()
    mock_soap_request.auth.certificate.get_pem.return_value = mock_cert_str

    with patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_error_response"
    ) as mock_error_response, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_soap_config"
    ) as mock_get_config, patch(
        "src.legacy_soap_api.legacy_soap_api_proxy.get_cert_file"
    ) as mock_cert_file:

        mock_config = MagicMock(spec=LegacySoapAPIConfig)
        mock_config.gg_url = "https://grants.gov"
        mock_config.gg_s2s_proxy_header_key = "X-Gg-S2S-Uri"
        mock_config.soap_auth_map = {"test": "config"}
        mock_get_config.return_value = mock_config

        mock_cert_file.side_effect = SOAPClientCertificateNotConfigured()

        get_proxy_response(mock_soap_request)
        assert (
            "soap_client_certificate: Certificate validated but not configured" in caplog.messages
        )
        mock_error_response.assert_called_once_with(
            faultstring="Client certificate not configured for Simpler SOAP."
        )
