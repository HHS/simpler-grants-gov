import logging
from datetime import date, timedelta

import grants_shared.util.datetime_util as datetime_util
import pytest

from src.constants.lookup_constants import Privilege
from src.legacy_soap_api.legacy_soap_api_auth import (
    SOAPAuth,
    SOAPClientCertificate,
    SOAPClientCertificateIsExpired,
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
    SOAPClientMissingCertificate,
    SOAPClientTcertificateNotFound,
    SOAPClientUserDoesNotHavePermission,
    get_legacy_certificate_by_serial_number,
    get_soap_auth,
    validate_certificate,
    verify_certificate_access,
)
from src.legacy_soap_api.legacy_soap_api_config import (
    GRANTOR_SOAP_ACTION_PATH,
    SimplerSoapAPI,
    SOAPOperationConfig,
)
from tests.lib.data_factories import get_mtls_urlencoded_str_and_serial_number, setup_cert_user
from tests.src.db.models.factories import (
    AgencyFactory,
    LegacyAgencyCertificateFactory,
    StagingTcertificatesFactory,
)

MOCK_FINGERPRINT = "123"
MOCK_CERT = "456"
MOCK_CERT_STR = "certstr"
UTC_NOW = datetime_util.utcnow()


class AlternateErrorDict(dict):
    def __getitem__(self, key):
        try:
            return super().__getitem__(key)
        except KeyError as e:
            raise Exception("Not a KeyError") from e


def test_get_legacy_certificate_search_ignores_case_in_serial_number(
    db_session, enable_factory_create
):
    SERIAL_NUMBER = "000000000000ABBBBBCCCCCCCCC12210"
    legacy_certificate = LegacyAgencyCertificateFactory.create(serial_number=SERIAL_NUMBER.upper())
    result = get_legacy_certificate_by_serial_number(
        db_session, serial_number=SERIAL_NUMBER.lower()
    )
    assert result is not None
    assert result.legacy_certificate_id == legacy_certificate.legacy_certificate_id


def test_client_auth(db_session, enable_factory_create):
    legacy_certificate = LegacyAgencyCertificateFactory.create()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number=legacy_certificate.serial_number,
        legacy_certificate=legacy_certificate,
    )
    MOCK_SOAP_PRIVATE_KEYS = {f"{legacy_certificate.legacy_certificate_id}": MOCK_CERT}
    auth = SOAPAuth(certificate=mock_client_cert)
    cert = auth.certificate.get_pem(MOCK_SOAP_PRIVATE_KEYS)
    assert cert == f"{MOCK_CERT}\n\n{MOCK_CERT_STR}"


def test_client_auth_exceptions(db_session, enable_factory_create):
    legacy_certificate = LegacyAgencyCertificateFactory.create()
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number=legacy_certificate.serial_number,
        legacy_certificate=legacy_certificate,
    )
    auth = SOAPAuth(certificate=mock_client_cert)
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({})
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({"dne": "dne"})
    with pytest.raises(SOAPClientCertificateNotConfigured, match="cert is not configured"):
        auth.certificate.get_pem({MOCK_FINGERPRINT: {"id": "abc"}})
    with pytest.raises(
        SOAPClientCertificateLookupError, match="could not retrieve client cert for serial number"
    ):
        auth.certificate.get_pem(AlternateErrorDict({MOCK_FINGERPRINT: "not-an-object"}))
    mock_client_cert = SOAPClientCertificate(
        cert=MOCK_CERT_STR,
        fingerprint=MOCK_FINGERPRINT,
        serial_number=legacy_certificate.serial_number,
        legacy_certificate=None,
    )
    auth = SOAPAuth(certificate=mock_client_cert)
    with pytest.raises(
        SOAPClientCertificateLookupError, match="could not retrieve legacy cert for serial number"
    ):
        auth.certificate.get_pem({MOCK_FINGERPRINT: "not-an-object"})


