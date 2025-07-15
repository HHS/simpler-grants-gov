import logging

from flask import request

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.legacy_soap_api.legacy_soap_api_auth import MTLS_CERT_HEADER_KEY, get_soap_auth
from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_proxy import get_proxy_response
from src.legacy_soap_api.legacy_soap_api_schemas import SimplerSoapAPI, SOAPRequest
from src.legacy_soap_api.legacy_soap_api_utils import get_soap_error
from src.legacy_soap_api.simpler_soap_api import get_simpler_soap_response
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort")
@flask_db.with_db_session()
def simpler_soap_applicants_api(db_session: db.Session) -> tuple:
    add_extra_data_to_current_request_logs(
        {
            "soap_api": SimplerSoapAPI.APPLICANTS.value,
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
    except Exception:
        logger.info("Error getting soap proxy response")
        return get_soap_error().to_flask_response()

    try:
        simpler_soap_response, use_simpler_soap_response = get_simpler_soap_response(
            soap_proxy_response, soap_request, db_session
        )
    except Exception:
        logger.info("Could not obtain simpler SOAP response")
        simpler_soap_response, use_simpler_soap_response = None, False

    if use_simpler_soap_response and simpler_soap_response is not None:
        return simpler_soap_response.to_flask_response()
    return soap_proxy_response.to_flask_response()


@legacy_soap_api_blueprint.post("/grantsws-agency/services/v2/AgencyWebServicesSoapPort")
@flask_db.with_db_session()
def simpler_soap_grantors_api(db_session: db.Session) -> tuple:
    add_extra_data_to_current_request_logs(
        {
            "soap_api": SimplerSoapAPI.GRANTORS.value,
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
    except Exception:
        logger.info("Error getting soap proxy response")
        return get_soap_error().to_flask_response()

    try:
        simpler_soap_response, use_simpler_soap_response = get_simpler_soap_response(
            soap_proxy_response, soap_request, db_session
        )
    except Exception:
        logger.info("Could not obtain simpler SOAP response")
        simpler_soap_response, use_simpler_soap_response = None, False

    if use_simpler_soap_response and simpler_soap_response is not None:
        return simpler_soap_response.to_flask_response()
    return soap_proxy_response.to_flask_response()
