import logging
import os
from os.path import join
from tempfile import NamedTemporaryFile, _TemporaryFileWrapper

from requests import Request, Session

from src.legacy_soap_api.legacy_soap_api_auth import (
    MTLS_CERT_HEADER_KEY,
    SessionResumptionAdapter,
    SOAPAuth,
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
)
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig, get_soap_config
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    filter_headers,
    get_soap_error_response,
    get_streamed_soap_response,
)

logger = logging.getLogger(__name__)

# Default proxy request timeout to 1hr
PROXY_TIMEOUT = 3600


def get_proxy_response(soap_request: SOAPRequest, timeout: int = PROXY_TIMEOUT) -> SOAPResponse:
    config = get_soap_config()

    # Use X-Gg-S2S-Uri header locally if passed, otherwise default to GRANTS_GOV_URI:GRANTS_GOV_PORT.
    proxy_url = join(
        soap_request.headers.get(config.gg_s2s_proxy_header_key, config.gg_url),
        soap_request.full_path.lstrip("/"),
    )

    # Exclude header keys that are utilized only in simpler soap api. Not needed for proxy request.
    proxy_headers = filter_headers(
        soap_request.headers, [config.gg_s2s_proxy_header_key, MTLS_CERT_HEADER_KEY]
    )

    _request = Request(method="POST", url=proxy_url, headers=proxy_headers, data=soap_request.data)
    soap_auth = soap_request.auth

    if not soap_auth or config.soap_auth_map == {}:
        logger.info(
            "soap_client_certificate: Sending soap request without client certificate",
            extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITHOUT_CERT},
        )
        return _get_soap_response(_request, timeout=timeout)

    logger.info("soap_client_certificate: Processing client certificate")
    # Handle cert based proxy request.
    temp_file_path = ""
    # We intentionally do not use a context manager for this file here
    # due to an issue with Python locking the file while open and
    # OpenSSL throwing a PEM error and is not able to read from it as a result
    # Issue discussed here:
    # https://github.com/python/cpython/issues/58451
    try:
        temp_cert_file = get_cert_file(soap_auth, config)
        temp_file_path = temp_cert_file.name
        return _get_soap_response(_request, cert=temp_file_path, timeout=timeout)
    except SOAPClientCertificateLookupError:
        # This exception handles invalid client certs. We will continue to return the response
        # from GG.
        logger.info(
            "soap_client_certificate: Unknown or invalid client certificate",
            exc_info=True,
            extra={"soap_api_event": LegacySoapApiEvent.UNKNOWN_INVALID_CLIENT_CERT},
        )
        return _get_soap_response(_request, cert=temp_file_path, timeout=timeout)
    except SOAPClientCertificateNotConfigured:
        # This exception handles the case of a valid cert being passed, but not configured
        # to use Simpler SOAP API.
        logger.info(
            "soap_client_certificate: Certificate validated but not configured",
            exc_info=True,
            extra={"soap_api_event": LegacySoapApiEvent.NOT_CONFIGURED_CERT},
        )
        return get_soap_error_response(
            faultstring="Client certificate not configured for Simpler SOAP."
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def get_cert_file(soap_auth: SOAPAuth, config: LegacySoapAPIConfig) -> _TemporaryFileWrapper:
    temp_cert_file = NamedTemporaryFile(mode="w", delete=False)
    cert = soap_auth.certificate.get_pem(config.soap_auth_map)
    temp_cert_file.write(cert)
    temp_cert_file.close()
    logger.info(
        "soap_client_certificate: Sending soap request with client certificate",
        extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITH_CERT},
    )
    return temp_cert_file


def _get_soap_response(
    req: Request, cert: str | None = None, timeout: int = PROXY_TIMEOUT
) -> SOAPResponse:
    session = Session()
    session.mount("https://", SessionResumptionAdapter())
    prepared_request = session.prepare_request(req)
    return get_streamed_soap_response(
        session.send(prepared_request, stream=True, cert=cert, timeout=timeout)
    )
