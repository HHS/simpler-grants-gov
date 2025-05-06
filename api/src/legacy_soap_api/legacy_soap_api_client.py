import logging
import os

import requests

from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_schemas import LegacySOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import format_local_soap_response

logger = logging.getLogger(__name__)

MTLS_CERT_HEADER_KEY = "X-Amzn-Mtls-Clientcert"


class LegacySOAPClient:
    def __init__(self) -> None:
        self.config = LegacySoapAPIConfig()

    def proxy_request(
        self, method: str, full_path: str, headers: dict | None = None, body: bytes | None = None
    ) -> LegacySOAPResponse:
        """Proxy incoming SOAP requests to grants.gov
        This method handles proxying requests to grants.gov SOAP API and retrieving
        and returning the xml data as is from the existing SOAP API.
        """
        headers = headers if headers else {}
        logger.info("soap_header_keys", extra={"request_header_keys": headers.keys()})
        url = os.path.join(self.config.grants_gov_uri, full_path.lstrip("/"))
        cert = headers.get(MTLS_CERT_HEADER_KEY, None)
        if cert:
            logger.info("retrieved and forwarding mtls cert")
        response = requests.request(method, url, data=body, headers=headers, cert=cert)
        return LegacySOAPResponse(
            data=self._process_response_response_content(response.content),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    def _process_response_response_content(self, soap_content: bytes) -> bytes:
        if not self.config.inject_uuid_data:
            return soap_content
        return format_local_soap_response(soap_content)
