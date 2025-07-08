import uuid
from unittest.mock import Mock, patch

from src.legacy_soap_api.legacy_soap_api_schemas import SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    filter_headers,
    format_local_soap_response,
    get_auth_error_response,
    get_envelope_dict,
    get_streamed_soap_response,
)


def test_format_local_soap_response() -> None:
    mock_uuid = "mockuuid4"
    mock_response = b"mockresponse"
    expected = b'--uuid:mockuuid4\nContent-Type: application/xop+xml; charset=UTF-8; type="text/xml"\nContent-Transfer-Encoding: binary\nContent-ID: <root.message@cxf.apache.org>mockresponse\n--uuid:mockuuid4--'

    with patch.object(uuid, "uuid4", return_value=mock_uuid):
        given = format_local_soap_response(mock_response)
        assert expected == given


def test_get_envelope_dict() -> None:
    operation_name = "a"
    soap_xml_dict = {"Envelope": {"Body": {operation_name: {1: 1}}}}
    assert get_envelope_dict(soap_xml_dict, operation_name) == {1: 1}


def test_get_auth_error_response() -> None:
    err_response = get_auth_error_response()
    err = b"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <soap:Fault>
            <faultcode>soap:Server</faultcode>
            <faultstring>Auth error</faultstring>
        </soap:Fault>
    </soap:Body>
</soap:Envelope>
"""
    assert err in err_response.data
    assert err_response.status_code == 500


def test_filter_headers() -> None:
    assert filter_headers({"foo": "bar"}, ["foo"]) == {}
    assert filter_headers({"Foo": "bar"}, ["foo"]) == {}


def test_get_streamed_soap_response_success():
    # Simulate streamed response
    chunks = [b"<soap>", b"<body>Hello</body>", b"</soap>"]
    mock_response = Mock()
    mock_response.iter_content = Mock(return_value=chunks)
    mock_response.status_code = 200
    mock_response.headers = {
        "Content-Type": "application/xml",
        "Transfer-Encoding": "chunked",
        "Keep-Alive": "timeout=60",
        "Connection": "keep-alive",
    }

    result = get_streamed_soap_response(mock_response)

    expected_data = b"".join(chunks)
    expected_headers = {"Content-Type": "application/xml"}

    assert isinstance(result, SOAPResponse)
    assert result.data == expected_data
    assert result.status_code, 200
    assert result.headers == expected_headers
