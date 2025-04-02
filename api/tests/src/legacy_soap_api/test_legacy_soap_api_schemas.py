import pytest
from pydantic import ValidationError

from src.legacy_soap_api.legacy_soap_api_schemas import LegacySOAPResponse


def test_legacy_soap_api_response_schema_missing_required_fields() -> None:
    with pytest.raises(ValidationError):
        LegacySOAPResponse()


def test_format_flask_response() -> None:
    res = LegacySOAPResponse(data=b"", status_code=200, headers={})
    given = res.to_flask_response()
    expected = (res.data, res.status_code, res.headers)
    assert given == expected
