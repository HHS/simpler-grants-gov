import base64
import logging
from datetime import timedelta
from os.path import join
from tempfile import NamedTemporaryFile, _TemporaryFileWrapper

from grants_shared.util.datetime_util import utcnow
from requests import Request, Session

from src.legacy_soap_api.legacy_soap_api_auth import (
    LOG_LOCAL_RESPONSE_HEADER_KEY,
    MTLS_CERT_HEADER_KEY,
    S2S_PARTNER_CERTID_JWT_B64_HEADER_KEY,
    SessionResumptionAdapter,
    SOAPAuth,
    SOAPClientCertificate,
    SOAPClientMissingCertificate,
    generate_soap_jwt,
)
from src.legacy_soap_api.legacy_soap_api_config import (
    LegacySoapAPIConfig,
    SimplerSoapAPI,
    get_soap_config,
)
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    filter_headers,
    get_streamed_soap_response,
    log_local,
)

logger = logging.getLogger(__name__)

# Default proxy request timeout to 1hr
PROXY_TIMEOUT = 3600


def get_proxy_headers(
    soap_request: SOAPRequest,
    config: LegacySoapAPIConfig,
    soap_auth: SOAPAuth | None,
) -> dict:
    # Exclude header keys that are utilized only in simpler soap api. Not needed for proxy request.
    filtered_headers = filter_headers(
        soap_request.headers, [config.gg_s2s_proxy_header_key, MTLS_CERT_HEADER_KEY]
    )
    if not soap_auth:
        return filtered_headers
    proxy_headers = {
        S2S_PARTNER_CERTID_JWT_B64_HEADER_KEY: get_soap_jwt_auth_jwt(config, soap_auth.certificate),
        **filtered_headers,
    }
    return proxy_headers


def get_proxy_response(soap_request: SOAPRequest, timeout: int = PROXY_TIMEOUT) -> SOAPResponse:
    config = get_soap_config()

    soap_auth = soap_request.auth
    should_log_response = soap_request.headers.get(LOG_LOCAL_RESPONSE_HEADER_KEY) == "1"
    proxy_headers = get_proxy_headers(soap_request, config, soap_auth)
    if soap_auth:
        path = (
            config.soap_grantors_path
            if soap_request.api_name == SimplerSoapAPI.GRANTORS
            else config.soap_applicants_path
        )
        proxy_url = join(config.soap_partner_gateway_uri, path.lstrip("/"))
    else:
        logger.info(
            "soap_client_certificate: Sending soap request without client certificate",
            extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITHOUT_CERT},
        )
        proxy_url = join(
            soap_request.headers.get(config.gg_s2s_proxy_header_key, config.gg_url),
            soap_request.full_path.lstrip("/"),
        )
    logger.info(
        "soap_client_certificate: sending request to proxy_url",
        extra={"proxy_url": proxy_url},
    )
    _request = Request(method="POST", url=proxy_url, headers=proxy_headers, data=soap_request.data)

    response = _get_soap_response(_request, timeout=timeout)
    if should_log_response:
        log_local(
            msg="soap jwt proxy response",
            data=response.to_bytes().decode("utf-8"),
        )
    return response


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


def get_soap_jwt_auth_jwt(
    config: LegacySoapAPIConfig,
    soap_auth_certificate: SOAPClientCertificate,
) -> str:
    expiration_time = utcnow() + timedelta(minutes=1)
    if soap_auth_certificate.cert_id is not None:
        jwt_string = generate_soap_jwt(
            soap_auth_certificate.cert_id,
            expiration_time,
            config.soap_partner_gateway_uri,
            config.soap_partner_gateway_auth_key,
        )
        logger.info(
            "soap_client_certificate: created SOAP JWT",
            extra={"soap_api_event": LegacySoapApiEvent.JWT_CREATED},
        )
        return base64.b64encode(jwt_string.encode("utf-8")).decode("utf-8")
    logger.info(
        "soap_client_certificate: No cert_id",
        extra={"soap_api_event": LegacySoapApiEvent.CALLING_WITHOUT_CERT},
    )
    raise SOAPClientMissingCertificate("soap_client_certificate: no cert_id")
