import logging

from flask import request

from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/<service_port_name>")
def soap_api_operations_handler(service_name: str, service_port_name: str) -> tuple:
    """SOAP API Operations Handler

    All SOAP requests come in as POST for operations. This will be
    the router responsible for handling all SOAP operations for both
    the applicants and grantors SOAP API requests.
    """
    add_extra_data_to_current_request_logs(
        {"service_name": service_name, "service_port_name": service_port_name}
    )
    soap_api_client = LegacySOAPClient()
    proxy_response = soap_api_client.proxy_request(
        method="POST",
        full_path=request.full_path,
        headers=dict(request.headers),
        body=request.data,
    )
    # This format will preserve the response data from SOAP API.
    return proxy_response.to_flask_response()
