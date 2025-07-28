import logging
import traceback

from flask import request

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.legacy_soap_api.legacy_soap_api_auth import MTLS_CERT_HEADER_KEY, get_soap_auth
from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_proxy import get_proxy_response
from src.legacy_soap_api.legacy_soap_api_schemas import SimplerSoapAPI, SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import (
    get_invalid_path_response,
    get_soap_error_response,
)
from src.legacy_soap_api.simpler_soap_api import get_simpler_soap_response
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_name
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/<service_port_name>")
@flask_db.with_db_session()
def simpler_soap_api_route(
    db_session: db.Session, service_name: str, service_port_name: str
) -> tuple:
    api_name = SimplerSoapAPI.get_soap_api(service_name, service_port_name)
    if not api_name:
        logger.info(
            f"Could not determine Simpler SOAP API from {service_name=} {service_port_name=}"
        )
        return get_invalid_path_response().to_flask_response()

    operation_name = get_soap_operation_name(request.data)
    add_extra_data_to_current_request_logs(
        {
            "soap_api": api_name.value,
            "soap_request_operation_name": operation_name if operation_name else "Unknown",
        }
    )
    logger.info("SOAP request received")

    try:
        soap_request = SOAPRequest(
            api_name=api_name,
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
            auth=get_soap_auth(request.headers.get(MTLS_CERT_HEADER_KEY)),
            operation_name=operation_name,
        )
        soap_proxy_response = get_proxy_response(soap_request)
    except Exception as e:
        msg = "Error getting soap proxy response"
        logger.error(
            msg=msg,
            extra={
                "simpler_soap_api_error": msg,
                "soap_traceback": "".join(traceback.format_tb(e.__traceback__)),
                "used_simpler_response": False,
            },
        )
        return get_soap_error_response().to_flask_response()

    try:
        return get_simpler_soap_response(
            soap_request, soap_proxy_response, db_session
        ).to_flask_response()
    except Exception as e:
        msg = "Unable to process Simpler SOAP proxy response"
        logger.info(
            msg=msg,
            extra={
                "simpler_soap_api_error": msg,
                "soap_traceback": "".join(traceback.format_tb(e.__traceback__)),
                "used_simpler_response": False,
            },
        )
        return soap_proxy_response.to_flask_response()
