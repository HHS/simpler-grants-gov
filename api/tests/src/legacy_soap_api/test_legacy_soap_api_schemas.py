import pytest
from pydantic import ValidationError

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage, SOAPResponse


def test_legacy_soap_api_response_schema_missing_required_fields() -> None:
    with pytest.raises(ValidationError):
        SOAPResponse()


def test_format_flask_response() -> None:
    res = SOAPResponse(data=b"", status_code=200, headers={})
    given = res.to_flask_response()
    expected = (res.data, res.status_code, res.headers)
    assert given == expected


def test_fault_message() -> None:
    fault = FaultMessage(faultcode="a", faultstring="b")
    expected_xml_message = f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>{fault.faultcode}</faultcode>
            <faultstring>{fault.faultstring}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
""".encode()
    assert fault.to_xml() == expected_xml_message.strip()
