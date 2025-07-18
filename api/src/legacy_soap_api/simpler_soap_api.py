import logging
import traceback

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

    use_simpler = False

    try:
        simpler_soap_client = simpler_soap_client_type(
            soap_request=soap_request, db_session=db_session
        )

        add_extra_data_to_current_request_logs(
            {
                "soap_response_operation": simpler_soap_client.operation_config.response_operation_name,
            }
        )
    except Exception as e:
        err = "Unable to initialize Simpler SOAP client: Unknown error"
        logger.info(
            f"simpler_soap_api: {err}",
            extra={
                "simpler_soap_api_error": err,
                "used_simpler_response": use_simpler,
                "soap_traceback": "".join(traceback.format_tb(e.__traceback__)),
            },
        )
        return soap_proxy_response

    try:
        simpler_soap_response, use_simpler = simpler_soap_client.get_simpler_soap_response(
            soap_proxy_response
        )

        if simpler_soap_response is not None and use_simpler:
            logger.info(
                "simpler_soap_api: Successfully processed request and returning Simpler SOAP response",
                extra={"used_simpler_response": use_simpler},
            )
            return simpler_soap_response
    except (SOAPOperationNotSupported, SOAPInvalidEnvelope, SOAPInvalidRequestOperationName) as e:
        err = f"Unable to initialize Simpler SOAP client: {e}"
        logger.info(
            f"simpler_soap_api: {err}",
            extra={"simpler_soap_api_error": err, "used_simpler_response": use_simpler},
        )
        return soap_proxy_response

    logger.info(
        "simpler_soap_api: Successfully processed request and returning SOAP proxy response",
        extra={"used_simpler_response": use_simpler},
    )
    return soap_proxy_response