def test_validate_certificate_raises_error_when_no_legacy_certificate_found(
    enable_factory_create, fixture_from_file, db_session
) -> None:
    soap_auth = SOAPAuth(
        certificate={
            "cert": "MOCKED_CERT_STRING_HERE",
            "serial_number": "7000",
            "fingerprint": "MOCKED_FINGERPRINT",
            "legacy_certificate": None,
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
            "legacy_certificate": legacy_certificate,
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
            "legacy_certificate": legacy_certificate,
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
            "legacy_certificate": legacy_certificate,
        }
    )
    result = validate_certificate(db_session, soap_auth, SimplerSoapAPI.APPLICANTS)
    assert result.legacy_certificate_id == legacy_certificate.legacy_certificate_id


def test_validate_certificate_raises_error_if_not_soap_auth(
    enable_factory_create, db_session
) -> None:
    with pytest.raises(SOAPClientCertificateLookupError, match="no soap auth"):
        validate_certificate(db_session, None, SimplerSoapAPI.GRANTORS)


def test_verify_certificate_access_fails_if_there_is_no_agency(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    agency = AgencyFactory.create()
    _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
    legacy_certificate = soap_client_certificate.legacy_certificate
    assert legacy_certificate
    soap_config = SOAPOperationConfig(
        request_operation_name="GetSubmissionListExpandedRequest",
        response_operation_name="GetSubmissionListExpandedResponse",
        privileges={Privilege.LEGACY_AGENCY_VIEWER},
        soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/UpdateApplicationInfo",
    )
    with pytest.raises(SOAPClientUserDoesNotHavePermission, match="Agency cannot be None"):
        verify_certificate_access(legacy_certificate, soap_config, None)
    records = [r for r in caplog.records if "Agency cannot be None" in r.message]
    assert len(records) == 1


def test_verify_certificate_access_fails_if_there_are_no_privileges_set(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    agency = AgencyFactory.create()
    _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
    legacy_certificate = soap_client_certificate.legacy_certificate
    assert legacy_certificate
    soap_config = SOAPOperationConfig(
        request_operation_name="GetSubmissionListExpandedRequest",
        response_operation_name="GetSubmissionListExpandedResponse",
        privileges=None,
        soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetSubmissionListExpanded",
    )
    with pytest.raises(SOAPClientUserDoesNotHavePermission, match="Soap Config privileges not set"):
        verify_certificate_access(
            legacy_certificate,
            soap_config,
            agency,
        )
    records = [r for r in caplog.records if "Soap Config privileges not set" in r.message]
    assert len(records) == 1


def test_verify_certificate_access_fails_if_users_do_not_have_privileges(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    agency = AgencyFactory.create()
    _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.MANAGE_ORG_MEMBERS})
    legacy_certificate = soap_client_certificate.legacy_certificate
    assert legacy_certificate
    soap_config = SOAPOperationConfig(
        request_operation_name="GetSubmissionListExpandedRequest",
        response_operation_name="GetSubmissionListExpandedResponse",
        privileges={Privilege.LEGACY_AGENCY_VIEWER},
        soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetSubmissionListExpanded",
    )
    with pytest.raises(
        SOAPClientUserDoesNotHavePermission,
        match="User did not have permission to access this application",
    ):
        verify_certificate_access(
            legacy_certificate,
            soap_config,
            agency,
        )
    records = [
        r
        for r in caplog.records
        if "User did not have permission to access this application" in r.message
    ]
    assert len(records) == 1


def test_verify_certificate_access_does_not_raise_exception_if_user_has_correct_privileges(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    agency = AgencyFactory.create()
    _, _, soap_client_certificate, _ = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
    legacy_certificate = soap_client_certificate.legacy_certificate
    assert legacy_certificate
    soap_config = SOAPOperationConfig(
        request_operation_name="GetSubmissionListExpandedRequest",
        response_operation_name="GetSubmissionListExpandedResponse",
        privileges={Privilege.LEGACY_AGENCY_VIEWER},
        soap_action=f"{GRANTOR_SOAP_ACTION_PATH}/GetSubmissionListExpanded",
    )
    verify_certificate_access(
        legacy_certificate,
        soap_config,
        agency,
    )


def test_get_soap_auth_when_no_cert_sent(db_session, caplog) -> None:
    caplog.set_level(logging.INFO)
    with pytest.raises(SOAPClientMissingCertificate):
        get_soap_auth(None, db_session)
    records = [
        r
        for r in caplog.records
        if "soap_client_certificate: no certificate received from header" in r.message
    ]
    assert len(records) == 1


def test_get_soap_auth_when_no_tcertificate(db_session, caplog) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, _ = get_mtls_urlencoded_str_and_serial_number()
    with pytest.raises(SOAPClientTcertificateNotFound):
        get_soap_auth(mtls_cert, db_session)
    records = [r for r in caplog.records if "soap_client_certificate: no tcertificate" in r.message]
    assert len(records) == 1


def test_get_soap_auth_when_tcertificate_is_expired(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcert = StagingTcertificatesFactory(serial_num=serial_number, expirationdate=date(2000, 1, 1))
    with pytest.raises(SOAPClientCertificateIsExpired):
        get_soap_auth(mtls_cert, db_session)
    record = next(
        r for r in caplog.records if "soap_client_certificate: tcertificate is expired" in r.message
    )
    assert record is not None
    assert record.tcertificates_id == tcert.tcertificates_id


def test_get_soap_auth_logs_tcertificate(enable_factory_create, db_session, caplog) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcert = StagingTcertificatesFactory.create(
        serial_num=serial_number, expirationdate=(UTC_NOW + timedelta(days=100)).date()
    )
    LegacyAgencyCertificateFactory.create(
        serial_number=tcert.serial_num, expiration_date=date(2000, 1, 1)
    )
    with pytest.raises(SOAPClientCertificateIsExpired):
        get_soap_auth(mtls_cert, db_session)
    record = next(
        r
        for r in caplog.records
        if "soap_client_certificate: valid tcertificate located" in r.message
    )
    assert record is not None
    assert record.tcertificates_id == tcert.tcertificates_id


def test_get_soap_auth_when_legacy_certificate_is_expired(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcert = StagingTcertificatesFactory.create(
        serial_num=serial_number, expirationdate=(UTC_NOW + timedelta(days=100)).date()
    )
    LegacyAgencyCertificateFactory.create(
        serial_number=tcert.serial_num, expiration_date=date(2000, 1, 1)
    )
    with pytest.raises(SOAPClientCertificateIsExpired):
        get_soap_auth(mtls_cert, db_session)
    records = [
        r
        for r in caplog.records
        if "soap_client_certificate: LegacyCertificate is expired" in r.message
    ]
    assert len(records) == 1


def test_get_soap_auth_with_valid_tcertificate(enable_factory_create, db_session, caplog) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcertificate = StagingTcertificatesFactory.create(
        serial_num=serial_number, expirationdate=(UTC_NOW + timedelta(days=100)).date()
    )
    soap_auth = get_soap_auth(mtls_cert, db_session)
    assert soap_auth
    assert soap_auth.certificate.legacy_certificate is None
    assert soap_auth.certificate.cert_id is tcertificate.currentcertid
    records = [
        r for r in caplog.records if "soap_client_certificate: no LegacyCertificate" in r.message
    ]
    assert len(records) == 1


def test_get_soap_auth_with_valid_tcertificate_and_valid_legacy_certificate(
    enable_factory_create, db_session, caplog
) -> None:
    caplog.set_level(logging.INFO)
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcertificate = StagingTcertificatesFactory.create(
        serial_num=serial_number, expirationdate=(UTC_NOW + timedelta(days=100)).date()
    )
    legacy_certificate = LegacyAgencyCertificateFactory.create(
        cert_id=tcertificate.currentcertid,
        serial_number=tcertificate.serial_num,
        expiration_date=tcertificate.expirationdate,
    )
    soap_auth = get_soap_auth(mtls_cert, db_session)
    assert soap_auth
    assert soap_auth.certificate.legacy_certificate is legacy_certificate
    assert soap_auth.certificate.cert_id is legacy_certificate.cert_id
    records = [
        r
        for r in caplog.records
        if "soap_client_certificate: certificate received header" in r.message
    ]
    assert len(records) == 1
