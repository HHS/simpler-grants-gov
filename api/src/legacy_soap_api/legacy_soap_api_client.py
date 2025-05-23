import logging
import os

import requests

import src.adapters.db as db
from src.legacy_soap_api.applicants import schemas
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAPFaultException,
    format_local_soap_response,
    get_envelope_dict,
    get_soap_response,
)
from src.legacy_soap_api.soap_payload_handler import SoapPayload

logger = logging.getLogger(__name__)


class BaseSOAPClient:
    def __init__(self, soap_request: SOAPRequest, db_session: db.Session) -> None:
        self.config = LegacySoapAPIConfig()
        self.soap_request = soap_request
        self.soap_request_message = SoapPayload(self.soap_request.data.decode())
        self.soap_request_operation_name = self.soap_request_message.operation_name
        self.proxy_response = self._proxy_soap_request()
        self.proxy_response_message = SoapPayload(self.proxy_response.data.decode())
        self.db_session = db_session

    def _proxy_soap_request(self) -> SOAPResponse:
        """Proxy incoming SOAP requests to grants.gov
        This method handles proxying requests to grants.gov SOAP API and retrieving
        and returning the xml data as is from the existing SOAP API.
        """
        gg_s2s_uri = self.soap_request.headers.get(
            self.config.gg_s2s_proxy_header_key, self.config.grants_gov_uri
        )
        response = requests.request(
            method=self.soap_request.method,
            url=os.path.join(gg_s2s_uri, self.soap_request.full_path.lstrip("/")),
            data=self.soap_request.data,
            headers=self.soap_request.headers,
        )
        return SOAPResponse(
            data=self._process_response_response_content(response.content),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    def _process_response_response_content(self, soap_content: bytes) -> bytes:
        if not self.config.inject_uuid_data:
            return soap_content
        return format_local_soap_response(soap_content)


class SimplerApplicantsS2SClient(BaseSOAPClient):
    def GetOpportunityListRequest(self) -> None:
        get_opportunity_list_request = schemas.GetOpportunityListRequest(
            **get_envelope_dict(self.get_request_soap_dict_body(), self.soap_request.operation_name)
        )
        logger.info(
            "soap get_opportunity_list_request validated",
            extra={"get_opportunity_request": get_opportunity_list_request.model_dump()},
        )
        return None

    def get_response(self) -> tuple:
        # This method returns the raw response we get from the proxy request as well as
        # the new simpler soap response data.
        operation_method = getattr(self, self.soap_request_operation_name, None)
        if not operation_method:
            logger.info(f"soap_operation_not_supported: {self.soap_request_operation_name}")
            return self.proxy_response, None

        try:
            simpler_response = operation_method()
        except SOAPFaultException as e:
            logger.info(
                "soap_applicants_api_fault",
                extra={"err": e.message, "fault": e.fault.model_dump()},
            )
            simpler_response = get_soap_response(
                data=e.fault.to_xml(),
                status_code=500,
            )
        return self.proxy_response, simpler_response


class SimplerGrantorsS2SClient(BaseSOAPClient):
    def get_response(self) -> tuple:
        return self.proxy_response, None
