import os

import requests
from werkzeug.local import LocalProxy

from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_schemas import LegacySOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import format_local_soap_response


class LegacySOAPRequestHandler:
    def __init__(self, request: LocalProxy, service_name: str, service_port_name: str) -> None:
        self.config = LegacySoapAPIConfig()
        self.service_name = service_name
        self.service_name_port = service_port_name
        self._req = request

    def get_proxy_response(self) -> LegacySOAPResponse:
        """Proxy incoming SOAP requests to grants.gov

        This method handles proxying requests to grants.gov SOAP API and retrieving
        and returning the xml data as is from the existing SOAP API.
        """
        url = os.path.join(self.config.grants_gov_uri, self._req.full_path.lstrip("/"))
        response = requests.request(
            self._req.method, url, data=self._req.data, headers=self._req.headers
        )
        return LegacySOAPResponse(
            data=self._process_response_response_content(response.content),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    def _process_response_response_content(self, soap_content: bytes) -> bytes:
        if not self.config.inject_uuid_data:
            return soap_content
        return format_local_soap_response(soap_content)
