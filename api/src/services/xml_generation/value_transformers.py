"""Value transformation utilities for XML generation."""

import logging
import re
from collections.abc import Callable
from decimal import Decimal, InvalidOperation
from typing import Any

from .constants import CURRENCY_REGEX, NO_VALUE, YES_VALUE

logger = logging.getLogger(__name__)


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
    """Transform currency values to proper decimal format with 2 decimal places.

    Assumes input is already validated monetary string (per SF-424 regex constraints).
    Only supports string input to avoid float precision issues.
    Ensures all currency values have exactly 2 decimal places (e.g., "1" -> "1.00").

    Args:
        value: Currency value as string (validated upstream)

    Returns:
        Formatted currency string with exactly 2 decimal places

    Raises:
        ValueTransformationError: If value is not a string or cannot be parsed
    """
    if not isinstance(value, str):
        raise ValueTransformationError(
            f"Currency value must be string (validated upstream), got {type(value)}"
        )

    # Use currency regex from SF-424A form schema
    if not re.match(CURRENCY_REGEX, value):
        raise ValueTransformationError(
            f"Invalid currency format: '{value}' - must match pattern {CURRENCY_REGEX}"
        )

    # Convert to Decimal for precise formatting, then format with 2 decimal places
    try:
        decimal_value = Decimal(value)
        # Format with exactly 2 decimal places
        return f"{decimal_value:.2f}"
    except InvalidOperation:
        raise ValueTransformationError(
            f"Cannot convert currency value to decimal: '{value}'"
        ) from None


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


def transform_map_values(value: Any, mappings: dict[str, Any], default: Any = None) -> Any:
    """Map input values to output values based on a configuration dictionary.

    This is a generic value mapper that allows form-specific value transformations
    to be configured rather than hardcoded.

    Example:
        transform_map_values("Prime", {"Prime": "Y: Yes", "SubAwardee": "N: No"})
        # Returns: "Y: Yes"
    """
    # Convert value to string for mapping lookup
    lookup_value = str(value)

    if lookup_value in mappings:
        return mappings[lookup_value]
    elif default is not None:
        return default
    else:
        raise ValueTransformationError(
            f"Value '{value}' not found in mappings. Valid values: {list(mappings.keys())}"
        )


# Registry of available transformations
TRANSFORMATION_REGISTRY: dict[str, Callable[..., Any]] = {
    "boolean_to_yes_no": transform_boolean_to_yes_no,
    "currency_format": transform_currency_format,
    "string_case": transform_string_case,
    "truncate_string": transform_truncate_string,
    "map_values": transform_map_values,
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
