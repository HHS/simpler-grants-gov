import logging

import src.adapters.db as db
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import (
    SimplerSoapAPI,
    SOAPInvalidEnvelope,
    SOAPInvalidRequestOperationName,
    SOAPOperationNotSupported,
    SOAPRequest,
    SOAPResponse,
)
from src.legacy_soap_api.legacy_soap_api_utils import SOAPFaultException, get_soap_response
from src.legacy_soap_api.soap_payload_handler import SOAPPayload
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


def get_simpler_soap_response(
    proxy_response: SOAPResponse, soap_request: SOAPRequest, db_session: db.Session
) -> tuple:
    try:
        soap_operation_config = soap_request.get_soap_request_operation_config()
    except (SOAPOperationNotSupported, SOAPInvalidEnvelope, SOAPInvalidRequestOperationName) as e:
        logger.info(f"Unable to initialize simpler soap operation config: {e}")
        return None, False

    add_extra_data_to_current_request_logs(
        {
            "soap_request_operation": soap_operation_config.request_operation_name,
            "soap_response_operation": soap_operation_config.response_operation_name,
        }
    )

    simpler_soap_client_type = (
        SimplerApplicantsS2SClient
        if soap_request.api_name == SimplerSoapAPI.APPLICANTS
        else SimplerGrantorsS2SClient
    )

    simpler_soap_client = simpler_soap_client_type(
        soap_request_xml=soap_request.data.decode(),
        operation_config=soap_operation_config,
        db_session=db_session,
    )

    simpler_soap_payload = None
    try:
        simpler_soap_payload = simpler_soap_client.get_simpler_soap_response_payload()
        simpler_soap_response = get_soap_response(
            data=simpler_soap_payload.envelope_data.envelope.encode()
        )
    except SOAPFaultException as e:
        logger.info(
            "simpler_soap_api_fault",
            extra={"err": e.message, "fault": e.fault.model_dump()},
        )
        simpler_soap_response = get_soap_response(
            data=e.fault.to_xml(),
            status_code=500,
        )
    return simpler_soap_response, should_use_simpler_soap_response(
        simpler_soap_payload, proxy_response
    )


def should_use_simpler_soap_response(
    simpler_soap_payload: SOAPPayload | None, proxy_response: SOAPResponse
) -> bool:
    if simpler_soap_payload is None:
        return False
    try:
        simpler_dict = simpler_soap_payload.to_dict()
        proxy_dict = SOAPPayload(proxy_response.data.decode()).to_dict()
        return simpler_dict == proxy_dict
    except Exception:
        return False
