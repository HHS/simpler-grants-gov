from typing import Literal

from flask import request

from src.adapters.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient
from src.legacy_soap_api import legacy_soap_api_blueprint

SoapServiceName = Literal["grantsws-applicant", "grantsws-agency"]


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/ApplicantWebServicesSoapPort")
def soap_api_handler(service_name: SoapServiceName) -> str:
    soap_client = LegacySOAPClient()
    return soap_client.proxy_request(
        method="POST",
        full_path=request.full_path,
        headers=dict(request.headers),
        body=request.data,
    )
