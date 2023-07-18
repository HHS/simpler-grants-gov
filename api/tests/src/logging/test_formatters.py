import json
import logging
import re
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import pytest

import src.logging.formatters as formatters
from tests.lib.assertions import assert_dict_contains


def test_json_formatter(capsys: pytest.CaptureFixture):
    logger = logging.getLogger("test_json_formatter")
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatters.JsonFormatter())
    logger.addHandler(console_handler)

    datetime_now = datetime.now()
    date_now = datetime_now.date()
    decimal_field = Decimal("12.34567")
    uuid_field = uuid4()
    set_field = {uuid4(), uuid4()}
    list_field = [1, 2, 3, 4]
    exception_field = ValueError("my exception message")
    logger.warning(
        "hello %s",
        "interpolated_string",
        extra={
            "foo": "bar",
            "int_field": 5,
            "bool_field": True,
            "none_field": None,
            "datetime_field": datetime_now,
            "date_field": date_now,
            "decimal_field": decimal_field,
            "uuid_field": uuid_field,
            "set_field": set_field,
            "list_field": list_field,
            "exception_field": exception_field,
        },
    )

    json_record = json.loads(capsys.readouterr().err)

    expected = {
        "name": "test_json_formatter",
        "message": "hello interpolated_string",
        "msg": "hello %s",
        "levelname": "WARNING",
        "levelno": 30,
        "filename": "test_formatters.py",
        "module": "test_formatters",
        "funcName": "test_json_formatter",
        "foo": "bar",
        "int_field": 5,
        "bool_field": True,
        "none_field": None,
        "datetime_field": datetime_now.isoformat(),
        "date_field": date_now.isoformat(),
        "decimal_field": str(decimal_field),
        "uuid_field": str(uuid_field),
        "set_field": [str(u) for u in set_field],
        "list_field": list_field,
        "exception_field": str(exception_field),
    }
    assert_dict_contains(json_record, expected)
    logger.removeHandler(console_handler)


def test_human_readable_formatter(capsys: pytest.CaptureFixture):
    logger = logging.getLogger("test_human_readable_formatter")
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatters.HumanReadableFormatter())
    logger.addHandler(console_handler)

    logger.warning("hello %s", "interpolated_string", extra={"foo": "bar"})

    text = capsys.readouterr().err
    created_time = text[:12]
    rest = text[12:]
    assert re.match(r"^\d{2}:\d{2}:\d{2}\.\d{3}", created_time)
    assert (
        rest
        == "  test_human_readable_formatter       \x1b[0m test_human_readable_formatter \x1b[31mWARNING \x1b[0m \x1b[31mhello interpolated_string                         \x1b[0m \x1b[34mfoo=bar\x1b[0m\n"
    )
    logger.removeHandler(console_handler)
