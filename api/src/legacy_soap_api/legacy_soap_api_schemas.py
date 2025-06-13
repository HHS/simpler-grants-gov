from pydantic import BaseModel, ConfigDict


class SOAPRequest(BaseModel):
    data: bytes
    full_path: str
    headers: dict
    method: str


class SOAPResponse(BaseModel):
    data: bytes
    status_code: int
    headers: dict

    def to_flask_response(self) -> tuple:
        return self.data, self.status_code, self.headers


class SOAPClientCertificate(BaseModel):
    cert: str
    serial_number: str

    def get_pem(self, key_map: dict) -> str:
        return f"{key_map[self.serial_number]}\n\n{self.cert}"


class SOAPAuth(BaseModel):
    certificate: SOAPClientCertificate


class BaseSOAPSchema(BaseModel):
    """
    This schema is for incoming and outgoing parsed SOAP messages
    and supports parsing/validating dicts based on the alias attribute
    on the attributes' Field.

    This is useful for processing the SOAP XML data that is processed
    as a dict since the XML attributes typically come in as camel case.
    """

    model_config = ConfigDict(populate_by_name=True)


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
