import os

import requests

from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPProxyResponse, SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import format_local_soap_response
from src.legacy_soap_api.soap_payload_handler import SoapPayload


class BaseSOAPClient:
    def __init__(self, soap_request: SOAPRequest) -> None:
        self.config = LegacySoapAPIConfig()
        self.soap_request = soap_request
        self.soap_request_message = SoapPayload(self.soap_request.data.decode())
        self.proxy_response = self._proxy_soap_request()

    def _proxy_soap_request(self) -> SOAPProxyResponse:
        """Proxy incoming SOAP requests to grants.gov
        This method handles proxying requests to grants.gov SOAP API and retrieving
        and returning the xml data as is from the existing SOAP API.
        """
        response = requests.request(
            method=self.soap_request.method,
            url=os.path.join(self.config.grants_gov_uri, self.soap_request.full_path.lstrip("/")),
            data=self.soap_request.data,
            headers=self.soap_request.headers,
        )
        return SOAPProxyResponse(
            data=self._process_response_response_content(response.content),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    def _process_response_response_content(self, soap_content: bytes) -> bytes:
        if not self.config.inject_uuid_data:
            return soap_content
        return format_local_soap_response(soap_content)


class SimplerApplicantsS2SClient(BaseSOAPClient):
    def get_response(self) -> SOAPProxyResponse:
        return self.proxy_response


class SimplerGrantorsS2SClient(BaseSOAPClient):
    def get_response(self) -> SOAPProxyResponse:
        return self.proxy_response
