import logging
import ssl
from typing import Any
from urllib.parse import unquote

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.x509 import load_pem_x509_certificate
from pydantic import BaseModel
from requests.adapters import HTTPAdapter

from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent

logger = logging.getLogger(__name__)

MTLS_CERT_HEADER_KEY = "X-Amzn-Mtls-Clientcert"


class SOAPClientCertificateNotConfigured(Exception):
    pass


class SOAPClientCertificateLookupError(Exception):
    pass


class SOAPClientCertificate(BaseModel):
    cert: str
    serial_number: int
    fingerprint: str

    def get_pem(self, key_map: dict) -> str:
        """Note that this auth mechanism will only be configured in lower environments

        There will be no prod configurations for this auth mechanism.
        """
        try:
            return f"{key_map[self.fingerprint]}\n\n{self.cert}"
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


def get_soap_auth(mtls_cert: str | None) -> SOAPAuth | None:
    if not mtls_cert:
        logger.info(
            "soap_client_certificate: no certificate received from header",
            extra={"soap_api_event": LegacySoapApiEvent.NO_HEADER_CERT},
        )
        return None

    logger.info("soap_client_certificate: certificate received header")
    auth = None
    try:
        auth = SOAPAuth(certificate=get_soap_client_certificate(mtls_cert))
        logger.info("soap_client_certificate: successfully extracted certificate and serial number")
    except Exception:
        logger.info(
            "soap_client_certificate: could not parse and extract serial number",
            exc_info=True,
            extra={"soap_api_event": LegacySoapApiEvent.UNPARSEABLE_CERT},
        )
    return auth


def get_soap_client_certificate(urlencoded_cert: str) -> SOAPClientCertificate:
    cert_str = unquote(urlencoded_cert)
    cert = load_pem_x509_certificate(cert_str.encode(), default_backend())
    return SOAPClientCertificate(
        cert=cert_str,
        fingerprint=cert.fingerprint(hashes.SHA256()).hex(),
        issuer=cert.issuer.rfc4514_string(),
        serial_number=cert.serial_number,
    )
