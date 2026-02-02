import logging
import ssl
from typing import Any
from urllib.parse import unquote

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.x509 import load_pem_x509_certificate
from pydantic import BaseModel, ConfigDict
from requests.adapters import HTTPAdapter
from sqlalchemy import select

import src.adapters.db as db
from src.db.models.user_models import LegacyCertificate
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)

MTLS_CERT_HEADER_KEY = "X-Amzn-Mtls-Clientcert"


class SOAPClientCertificateNotConfigured(Exception):
    pass


class SOAPClientCertificateLookupError(Exception):
    pass


class SOAPClientCertificate(BaseModel):
    cert: str
    serial_number: str
    fingerprint: str
    legacy_certificate: LegacyCertificate | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def get_pem(self, key_map: dict) -> str:
        """Fetch the PEM from our pre-defined env var

        NOTE: Needing to manually define private keys is something
        we should be able to remove once MicroHealth adjusts their
        SOAP endpoints, we expect that sometime in early 2026, and
        then this should not be needed.
        """
        if not self.legacy_certificate:
            raise SOAPClientCertificateLookupError(
                "could not retrieve legacy cert for serial number"
            ) from None
        try:
            value = key_map[str(self.legacy_certificate.legacy_certificate_id)]
            return f"{value}\n\n{self.cert}"
        except KeyError:
            raise SOAPClientCertificateNotConfigured("cert is not configured") from None
        except Exception:
            raise SOAPClientCertificateLookupError(
                "could not retrieve client cert for serial number"
            ) from None


class SOAPAuth(BaseModel):
    certificate: SOAPClientCertificate


class SessionResumptionAdapter(HTTPAdapter):
    """
    This request adapter prevents session resumption at the ssl layer.

    Session resumption must be disabled for outbound requests to existing GG
    SOAP api proxy requests due to how we will handle auth.
    """

    def init_poolmanager(self, *args: Any, **kwargs: Any) -> None:
        context = ssl.create_default_context()
        kwargs["ssl_context"] = context
        super().init_poolmanager(*args, **kwargs)


def get_soap_auth(mtls_cert: str | None, db_session: db.Session) -> SOAPAuth | None:
    if not mtls_cert:
        logger.info(
            "soap_client_certificate: no certificate received from header",
            extra={"soap_api_event": LegacySoapApiEvent.NO_HEADER_CERT},
        )
        return None

    logger.info("soap_client_certificate: certificate received header")
    auth = None
    try:
        auth = SOAPAuth(certificate=get_soap_client_certificate(mtls_cert, db_session))
        logger.info(
            "soap_client_certificate: successfully extracted certificate and serial number",
            extra={"soap_api_event": LegacySoapApiEvent.PARSED_CERT},
        )
    except Exception:
        logger.info(
            "soap_client_certificate: could not parse and extract serial number",
            exc_info=True,
            extra={"soap_api_event": LegacySoapApiEvent.UNPARSEABLE_CERT},
        )
    return auth


def get_soap_client_certificate(
    urlencoded_cert: str, db_session: db.Session
) -> SOAPClientCertificate:
    cert_str = unquote(urlencoded_cert)
    cert = load_pem_x509_certificate(cert_str.encode(), default_backend())
    serial_number_hex = format(int(cert.serial_number), "032x")
    legacy_certificate = db_session.execute(
        select(LegacyCertificate).where(LegacyCertificate.serial_number == str(serial_number_hex))
    ).scalar_one_or_none()
    if legacy_certificate:
        add_extra_data_to_current_request_logs(
            {
                "legacy_certificate_id": legacy_certificate.legacy_certificate_id,
            }
        )
        if legacy_certificate.agency:
            add_extra_data_to_current_request_logs(
                {
                    "agency_code": legacy_certificate.agency.agency_code,
                }
            )

    return SOAPClientCertificate(
        cert=cert_str,
        fingerprint=cert.fingerprint(hashes.SHA256()).hex(),
        issuer=cert.issuer.rfc4514_string(),
        serial_number=str(serial_number_hex),
        legacy_certificate=legacy_certificate,
    )


def validate_certificate(
    db_session: db.Session, soap_auth: SOAPAuth | None, api_name: str
) -> LegacyCertificate:
    if not soap_auth:
        logger.warning(
            "soap_client_certificate: no soap auth",
        )
        raise SOAPClientCertificateLookupError("no soap auth")

    legacy_certificate = soap_auth.certificate.legacy_certificate

    if not legacy_certificate:
        logger.warning(
            "soap_client_certificate: could not retrieve client cert for serial number",
        )
        raise SOAPClientCertificateLookupError("could not retrieve client cert for serial number")

    extra_data = {"legacy_certificate_id": legacy_certificate.legacy_certificate_id}
    if legacy_certificate.expiration_date <= get_now_us_eastern_date():
        logger.warning(
            "soap_client_certificate: certificate is expired",
            extra=extra_data,
        )
        raise SOAPClientCertificateLookupError("certificate is expired")

    if not legacy_certificate.agency and api_name == SimplerSoapAPI.GRANTORS:
        logger.warning(
            "soap_client_certificate: certificate does not have agency",
            extra=extra_data,
        )
        raise SOAPClientCertificateLookupError("certificate does not have agency")

    return legacy_certificate
