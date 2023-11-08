from enum import StrEnum


class ValidationErrorType(StrEnum):
    """
    Error type codes which clients
    need to be aware of in order
    to display proper messaging to users.

    *** WARNING ***
    Do not adjust these values unless you
    are certain that any and all users
    are aware of the change, safer to add a new one
    """

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
