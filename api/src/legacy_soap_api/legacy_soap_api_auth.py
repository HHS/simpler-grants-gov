import logging
import ssl
from typing import Any
from urllib.parse import unquote

from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate
from requests.adapters import HTTPAdapter

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPAuth, SOAPClientCertificate
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

MTLS_CERT_HEADER_KEY = "X-Amzn-Mtls-Clientcert"


class SessionResumptionAdapter(HTTPAdapter):
    def init_poolmanager(self, *args: Any, **kwargs: Any) -> None:
        # Create a fresh context with no session cache
        context = ssl.create_default_context()
        kwargs["ssl_context"] = context
        super().init_poolmanager(*args, **kwargs)


def get_soap_auth(mtls_cert: str | None) -> SOAPAuth | None:
    if not mtls_cert:
        logger.info("soap_client_certificate: no certificate receieved from header")
        return None

    logger.info("soap_client_certificate: certificate receieved header")
    auth = None
    try:
        auth = SOAPAuth(certificate=get_soap_client_certificate(mtls_cert))
        add_extra_data_to_current_request_logs(
            {
                "soap_client_certificate_serial_number": auth.certificate.serial_number,
            }
        )
        logger.info("soap_client_certificate: successfully extracted certificate and serial number")
    except Exception:
        logger.warning("soap_client_certificate: could not parse and extract serial number")
    return auth


def get_soap_client_certificate(urlencoded_cert: str) -> SOAPClientCertificate:
    cert_str = unquote(urlencoded_cert)
    serial_number = str(
        load_pem_x509_certificate(cert_str.encode(), default_backend()).serial_number
    )
    return SOAPClientCertificate(cert=cert_str, serial_number=serial_number)
