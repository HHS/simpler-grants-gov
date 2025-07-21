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

    def get_soap_response_dict(self) -> dict:
        """Get Simpler SOAP response dict

        This method will return the validated pydantic schema returned from the
        SOAP response operation. It will be in the format necessary to convert to and
        from XML utilizing SOAPPayload class.

        Example:
            {'Envelope': {'Body': {'GetOpportunityListResponse': {...}}}}
        """
        operation_method = getattr(self, self.operation_config.request_operation_name)
        return operation_method().to_soap_envelope_dict(
            self.operation_config.response_operation_name
        )

    def get_proxy_soap_response_dict(self, proxy_response: SOAPResponse) -> dict:
        """
        This method does the following:

        1. Gets the pydantic schema defined in self.operation_config.
        2. Converts the SOAP proxy response XML to a dict.
        3. Validates the XML dict.
        4. Returns the proxy XML dict from the pydantic schema data.

        This ensures parity when we need to compare proxy response to simpler
        SOAP response.

        Note: Ignoring type checking in return statement since we already check
        that the schema is not None prior to statement.
        """
        proxy_response_schema_data = wrap_envelope_dict(
            {}, self.operation_config.response_operation_name
        )

        simpler_response_schema = self._get_simpler_soap_response_schema()
        if simpler_response_schema is None:
            logger.info(
                "Unable to validate SOAP proxy response. No Simpler SOAP pydantic schema found."
            )
            return proxy_response_schema_data

        try:
            validated_proxy_response = self._get_simpler_soap_response_schema()(
                **get_envelope_dict(
                    SOAPPayload(
                        proxy_response.data.decode(errors="replace"),
                        operation_name=self.operation_config.response_operation_name,
                        force_list_attributes=self.operation_config.force_list_attributes,
                    ).to_dict(),
                    self.operation_config.response_operation_name,
                )
            )  # type: ignore[misc]
            return validated_proxy_response.to_soap_envelope_dict(
                self.operation_config.response_operation_name
            )
        except ValidationError as e:
            msg = f"Could not parse proxy response {str(simpler_response_schema)} into Simpler SOAP response pydantic schema."
            error_fields = {(err["type"], err["loc"]) for err in e.errors()}
            logger.info(
                msg=f"{msg} {error_fields}",
                extra={"simpler_soap_api_error": "proxy_response_validation"},
            )
        except Exception as e:
            logger.info(
                msg="Could not parse proxy response",
                extra={"soap_traceback": "".join(traceback.format_tb(e.__traceback__))},
            )
        return proxy_response_schema_data

    def get_simpler_soap_response(self, proxy_response: SOAPResponse) -> tuple:
        """
        This method is responsible getting the simpler soap xml payload.

        We first compare validated SOAP response dicts from simpler and
        proxy responses. We then utilize the SOAPPayload class to get the
        XML soap response from the validated XML dicts.
        """
        proxy_response_soap_dict = self.get_proxy_soap_response_dict(proxy_response)
        simpler_response_soap_dict = self.get_soap_response_dict()
        diff_soap_dicts(simpler_response_soap_dict, proxy_response_soap_dict)

        try:
            simpler_soap_response_payload = SOAPPayload(
                soap_payload=simpler_response_soap_dict,
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
            simpler_soap_response_payload = SOAPPayload(e.fault.to_xml().decode())

        # This will always be false until the following have been implemented:
        # https://github.com/HHS/simpler-grants-gov/issues/5224
        # https://github.com/HHS/simpler-grants-gov/issues/5234
        use_simpler_response = False
        return (
            get_soap_response(data=simpler_soap_response_payload.envelope_data.envelope.encode()),
            use_simpler_response,
        )

    def _get_simpler_soap_response_schema(self) -> Any | None:
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
