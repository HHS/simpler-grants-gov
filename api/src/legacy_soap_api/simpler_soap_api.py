import logging

import src.adapters.db as db
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_config import get_soap_config
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import (
    SimplerSoapAPI,
    SOAPInvalidEnvelope,
    SOAPInvalidRequestOperationName,
    SOAPOperationNotSupported,
    SOAPRequest,
    SOAPResponse,
)
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


def get_simpler_soap_response(
    soap_request: SOAPRequest, soap_proxy_response: SOAPResponse, db_session: db.Session
) -> SOAPResponse:
    simpler_soap_client_type = (
        SimplerApplicantsS2SClient
        if soap_request.api_name == SimplerSoapAPI.APPLICANTS
        else SimplerGrantorsS2SClient
    )

    use_simpler = get_soap_config().use_simpler

    try:
        simpler_soap_client = simpler_soap_client_type(
            soap_request=soap_request, db_session=db_session
        )

        add_extra_data_to_current_request_logs(
            {
                "soap_response_operation": simpler_soap_client.operation_config.response_operation_name,
            }
        )
    except (SOAPInvalidEnvelope, SOAPInvalidRequestOperationName, SOAPOperationNotSupported) as e:
        logger.info(
            f"simpler_soap_api: {e}",
            exc_info=True,
            extra={
                "soap_api_event": LegacySoapApiEvent.INVALID_REQUEST,
                "used_simpler_response": use_simpler,
            },
        )
        return soap_proxy_response
    except Exception:
        err = "Unable to initialize Simpler SOAP client: Unknown error"
        logger.info(
            f"simpler_soap_api: {err}",
            exc_info=True,
            extra={
                "soap_api_event": LegacySoapApiEvent.UNKNOWN_ERROR,
                "used_simpler_response": use_simpler,
            },
        )
        return soap_proxy_response

    if use_simpler or simpler_soap_client.operation_config.always_call_simpler:
        simpler_soap_response = simpler_soap_client.get_simpler_soap_response(soap_proxy_response)

    if use_simpler and simpler_soap_response is not None:
        logger.info(
            "simpler_soap_api: Successfully processed request and returning Simpler SOAP response",
            extra={
                "soap_api_event": LegacySoapApiEvent.RETURNING_SIMPLER_RESPONSE,
                "used_simpler_response": use_simpler,
            },
        )
        return simpler_soap_response

    logger.info(
        "simpler_soap_api: Successfully processed request and returning SOAP proxy response",
        extra={
            "soap_api_event": LegacySoapApiEvent.RETURNING_LEGACY_SOAP_RESPONSE,
            "used_simpler_response": use_simpler,
        },
    )
    return soap_proxy_response
