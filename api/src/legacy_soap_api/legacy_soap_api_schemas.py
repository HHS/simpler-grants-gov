from collections.abc import Iterator

from pydantic import BaseModel, ConfigDict


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


class SOAPResponse(BaseModel):
    data: bytes | Iterator[bytes] | list[bytes]
    status_code: int
    headers: dict
    _cached_bytes: bytes | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def to_flask_response(self) -> tuple:
        response_data = self.data if isinstance(self.data, bytes) else self.stream()
        return response_data, self.status_code, self.headers

    def to_bytes(self) -> bytes:
        if isinstance(self.data, bytes):
            return self.data
        if self._cached_bytes is None:
            self._cached_bytes = b"".join(iter(self.data))
        return self._cached_bytes

    def stream(self) -> Iterator[bytes] | list[bytes]:

        def _data_generator(data: bytes) -> Iterator[bytes]:
            data_length = len(data)
            for i in range(0, data_length, 4000):
                yield data[i : i + 4000]

        if self._cached_bytes:
            return _data_generator(self._cached_bytes)
        if isinstance(self.data, bytes):
            return _data_generator(self.data)
        return self.data


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
