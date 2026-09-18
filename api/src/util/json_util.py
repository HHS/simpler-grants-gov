from collections.abc import Callable
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import UUID


# identity returns an unmodified object
def identity[T](obj: T) -> T:
    return obj


# Mapping of types to functions for conversion
# when writing logs to JSON
ENCODERS_BY_TYPE: dict[type[Any], Callable[[Any], Any]] = {
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
