import logging

from flask import request

from src.legacy_soap_api import legacy_soap_api_blueprint
from src.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/ApplicantWebServicesSoapPort")
def soap_api_operations_handler(service_name: str) -> tuple:
    """SOAP API Operations Handler

    All SOAP requests come in as POST for operations. This will be
    the router responsible for handling all SOAP operations for both
    the applicants and grantors SOAP API requests.
    """
    logger.info(f"SOAP: POST {service_name}")
    soap_client = LegacySOAPClient()
    proxy_response = soap_client.proxy_request(
        method="POST",
        full_path=request.full_path,
        headers=dict(request.headers),
        body=request.data,
    )
    # This format will preserve the response data from SOAP API.
    return proxy_response.content, proxy_response.status_code, proxy_response.headers.items()
