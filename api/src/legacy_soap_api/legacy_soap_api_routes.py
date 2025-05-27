import logging

from flask import request

from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort")
def simpler_soap_applicants_api() -> tuple:
    logger.info("applicants soap request received")
    client = SimplerApplicantsS2SClient(
        soap_request=SOAPRequest(
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
        )
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
def simpler_soap_grantors_api() -> tuple:
    logger.info("grantors soap request received")
    client = SimplerGrantorsS2SClient(
        soap_request=SOAPRequest(
            method="POST",
            full_path=request.full_path,
            headers=dict(request.headers),
            data=request.data,
        )
    )
    add_extra_data_to_current_request_logs(
        {
            "soap_api": "grantors",
            "soap_proxy_request_operation_name": client.soap_request_operation_name,
        }
    )
    proxy_response, simpler_response = client.get_response()
    return proxy_response.to_flask_response()


@legacy_soap_api_blueprint.get("/headers/<header_name>")
def headers_lookup(header_name: str = "X-Amzn-Mtls-Clientcert") -> str:
    import json

    headers = dict(request.headers)
    return json.dumps({"header_keys": list(headers.keys()), header_name: headers.get(header_name)})
