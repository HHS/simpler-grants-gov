import json
import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

import pytest
import pytz

import grants_shared.util.json_util as json_util


class EnumField(StrEnum):
    MY_VALUE = "my_value"


@pytest.mark.parametrize(
    "value,expected",
    [
        # string
        ("hello", '{"field":"hello"}'),
        # int
        (5, '{"field":5}'),
        # float
        (1.5, '{"field":1.5}'),
        # bool
        (True, '{"field":true}'),
        # list
        ([1, 2, 3], '{"field":[1,2,3]}'),
        # datetime
        (
            datetime(2026, 5, 12, 12, 15, 25, tzinfo=pytz.utc),
            '{"field":"2026-05-12T12:15:25+00:00"}',
        ),
        # date
        (date(2026, 5, 12), '{"field":"2026-05-12"}'),
        # enum
        (EnumField.MY_VALUE, '{"field":"my_value"}'),
        # set
        ({1, 2, 3}, '{"field":[1,2,3]}'),
        # decimal
        (Decimal("1.234"), '{"field":"1.234"}'),
        # uuid
        (
            uuid.UUID("14975001-b561-4e5d-aad7-b60776984807"),
            '{"field":"14975001-b561-4e5d-aad7-b60776984807"}',
        ),
        # exception
        (ValueError("an error"), '{"field":"an error"}'),
    ],
)
def test_json_encoder(value, expected):
    """Test that the json encoder we have defined works to convert types"""
    raw_data = {"field": value}
    result = json.dumps(raw_data, separators=(",", ":"), default=json_util.json_encoder)
    assert result == expected
