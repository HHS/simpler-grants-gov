"""Log formatters for the API.

This module defines two formatters, JsonFormatter for machine-readable logs to
be used in production, and HumanReadableFormatter for human readable logs to
be used used during development.

See https://docs.python.org/3/library/logging.html#formatter-objects
"""

import json
import logging
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Callable, Type, TypeVar
from uuid import UUID

import src.logging.decodelog as decodelog

T = TypeVar("T")


# identity returns an unmodified object
def identity(obj: T) -> T:
    return obj


# Mapping of types to functions for conversion
# when writing logs to JSON
ENCODERS_BY_TYPE: dict[Type[Any], Callable[[Any], Any]] = {
    # JSONEncoder handles these properly already:
    # https://docs.python.org/3/library/json.html#json.JSONEncoder
    str: identity,
    int: identity,
    float: identity,
    bool: identity,
    list: identity,
    datetime: lambda d: d.isoformat(),
    date: lambda d: d.isoformat(),
    Enum: lambda e: e.value,
    set: lambda s: list(s),
    # The fallback below would do these,
    # but making it explicit that these
    # types are supported for logging.
    Decimal: str,
    UUID: str,
    Exception: str,
}


def json_encoder(obj: Any) -> Any:
    """
    Handle conversion of various types when logs
    are serialized into JSON. If not specified
    will attempt to convert using str() on the object
    """

    _type = type(obj)
    encode = ENCODERS_BY_TYPE.get(_type, str)

    """
    The recommended approach from the JSON docs
    is to call the default method from JSONEncoder
    to allow it to error anything not defined, we
    choose not to do that as we want to give a best
    effort for every value to be serialized for the logs
    https://docs.python.org/3/library/json.html

    If a field you are trying to log doesn't make sense
    to format as a string then please add it above, but be
    aware that the format needs to be parseable by whatever
    tools you are using to ingest logs and metrics.
    """
    return encode(obj)


class JsonFormatter(logging.Formatter):
    """A logging formatter which formats each line as JSON."""

    def format(self, record: logging.LogRecord) -> str:
        # logging.Formatter.format adds the `message` attribute to the LogRecord
        # see https://github.com/python/cpython/blob/main/Lib/logging/__init__.py#L690-L720
        super().format(record)

        return json.dumps(record.__dict__, separators=(",", ":"), default=json_encoder)


HUMAN_READABLE_FORMATTER_DEFAULT_MESSAGE_WIDTH = decodelog.DEFAULT_MESSAGE_WIDTH


class HumanReadableFormatter(logging.Formatter):
    """A logging formatter which formats each line
    as color-code human readable text
    """

    message_width: int

    def __init__(self, message_width: int = HUMAN_READABLE_FORMATTER_DEFAULT_MESSAGE_WIDTH):
        super().__init__()
        self.message_width = message_width

    def format(self, record: logging.LogRecord) -> str:
        message = super().format(record)
        return decodelog.format_line(
            datetime.fromtimestamp(record.created),
            record.name,
            record.funcName,
            record.levelname,
            message,
            record.__dict__,
            message_width=self.message_width,
        )
