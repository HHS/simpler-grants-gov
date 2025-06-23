from unittest.mock import patch

import pytest

from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPAuth,
    SOAPClientCertificate,
    SOAPClientCertificateNotConfigured,
    get_soap_auth,
)

MOCK_FINGERPRINT = "123"
MOCK_CERT = "456"
MOCK_KEYMAP = {MOCK_FINGERPRINT: MOCK_CERT}
MOCK_CERT_STR = "certstr"
MOCK_CLIENT_CERT = SOAPClientCertificate(
    cert=MOCK_CERT_STR,
    fingerprint=MOCK_FINGERPRINT,
    serial_number=123,
)


@patch("src.legacy_soap_api.legacy_soap_api_auth.get_soap_client_certificate")
def test_get_soap_auth(mock_get_soap_client_certificate):
    mock_get_soap_client_certificate.return_value = MOCK_CLIENT_CERT
    assert get_soap_auth(MOCK_CERT_STR) == SOAPAuth(certificate=MOCK_CLIENT_CERT)
    assert get_soap_auth(None) is None


def test_client_auth():
    auth = SOAPAuth(certificate=MOCK_CLIENT_CERT)
    assert auth.certificate.get_pem(MOCK_KEYMAP) == f"{MOCK_CERT}\n\n{MOCK_CERT_STR}"


def test_client_auth_exceptions():
    auth = SOAPAuth(certificate=MOCK_CLIENT_CERT)
    with pytest.raises(SOAPClientCertificateNotConfigured):
        auth.certificate.get_pem({})
    with pytest.raises(SOAPClientCertificateNotConfigured):
        auth.certificate.get_pem({"dne": "dne"})
