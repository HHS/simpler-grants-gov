import logging
import traceback

from flask import request

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.legacy_soap_api.legacy_soap_api_auth import MTLS_CERT_HEADER_KEY, get_soap_auth
from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_proxy import get_proxy_response
from src.legacy_soap_api.legacy_soap_api_schemas import SimplerSoapAPI, SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import get_soap_error_response
from src.legacy_soap_api.simpler_soap_api import get_simpler_soap_response
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_name
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort")
@flask_db.with_db_session()
def simpler_soap_applicants_api(db_session: db.Session) -> tuple:
    operation_name = get_soap_operation_name(request.data)
    add_extra_data_to_current_request_logs(
        {
            "soap_api": SimplerSoapAPI.APPLICANTS.value,
            "soap_request_operation_name": operation_name if operation_name else "Unknown",
        }
    )
    logger.info("SOAP applicants request received")

    try:
        soap_request = SOAPRequest(
            api_name=SimplerSoapAPI.APPLICANTS,
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
            auth=get_soap_auth(request.headers.get(MTLS_CERT_HEADER_KEY)),
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


@legacy_soap_api_blueprint.post("/grantsws-agency/services/v2/AgencyWebServicesSoapPort")
@flask_db.with_db_session()
def simpler_soap_grantors_api(db_session: db.Session) -> tuple:
    operation_name = get_soap_operation_name(request.data)
    add_extra_data_to_current_request_logs(
        {
            "soap_api": SimplerSoapAPI.GRANTORS.value,
            "soap_request_operation_name": operation_name if operation_name else "Unknown",
        }
    )
    logger.info("SOAP grantors request received")

    try:
        soap_request = SOAPRequest(
            api_name=SimplerSoapAPI.GRANTORS,
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
            auth=get_soap_auth(request.headers.get(MTLS_CERT_HEADER_KEY)),
        )
        soap_proxy_response = get_proxy_response(soap_request)
    except Exception as e:
        msg = "Unable to process Simpler SOAP proxy response"
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
        msg = "Error processing Simpler SOAP response"
        logger.info(
            msg=msg,
            extra={
                "simpler_soap_api_error": msg,
                "soap_traceback": "".join(traceback.format_tb(e.__traceback__)),
                "used_simpler_response": False,
            },
        )
        return soap_proxy_response.to_flask_response()
