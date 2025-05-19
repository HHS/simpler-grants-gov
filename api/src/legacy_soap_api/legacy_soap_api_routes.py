import logging

from flask import request

from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_client import (
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest
from src.legacy_soap_api.soap_payload_handler import SoapPayload
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/<service_port_name>")
def soap_api_operations_handler(service_name: str, service_port_name: str) -> tuple:
    """SOAP API Operations Handler

    All SOAP requests come in as POST for operations. This will be
    the router responsible for handling all SOAP operations for both
    the applicants and grantors SOAP API requests.
    """
    soap_request = SOAPRequest(
        method="POST",
        full_path=request.full_path,
        headers=dict(request.headers),
        data=request.data,
    )

    if service_name == "grantsws-applicant":
        client = SimplerApplicantsS2SClient(soap_request)
    else:
        client = SimplerApplicantsS2SClient(soap_request)

    add_extra_data_to_current_request_logs(
        {
            "soap_api": service_name,
            "soap_service_port_name": service_port_name,
            "soap_request_operation_name": client.soap_request_message.operation_name,
        }
    )

    soap_response_message = SoapPayload(client.proxy_response.data.decode())
    add_extra_data_to_current_request_logs(
        {"soap_proxy_response_operation_name": soap_response_message.operation_name}
    )

    # This format will preserve the response data from SOAP API.
    return client.proxy_response.to_flask_response()
