from enum import StrEnum


class SchemaValidationError(StrEnum):
    """Contains error type codes that we can return from our schemas."""

    REQUIRED = "required"
    NOT_NULL = "not_null"
    UNKNOWN = "unknown"
    INVALID = "invalid"

    FORMAT = "format"
    INVALID_CHOICE = "invalid_choice"
    SPECIAL_NUMERIC = "special_numeric"

    MIN_LENGTH = "min_length"
    MAX_LENGTH = "max_length"
    MIN_OR_MAX_LENGTH = "min_or_max_length"
    EQUALS = "equals"

    MIN_VALUE = "min_value"
    MAX_VALUE = "max_value"
    MIN_OR_MAX_VALUE = "min_or_max_value"
