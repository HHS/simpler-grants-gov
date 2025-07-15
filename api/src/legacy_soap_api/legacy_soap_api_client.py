import logging

import src.adapters.db as db
from src.legacy_soap_api.applicants import schemas as applicants_schemas
from src.legacy_soap_api.applicants.services import get_opportunity_list_response
from src.legacy_soap_api.legacy_soap_api_config import SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_utils import wrap_envelope_dict
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_soap_operation_dict

logger = logging.getLogger(__name__)


class BaseSOAPClient:
    def __init__(
        self, soap_request_xml: str, operation_config: SOAPOperationConfig, db_session: db.Session
    ) -> None:
        self.soap_request_xml = soap_request_xml
        self.operation_config = operation_config
        self.db_session = db_session

    def get_soap_request_dict(self) -> dict:
        return get_soap_operation_dict(
            self.soap_request_xml, self.operation_config.request_operation_name
        )

    def get_simpler_soap_response_payload(self) -> SOAPPayload:
        operation_method = getattr(self, self.operation_config.request_operation_name)
        simpler_soap_data = operation_method()
        return SOAPPayload(
            soap_payload=wrap_envelope_dict(
                soap_xml_dict=simpler_soap_data.model_dump(mode="json", by_alias=True),
                operation_name=self.operation_config.response_operation_name,
            ),
            force_list_attributes=self.operation_config.force_list_attributes,
            operation_name=self.operation_config.response_operation_name,
        )


class SimplerApplicantsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Applicants SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/applicant-system-to-system/web-services/
    """

    def GetOpportunityListRequest(self) -> applicants_schemas.GetOpportunityListResponse:
        get_opportunity_list_request = applicants_schemas.GetOpportunityListRequest(
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


class SimplerGrantorsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Grantors SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/grantor-system-to-system/web-services
    """

    pass
