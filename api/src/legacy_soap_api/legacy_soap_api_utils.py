import uuid
from typing import Any

from src.legacy_soap_api.legacy_soap_api_schemas import FaultMessage, SOAPResponse

BASE_SOAP_API_RESPONSE_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000",
    "Content-Type": 'multipart/related; type="application/xop+xml"',
}


def format_local_soap_response(response_data: bytes) -> bytes:
    # This is a format string for formatting local responses from the mock
    # soap server since it does not support manipulating the response.
    # The grants.gov SOAP API currently includes this data.
    response_id = str(uuid.uuid4())
    return (
        f"""
--uuid:{response_id}
Content-Type: application/xop+xml; charset=UTF-8; type=\"text/xml\"
Content-Transfer-Encoding: binary
Content-ID: <root.message@cxf.apache.org>{response_data.decode('utf-8')}
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
