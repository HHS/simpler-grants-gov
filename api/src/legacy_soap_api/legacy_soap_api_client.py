import logging
import os
from tempfile import NamedTemporaryFile

import requests

import src.adapters.db as db
from src.legacy_soap_api.applicants import schemas
from src.legacy_soap_api.applicants.services import get_opportunity_list_response
from src.legacy_soap_api.legacy_soap_api_auth import (
    MTLS_CERT_HEADER_KEY,
    SessionResumptionAdapter,
    SOAPAuth,
    SOAPClientCertificateLookupError,
    SOAPClientCertificateNotConfigured,
)
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAP_OPERATION_CONFIGS,
    SOAPFaultException,
    format_local_soap_response,
    get_auth_error_response,
    get_envelope_dict,
    get_soap_response,
    wrap_envelope_dict,
)
from src.legacy_soap_api.soap_payload_handler import SoapPayload

logger = logging.getLogger(__name__)


class BaseSOAPClient:
    def __init__(
        self, soap_request: SOAPRequest, db_session: db.Session, auth: SOAPAuth | None = None
    ) -> None:
        self.config = LegacySoapAPIConfig()
        self.auth = auth
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
        session = requests.Session()
        session.mount("https://", SessionResumptionAdapter())
        request = requests.Request(
            method=self.soap_request.method,
            url=self.get_soap_proxy_url(),
            data=self.soap_request.data,
            headers=self.get_proxy_request_headers(),
        )

        if not self.auth or self.config.soap_auth_map == {}:
            logger.info("soap_api_proxy: proxying unauthorized request")
            prepared = session.prepare_request(request)
            response = session.send(prepared)
        else:
            logger.info("soap_api_proxy: proxying authorized request")
            with NamedTemporaryFile(mode="w", delete=True) as temp_cert_file:
                temp_file_path = temp_cert_file.name
                logger.info(
                    "soap_api_proxy: created temp certificate file",
                    extra={"temp_file_path": temp_file_path},
                )
                temp_cert_file.write(self.get_client_cert())
                temp_cert_file.flush()
                prepared = session.prepare_request(request)
                try:
                    response = session.send(prepared, cert=temp_file_path)
                except requests.exceptions.SSLError:
                    return get_auth_error_response()

        return SOAPResponse(
            data=self._process_response_response_content(response.content),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    def get_client_cert(self) -> str:
        """This is temp auth solution"""
        cert = ""
        if not self.auth:
            return cert
        try:
            cert = self.auth.certificate.get_pem(self.config.soap_auth_map)
            logger.info("soap_client_certificate: found associated key")
        except (SOAPClientCertificateLookupError, SOAPClientCertificateNotConfigured) as e:
            logger.warning(f"soap_client_certificate: {e}")
        return cert

    def _process_response_response_content(self, soap_content: bytes) -> bytes:
        if not self.config.inject_uuid_data or self.config.gg_s2s_proxy_header_key:
            return soap_content
        return format_local_soap_response(soap_content)

    def get_soap_request_dict(self) -> dict:
        return get_envelope_dict(
            self.soap_request_message.to_dict(), self.soap_request_operation_name
        )

    def get_soap_proxy_url(self) -> str:
        return os.path.join(
            self.soap_request.headers.get(
                self.config.gg_s2s_proxy_header_key, self.config.grants_gov_uri
            ),
            self.soap_request.full_path.lstrip("/"),
        )

    def get_proxy_request_headers(self) -> dict:
        # These request header keys are utilized in simpler soap api and are not
        # required in the proxy requests.
        simpler_soap_header_keys = {self.config.gg_s2s_proxy_header_key, MTLS_CERT_HEADER_KEY}
        return {
            k: v for k, v in self.soap_request.headers.items() if k not in simpler_soap_header_keys
        }


class SimplerApplicantsS2SClient(BaseSOAPClient):
    def __init__(
        self, soap_request: SOAPRequest, db_session: db.Session, auth: SOAPAuth | None = None
    ) -> None:
        super().__init__(soap_request, db_session, auth)
        self.operation_config = SOAP_OPERATION_CONFIGS["applicants"].get(
            self.soap_request_operation_name
        )

    def GetOpportunityListRequest(self) -> schemas.GetOpportunityListResponse:
        get_opportunity_list_request = schemas.GetOpportunityListRequest(
            **self.get_soap_request_dict()
        )
        opportunity_list = get_opportunity_list_response(
            self.db_session, get_opportunity_list_request
        )

        # It is ok to log this response since it is public and does not contain PII.
        logger.info(
            "soap get_opportunity_list_response retrieved",
            extra={
                "get_opportunity_list_request": get_opportunity_list_request.model_dump(),
                "get_opportunity_list_response": opportunity_list.model_dump(),
            },
        )
        return opportunity_list

    def get_response(self) -> tuple:
        # This method returns the raw response we get from the proxy request as well as
        # the new simpler soap response data.
        operation_method = getattr(self, self.soap_request_operation_name, None)
        if not operation_method:
            logger.info(f"soap_operation_not_supported: {self.soap_request_operation_name}")
            return self.proxy_response, None
        if not self.operation_config:
            logger.info(f"soap_operation_config_not_found: {self.soap_request_operation_name}")
            return self.proxy_response, None

        try:
            simpler_response = operation_method()
            simpler_soap_payload = SoapPayload(
                soap_payload=wrap_envelope_dict(
                    soap_xml_dict=simpler_response.model_dump(mode="json", by_alias=True),
                    operation_name=self.operation_config.response_operation_name,
                ),
                force_list_attributes=self.operation_config.force_list_attributes,
                operation_name=self.operation_config.response_operation_name,
            )
            simpler_soap_response = get_soap_response(data=simpler_soap_payload.envelope.encode())
        except SOAPFaultException as e:
            logger.info(
                "simpler_soap_api_fault",
                extra={"err": e.message, "fault": e.fault.model_dump()},
            )
            simpler_soap_response = get_soap_response(
                data=e.fault.to_xml(),
                status_code=500,
            )

        return self.proxy_response, simpler_soap_response


class SimplerGrantorsS2SClient(BaseSOAPClient):
    def get_response(self) -> tuple:
        return self.proxy_response, None
