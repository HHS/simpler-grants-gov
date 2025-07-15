import uuid
from typing import Any

import requests

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage, SOAPResponse

BASE_SOAP_API_RESPONSE_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000",
    "Content-Type": 'multipart/related; type="application/xop+xml"',
}


def format_local_soap_response(response_data: str) -> bytes:
    # This is a format string for formatting local responses from the mock
    # soap server since it does not support manipulating the response.
    # The grants.gov SOAP API currently includes this data.
    response_id = str(uuid.uuid4())
    return (
        f"""
--uuid:{response_id}
Content-Type: application/xop+xml; charset=UTF-8; type=\"text/xml\"
Content-Transfer-Encoding: binary
Content-ID: <root.message@cxf.apache.org>
{response_data}
--uuid:{response_id}--
        """.replace(
            '<?xml version="1.0" encoding="UTF-8"?>', ""
        )
        .strip()
        .encode("utf-8")
    )


def get_soap_response(
    data: bytes, status_code: int = 200, headers: dict | None = None
) -> SOAPResponse:
    """Get SOAP response

    Get a soap response object that will be returned from the Simpler SOAP
    API endpoint.

    Note: The base headers can be overriden by caller if needed.
    """
    extra_headers = headers if headers else {}
    all_headers = {
        **BASE_SOAP_API_RESPONSE_HEADERS,
        **extra_headers,
        "Content-Length": len(data),
    }
    return SOAPResponse(data=data, status_code=status_code, headers=all_headers)


class SOAPFaultException(Exception):
    def __init__(self, message: str, fault: FaultMessage, *args: Any) -> None:
        self.message = message
        self.fault = fault
        super().__init__(message, fault, *args)


def wrap_envelope_dict(soap_xml_dict: dict, operation_name: str | None = None) -> dict:
    body = {operation_name: {**soap_xml_dict}} if operation_name else soap_xml_dict
    return {"Envelope": {"Body": {**body}}}


def get_soap_error(
    faultcode: str = "soap:Server",
    faultstring: str = "Server error has occurred",
    headers: dict | None = None,
) -> SOAPResponse:
    err = f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>{faultcode}</faultcode>
            <faultstring>{faultstring}</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
"""
    return get_soap_response(data=format_local_soap_response(err), status_code=500, headers=headers)


def get_auth_error_response() -> SOAPResponse:
    return get_soap_error(faultstring="Authorization error")


def get_streamed_soap_response(response: requests.Response) -> SOAPResponse:
    """Get streamed SOAP response

    The SOAP requests to GG will be returned in chunks if response is large.
    This method handles building the response for chunked responses from the existing
    GG S2S SOAP API.
    """
    chunk_size = 8192
    data = b""
    for chunk in response.iter_content(chunk_size=chunk_size):
        data += chunk

    # We omit these headers to prevent issues from flask and wsgi from erroring chunked responses.
    response_headers = filter_headers(
        dict(response.headers), ["transfer-encoding", "keep-alive", "connection"]
    )

    return get_soap_response(data, status_code=response.status_code, headers=response_headers)


def filter_headers(headers: dict, headers_to_omit: list | None = None) -> dict:
    headers_to_omit = [i.lower() for i in headers_to_omit] if headers_to_omit else []
    if not headers_to_omit:
        return headers
    return {key: value for key, value in headers.items() if key.lower() not in headers_to_omit}


def ensure_dot_prefix(data: str) -> str:
    return data if data.startswith(".") else f".{data}"


def bool_to_string(value: bool | None) -> str | None:
    if value is None:
        return None
    return "true" if value else "false"
