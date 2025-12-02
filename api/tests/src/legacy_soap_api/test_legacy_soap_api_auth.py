from datetime import date
from unittest.mock import patch

import pytest

from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPAuth,
    SOAPClientCertificate,
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
    get_soap_auth,
    validate_certificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from tests.src.db.models.factories import LegacyAgencyCertificateFactory

MOCK_FINGERPRINT = "123"
MOCK_CERT = "456"
MOCK_KEYMAP = {MOCK_FINGERPRINT: {"id": "XYZ", "cert": MOCK_CERT}}
MOCK_CERT_STR = "certstr"
MOCK_CLIENT_CERT = SOAPClientCertificate(
    cert=MOCK_CERT_STR,
    fingerprint=MOCK_FINGERPRINT,
    serial_number=123,
)


class AlternateErrorDict(dict):
    def __getitem__(self, key):
        try:
            return super().__getitem__(key)
        except KeyError as e:
            raise Exception("Not a KeyError") from e


@patch("src.legacy_soap_api.legacy_soap_api_auth.get_soap_client_certificate")
def test_get_soap_auth(mock_get_soap_client_certificate):
    mock_get_soap_client_certificate.return_value = MOCK_CLIENT_CERT
    assert get_soap_auth(MOCK_CERT_STR) == SOAPAuth(certificate=MOCK_CLIENT_CERT)
    assert get_soap_auth(None) is None


def test_client_auth(db_session, enable_factory_create):
    legacy_certificate = LegacyAgencyCertificateFactory.create(
        serial_number=MOCK_CLIENT_CERT.serial_number
    )
    MOCK_SOAP_PRIVATE_KEYS = {f"{legacy_certificate.legacy_certificate_id}": MOCK_CERT}
    auth = SOAPAuth(certificate=MOCK_CLIENT_CERT)
    cert = auth.certificate.get_pem(MOCK_SOAP_PRIVATE_KEYS, db_session)
    assert cert == f"{MOCK_CERT}\n\n{MOCK_CERT_STR}"


def test_client_auth_exceptions(db_session):
    auth = SOAPAuth(certificate=MOCK_CLIENT_CERT)
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({}, db_session)
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({"dne": "dne"}, db_session)
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({MOCK_FINGERPRINT: {"id": "abc"}}, db_session)
    with pytest.raises(
        SOAPClientCertificateLookupError, match="could not retrieve client cert for serial number"
    ):
        auth.certificate.get_pem(
            AlternateErrorDict({MOCK_FINGERPRINT: "not-an-object"}), db_session
        )
    alt_mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number=456,
    )
    auth = SOAPAuth(certificate=alt_mock_client_cert)
    with pytest.raises(
        SOAPClientCertificateLookupError, match="could not retrieve legacy cert for serial number"
    ):
        auth.certificate.get_pem({MOCK_FINGERPRINT: "not-an-object"}, db_session)


def test_validate_certificate_raies_error_when_no_legacy_certificate_found(
    enable_factory_create, fixture_from_file, db_session
) -> None:
    soap_auth = SOAPAuth(
        certificate={
            "cert": "MOCKED_CERT_STRING_HERE",
            "serial_number": "7000",
            "fingerprint": "MOCKED_FINGERPRINT",
        }
    )
    with pytest.raises(
        SOAPClientCertificateLookupError, match="could not retrieve client cert for serial number"
    ):
        validate_certificate(db_session, soap_auth, SimplerSoapAPI.GRANTORS)


def test_validate_certificate_raises_error_when_certificate_expired(
    enable_factory_create, db_session
) -> None:
    legacy_certificate = LegacyAgencyCertificateFactory.create(
        expiration_date=date(2004, 1, 1), agency=None, agency_id=None
    )
    soap_auth = SOAPAuth(
        certificate={
            "cert": "MOCKED_CERT_STRING_HERE",
            "serial_number": f"{legacy_certificate.serial_number}",
            "fingerprint": "MOCKED_FINGERPRINT",
        }
    )
    with pytest.raises(SOAPClientCertificateLookupError, match="certificate is expired"):
        validate_certificate(db_session, soap_auth, SimplerSoapAPI.GRANTORS)


def test_validate_certificate_raises_error_when_certificate_has_no_agency_when_grantor(
    enable_factory_create, db_session
) -> None:
    legacy_certificate = LegacyAgencyCertificateFactory.create(agency=None, agency_id=None)
    soap_auth = SOAPAuth(
        certificate={
            "cert": "MOCKED_CERT_STRING_HERE",
            "serial_number": f"{legacy_certificate.serial_number}",
            "fingerprint": "MOCKED_FINGERPRINT",
        }
    )
    with pytest.raises(SOAPClientCertificateLookupError, match="certificate does not have agency"):
        validate_certificate(db_session, soap_auth, SimplerSoapAPI.GRANTORS)


def test_validate_certificate_does_not_raise_agency_error_when_certificate_has_no_agency_when_applicant(
    enable_factory_create, db_session
) -> None:
    legacy_certificate = LegacyAgencyCertificateFactory.create(agency=None, agency_id=None)
    soap_auth = SOAPAuth(
        certificate={
            "cert": "MOCKED_CERT_STRING_HERE",
            "serial_number": f"{legacy_certificate.serial_number}",
            "fingerprint": "MOCKED_FINGERPRINT",
        }
    )
    result = validate_certificate(db_session, soap_auth, SimplerSoapAPI.APPLICANTS)
    assert result.legacy_certificate_id == legacy_certificate.legacy_certificate_id


def test_validate_certificate_raises_error_if_not_soap_auth(
    enable_factory_create, db_session
) -> None:
    with pytest.raises(SOAPClientCertificateLookupError, match="no soap auth"):
        validate_certificate(db_session, None, SimplerSoapAPI.GRANTORS)
