import logging
import traceback
from typing import Any

from pydantic import ValidationError

import src.adapters.db as db
from src.legacy_soap_api.applicants import schemas as applicants_schemas
from src.legacy_soap_api.applicants.services import get_opportunity_list_response
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    SOAPFaultException,
    diff_soap_dicts,
    get_soap_response,
    wrap_envelope_dict,
)
from src.legacy_soap_api.soap_payload_handler import (
    SOAPPayload,
    get_envelope_dict,
    get_soap_operation_dict,
)

logger = logging.getLogger(__name__)


class BaseSOAPClient:
    def __init__(self, soap_request: SOAPRequest, db_session: db.Session) -> None:
        self.soap_request = soap_request
        self.operation_config = soap_request.get_soap_request_operation_config()
        self.db_session = db_session

    def get_soap_request_dict(self) -> dict:
        return get_soap_operation_dict(
            self.soap_request.data.decode(), self.operation_config.request_operation_name
        )

    def get_simpler_soap_response_payload(self) -> SOAPPayload:
        operation_method = getattr(self, self.operation_config.request_operation_name)
        try:
            simpler_soap_data = operation_method()
            return SOAPPayload(
                soap_payload=wrap_envelope_dict(
                    soap_xml_dict=simpler_soap_data.model_dump(mode="json", by_alias=True),
                    operation_name=self.operation_config.response_operation_name,
                ),
                force_list_attributes=self.operation_config.force_list_attributes,
                operation_name=self.operation_config.response_operation_name,
            )
        except SOAPFaultException as e:
            # This exception block handles invalid request/response data such as missing input
            # parameters or data types. We can still compare the error data responses to the proxy
            # response.
            logger.info(
                "simpler_soap_api: Fault", extra={"err": e.message, "fault": e.fault.model_dump()}
            )
            return SOAPPayload(e.fault.model_dump())

    def get_simpler_soap_response(self, proxy_response: SOAPResponse) -> tuple:
        """
        This method is responsible getting the simpler soap xml payload as well as the following:

        1. Validate the proxy response into our Simpler SOAP response pydantic schema.
        2. Comparing simpler soap response to the proxy response.
        3. Indicating whether the response pydantic schemas matches.
        """
        simpler_response_schema = self.get_simpler_soap_response_schema()
        proxy_response_schema_data = None
        if simpler_response_schema is not None:
            proxy_response_dict = get_envelope_dict(
                SOAPPayload(
                    proxy_response.data.decode(errors="replace"),
                    force_list_attributes=self.operation_config.force_list_attributes,
                ).to_dict(),
                self.operation_config.response_operation_name,
            )
            try:
                # Ignoring type checking here since we already checked that the
                # schema is not None above.
                proxy_response_schema_data = self.get_simpler_soap_response_schema()(
                    **proxy_response_dict
                )  # type: ignore[misc]
            except ValidationError as e:
                msg = "Could not parse proxy response into Simpler SOAP response pydantic schema."
                error_fields = {err["loc"] for err in e.errors()}
                logger.info(msg=msg, extra={"simpler_soap_api_error": error_fields})
            except Exception as e:
                logger.info(
                    msg="Could not parse proxy response",
                    extra={"soap_traceback": "".join(traceback.format_tb(e.__traceback__))},
                )

        # We will catch and handle any relevant exceptions in the router.
        simpler_soap_payload = self.get_simpler_soap_response_payload()
        simpler_response_soap_dict = simpler_soap_payload.to_dict()
        proxy_response_soap_dict = {}
        if proxy_response_schema_data is not None:
            proxy_response_soap_dict = wrap_envelope_dict(
                proxy_response_schema_data.model_dump(mode="json", by_alias=True),
                self.operation_config.response_operation_name,
            )

        diff_soap_dicts(simpler_response_soap_dict, proxy_response_soap_dict)

        # This will always be false until the following have been implemented:
        # https://github.com/HHS/simpler-grants-gov/issues/5224
        # https://github.com/HHS/simpler-grants-gov/issues/5234
        use_simpler_response = False
        return (
            get_soap_response(data=simpler_soap_payload.envelope_data.envelope.encode()),
            use_simpler_response,
        )

    def get_simpler_soap_response_schema(self) -> Any | None:
        if self.soap_request.api_name == SimplerSoapAPI.APPLICANTS:
            return getattr(applicants_schemas, self.operation_config.response_operation_name)
        # Grantors SOAP API schemas will be returned once they exist but will return None for now.
        return None


class SimplerApplicantsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Applicants SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/applicant-system-to-system/web-services/
    """

    def GetOpportunityListRequest(self) -> applicants_schemas.GetOpportunityListResponse:
        return get_opportunity_list_response(
            db_session=self.db_session,
            get_opportunity_list_request=applicants_schemas.GetOpportunityListRequest(
                **self.get_soap_request_dict()
            ),
        )


class SimplerGrantorsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Grantors SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/grantor-system-to-system/web-services
    """

    pass
