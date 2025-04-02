import uuid
from unittest.mock import patch

from src.legacy_soap_api.legacy_soap_api_utils import format_local_soap_response


def test_format_local_soap_response() -> None:
    mock_uuid = "mockuuid4"
    mock_response = b"mockresponse"
    expected = b'--uuid:mockuuid4\nContent-Type: application/xop+xml; charset=UTF-8; type="text/xml"\nContent-Transfer-Encoding: binary\nContent-ID: <root.message@cxf.apache.org>mockresponse\n--uuid:mockuuid4--'

    with patch.object(uuid, "uuid4", return_value=mock_uuid):
        given = format_local_soap_response(mock_response)
        assert expected == given
