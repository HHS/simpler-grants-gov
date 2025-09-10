"""Value transformation utilities for XML generation."""

import logging
import re
from typing import Any, Callable

logger = logging.getLogger(__name__)

# Grants.gov YesNoDataType constants from GlobalLibrary-V2.0.xsd
YES_VALUE = "Y: Yes"
NO_VALUE = "N: No"


class ValueTransformationError(Exception):
    """Exception raised when value transformation fails."""

    pass


def transform_boolean_to_yes_no(value: Any) -> str:
    """Transform boolean values to YesNoDataType format.

    Args:
        value: Boolean value to transform

    Returns:
        YES_VALUE for True, NO_VALUE for False (per Grants.gov YesNoDataType)

    Raises:
        ValueTransformationError: If value is not a boolean
    """
    if isinstance(value, bool):
        return YES_VALUE if value else NO_VALUE
    elif isinstance(value, str):
        # Handle string representations
        if value.lower() in ("true", "yes", "1", "y"):
            return YES_VALUE
        elif value.lower() in ("false", "no", "0", "n"):
            return NO_VALUE

    raise ValueTransformationError(
        f"Cannot convert {value} to {YES_VALUE}/{NO_VALUE} - expected boolean"
    )


def transform_currency_format(value: Any) -> str:
    """Transform currency values to proper decimal format.

    Assumes input is already validated monetary string (per SF-424 regex constraints).
    Only supports string input to avoid float precision issues.

    Args:
        value: Currency value as string (validated upstream)

    Returns:
        Cleaned currency string (removes symbols, keeps numeric value)

    Raises:
        ValueTransformationError: If value is not a string or cannot be parsed
    """
    if not isinstance(value, str):
        raise ValueTransformationError(
            f"Currency value must be string (validated upstream), got {type(value)}"
        )

    # Remove any non-numeric characters except decimal point
    cleaned = re.sub(r"[^\d.]", "", value)

    if not cleaned:
        raise ValueTransformationError(f"Invalid currency value: '{value}'")

    # Validate format
    if not re.match(r"^\d+(\.\d{1,2})?$", cleaned):
        raise ValueTransformationError(f"Invalid currency format: '{value}'")

    return cleaned


def transform_string_case(value: Any, case_type: str) -> str:
    """Transform string case.

    Args:
        value: String value to transform
        case_type: Type of case transformation ("upper", "lower", "title")

    Returns:
        Transformed string

    Raises:
        ValueTransformationError: If transformation fails
    """
    if not isinstance(value, str):
        raise ValueTransformationError(
            f"String transformation requires string input, got {type(value)}"
        )

    if case_type == "upper":
        return value.upper()
    elif case_type == "lower":
        return value.lower()
    elif case_type == "title":
        return value.title()
    else:
        raise ValueTransformationError(f"Unsupported case type: {case_type}")


def transform_truncate_string(value: Any, max_length: int) -> str:
    """Truncate string to maximum length.

    Args:
        value: String value to truncate
        max_length: Maximum allowed length

    Returns:
        Truncated string

    Raises:
        ValueTransformationError: If transformation fails
    """
    if not isinstance(value, str):
        raise ValueTransformationError(
            f"String truncation requires string input, got {type(value)}"
        )

    if max_length < 0:
        raise ValueTransformationError(f"Max length must be non-negative, got {max_length}")

    return value[:max_length] if len(value) > max_length else value


# Registry of available transformations
TRANSFORMATION_REGISTRY: dict[str, Callable[..., Any]] = {
    "boolean_to_yes_no": transform_boolean_to_yes_no,
    "currency_format": transform_currency_format,
    "string_case": transform_string_case,
    "truncate_string": transform_truncate_string,
}


def apply_value_transformation(value: Any, transformation_config: dict) -> Any:
    """Apply a value transformation based on configuration.

    Args:
        value: Value to transform
        transformation_config: Configuration specifying the transformation

    Returns:
        Transformed value

    Raises:
        ValueTransformationError: If transformation fails
    """
    transform_type = transformation_config.get("type")
    if not transform_type:
        return value  # No transformation specified

    if transform_type not in TRANSFORMATION_REGISTRY:
        raise ValueTransformationError(f"Unknown transformation type: {transform_type}")

    transformer = TRANSFORMATION_REGISTRY[transform_type]

    # Extract additional parameters
    params = transformation_config.get("params", {})

    # Let transformation errors propagate - no graceful degradation
    # Configuration or data issues should be caught and fixed, not hidden
    return transformer(value, **params)
