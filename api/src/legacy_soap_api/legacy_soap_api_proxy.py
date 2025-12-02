import logging
from os.path import join
from tempfile import NamedTemporaryFile

from requests import Request, Session

from src.adapters import db
from src.legacy_soap_api.legacy_soap_api_auth import (
    MTLS_CERT_HEADER_KEY,
    SessionResumptionAdapter,
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
)
from src.legacy_soap_api.legacy_soap_api_config import get_soap_config
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


def get_proxy_response(
    soap_request: SOAPRequest, db_session: db.Session, timeout: int = PROXY_TIMEOUT
) -> SOAPResponse:
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

    if not soap_request.auth or config.soap_auth_map == {}:
        logger.info(
            "soap_client_certificate: Sending soap request without client certificate",
            extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITHOUT_CERT},
        )
        return _get_soap_response(_request, timeout=timeout)

    logger.info("soap_client_certificate: Processing client certificate")
    # Handle cert based proxy request.
    with NamedTemporaryFile(mode="w", delete=True) as temp_cert_file:
        temp_file_path = temp_cert_file.name
        try:
            cert = soap_request.auth.certificate.get_pem(
                config.soap_auth_map, db_session=db_session
            )
        except SOAPClientCertificateLookupError:
            # This exception handles invalid client certs. We will continue to return the response
            # from GG.
            cert = ""
            logger.info(
                "soap_client_certificate: Unknown or invalid client certificate",
                exc_info=True,
                extra={"soap_api_event": LegacySoapApiEvent.UNKNOWN_INVALID_CLIENT_CERT},
            )
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

        temp_cert_file.write(cert)
        temp_cert_file.flush()

        logger.info(
            "soap_client_certificate: Sending soap request with client certificate",
            extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITH_CERT},
        )
        return _get_soap_response(_request, cert=temp_file_path, timeout=timeout)


def _get_soap_response(
    req: Request, cert: str | None = None, timeout: int = PROXY_TIMEOUT
) -> SOAPResponse:
    session = Session()
    session.mount("https://", SessionResumptionAdapter())
    prepared_request = session.prepare_request(req)
    return get_streamed_soap_response(
        session.send(prepared_request, stream=True, cert=cert, timeout=timeout)
    )
