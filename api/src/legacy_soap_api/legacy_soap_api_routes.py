import logging

from flask import request

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.legacy_soap_api.legacy_soap_api_auth import with_soap_auth
from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPAuth, SOAPRequest
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort")
@flask_db.with_db_session()
@with_soap_auth()
def simpler_soap_applicants_api(db_session: db.Session, soap_auth: SOAPAuth) -> tuple:
    logger.info("applicants soap request received")
    client = SimplerApplicantsS2SClient(
        db_session=db_session,
        auth=soap_auth,
        soap_request=SOAPRequest(
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
        ),
    )
    add_extra_data_to_current_request_logs(
        {
            "soap_api": "applicants",
            "soap_proxy_request_operation_name": client.soap_request_operation_name,
        }
    )
    proxy_response, simpler_response = client.get_response()
    return proxy_response.to_flask_response()


@legacy_soap_api_blueprint.post("/grantsws-agency/services/v2/AgencyWebServicesSoapPort")
@flask_db.with_db_session()
def simpler_soap_grantors_api(db_session: db.Session) -> tuple:
    logger.info("grantors soap request received")
    client = SimplerGrantorsS2SClient(
        db_session=db_session,
        soap_request=SOAPRequest(
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
        ),
    )
    add_extra_data_to_current_request_logs(
        {
            "soap_api": "grantors",
            "soap_proxy_request_operation_name": client.soap_request_operation_name,
        }
    )
    proxy_response, simpler_response = client.get_response()
    return proxy_response.to_flask_response()
