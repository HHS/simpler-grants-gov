import io
from collections.abc import Generator
from typing import IO, Annotated, BinaryIO

from pydantic import BaseModel, ConfigDict, SkipValidation

from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_config import (
    SimplerSoapAPI,
    SOAPOperationConfig,
    get_soap_operation_config,
)
from src.legacy_soap_api.soap_payload_handler import get_soap_operation_name

TERMINATOR_TAGS = [b"</soapenv:Envelope>", b"</env:Envelope>"]
CHUNK_SIZE = 2000


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


class SoapRequestStreamer(BaseModel):
    # Using Annotated here to keep the type hint but avoid issue where
    # BinaryIO doesn't match typing BinaryIO https://github.com/pydantic/pydantic/issues/5443
    stream: Annotated[BinaryIO | IO[bytes], SkipValidation()]
    chunk_count: int = 5
    _consumed_head: bool = False
    head_bytes: bytes = b""
    total_length: int = 0

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def get_head_bytes(self) -> bytes:
        buffer = io.BytesIO()
        chunk_count = 0
        tail = b""
        overlap_size = max(len(tag) for tag in TERMINATOR_TAGS)
        while chunk_count < self.chunk_count:
            chunk = self.stream.read(CHUNK_SIZE)
            if not chunk:
                break

            window = tail + chunk
            for terminator in TERMINATOR_TAGS:
                if terminator in window:
                    buffer.write(chunk)
                    return buffer.getvalue()
            tail = chunk[-overlap_size:] if len(chunk) >= overlap_size else chunk

            chunk_count += 1
            buffer.write(chunk)
        return buffer.getvalue()

    def head(self) -> bytes:
        if not self.head_bytes:
            self.head_bytes = self.get_head_bytes()
        return self.head_bytes

    def __iter__(self) -> Generator:
        if not self._consumed_head:
            yield self.head_bytes
            self._consumed_head = True

        while True:
            chunk = self.stream.read(CHUNK_SIZE)
            if not chunk:
                break
            yield chunk

    def __len__(self) -> int:
        return self.total_length


class SOAPRequest(BaseModel):
    data: SoapRequestStreamer
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
        operation_name = (
            get_soap_operation_name(self.data.head())
            if not self.operation_name
            else self.operation_name
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
