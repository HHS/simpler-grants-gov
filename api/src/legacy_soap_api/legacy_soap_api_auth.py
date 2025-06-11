import logging
from typing import Any, Callable
from urllib.parse import unquote

from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate
from flask import request

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPAuth, SOAPClientCertificate
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

MTLS_CERT_HEADER_KEY = "X-Amzn-Mtls-Clientcert"


def with_soap_auth() -> Callable:
    """
    This wrapper injects the client certificate necessary for invoking soap requests to
    the proxy that require authentication.

    If the certificate is not included, the certificate will be none in the SOAPAuth object.
    """

    def decorator(func) -> Callable:
        def wrapper(*args, **kwargs) -> Any:
            cert_header_value = request.headers.get(MTLS_CERT_HEADER_KEY, "")
            if not cert_header_value:
                logger.info(
                    f"soap_client_certificate: no certificate receieved from {MTLS_CERT_HEADER_KEY} header"
                )
                kwargs["soap_auth"] = SOAPAuth()
                return func(*args, **kwargs)

            logger.info(
                f"soap_client_certificate: certificate receieved from {MTLS_CERT_HEADER_KEY} header"
            )
            soap_auth = SOAPAuth(certificate=get_soap_client_certificate(cert_header_value))
            logger.info(
                "soap_client_certificate: successfully extracted certificate and serial number"
            )
            add_extra_data_to_current_request_logs(
                {
                    "soap_client_certificate_serial_number": soap_auth.certificate.serial_number,
                }
            )
            kwargs["soap_auth"] = soap_auth
            return func(*args, **kwargs)

        return wrapper

    return decorator


def get_soap_client_certificate(urlencoded_cert: str) -> SOAPClientCertificate:
    cert_str = unquote(urlencoded_cert)
    serial_number = str(
        load_pem_x509_certificate(cert_str.encode(), default_backend()).serial_number
    )
    return SOAPClientCertificate(cert=cert_str, serial_number=serial_number)
