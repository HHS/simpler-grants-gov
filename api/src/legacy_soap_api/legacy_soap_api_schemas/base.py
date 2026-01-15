from pydantic import BaseModel, ConfigDict

from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_config import (
    SimplerSoapAPI,
    SOAPOperationConfig,
    get_soap_operation_config,
)
from src.legacy_soap_api.soap_payload_handler import (
    get_soap_envelope_from_payload,
    get_soap_operation_name,
)


class SOAPClientCertificateNotConfigured(Exception):
    pass


class SOAPClientCertificateParsingError(Exception):
    pass


class SOAPOperationNotSupported(Exception):
    pass


class SOAPInvalidEnvelope(Exception):
    pass


class SOAPInvalidRequestOperationName(Exception):
    pass


class SOAPRequest(BaseModel):
    data: bytes
    full_path: str
    headers: dict
    method: str
    api_name: SimplerSoapAPI
    auth: SOAPAuth | None = None
    operation_name: str = ""

    def get_soap_request_operation_config(self) -> SOAPOperationConfig:
        """Get operation config

        This method returns the relevant Simpler SOAP API operation configuration.

        Every SOAP operation that Simpler SOAP API will support will need to have a corresponding entry in SIMPLER_SOAP_OPERATION_CONFIGS.

        All existing grants.gov SOAP operations can be found here:
        Applicants: https://grants.gov/system-to-system/applicant-system-to-system/web-services
        Grantors: https://grants.gov/system-to-system/grantor-system-to-system/web-services

        These configs store data for processing SOAP XML data within simpler.
        """
        envelope = get_soap_envelope_from_payload(self.data.decode()).envelope
        if not envelope:
            raise SOAPInvalidEnvelope(f"Error processing SOAP envelope for {self.api_name.value}")

        operation_name = (
            get_soap_operation_name(envelope) if not self.operation_name else self.operation_name
        )
        if not operation_name:
            raise SOAPInvalidRequestOperationName(
                f"Could not get SOAP operation name for {self.api_name.value}"
            )

        operation_config = get_soap_operation_config(self.api_name, operation_name)
        if not operation_config:
            raise SOAPOperationNotSupported(
                f"Simpler {self.api_name.value} SOAP API does not support {operation_name}"
            )

        if operation_config.privileges is None:
            raise SOAPOperationNotSupported(
                f"Simpler {self.api_name.value} SOAP API has no privileges set for {operation_name}"
            )

        return operation_config


class BaseSOAPSchema(BaseModel):
    """
    This schema is for incoming and outgoing parsed SOAP messages
    and supports parsing/validating dicts based on the alias attribute
    on the attributes' Field.

    This is useful for processing the SOAP XML data that is processed
    as a dict since the XML attributes typically come in as camel case.
    """

    model_config = ConfigDict(populate_by_name=True)

    def to_soap_envelope_dict(self, operation_name: str) -> dict:
        return {
            "Envelope": {
                "Body": {
                    operation_name: {
                        **self.model_dump(mode="json", by_alias=True, exclude_none=True)
                    }
                }
            }
        }


class FaultMessage(BaseModel):
    faultcode: str
    faultstring: str

    def to_xml(self) -> bytes:
        return f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>{self.faultcode}</faultcode>
            <faultstring>{self.faultstring}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
    """.strip().encode()
