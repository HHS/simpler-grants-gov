"""Value transformation utilities for XML generation."""

import logging
import re
from typing import Any, Callable

logger = logging.getLogger(__name__)


class ValueTransformationError(Exception):
    """Exception raised when value transformation fails."""

    pass


def transform_boolean_to_yes_no(value: Any) -> str:
    """Transform boolean values to Yes/No strings.

    Args:
        value: Boolean value to transform

    Returns:
        "Yes" for True, "No" for False

    Raises:
        ValueTransformationError: If value is not a boolean
    """
    if isinstance(value, bool):
        return "Yes" if value else "No"
    elif isinstance(value, str):
        # Handle string representations
        if value.lower() in ("true", "yes", "1"):
            return "Yes"
        elif value.lower() in ("false", "no", "0"):
            return "No"

    raise ValueTransformationError(f"Cannot convert {value} to Yes/No - expected boolean")


def transform_currency_format(value: Any, ensure_decimal: bool = True) -> str:
    """Transform currency values to proper decimal format.

    Args:
        value: Currency value (string or number)
        ensure_decimal: Whether to ensure .00 decimal places

    Returns:
        Formatted currency string

    Raises:
        ValueTransformationError: If currency formatting fails
    """
    if isinstance(value, (int, float)):
        # Convert number to string with proper decimal places
        if ensure_decimal:
            return f"{value:.2f}"
        else:
            return str(value)

    elif isinstance(value, str):
        # Validate and potentially reformat string
        # Remove any non-numeric characters except decimal point
        cleaned = re.sub(r"[^\d.]", "", value)

        if not cleaned:
            raise ValueTransformationError(f"Invalid currency value: '{value}'")

        try:
            # Convert to float and back to ensure proper format
            float_value = float(cleaned)
            if ensure_decimal:
                return f"{float_value:.2f}"
            else:
                return str(float_value)
        except ValueError as e:
            raise ValueTransformationError(f"Cannot parse currency value: '{value}'") from e

    else:
        raise ValueTransformationError(
            f"Currency value must be string or number, got {type(value)}"
        )


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

    try:
        return transformer(value, **params)
    except Exception as e:
        logger.warning(f"Value transformation failed for {transform_type}: {e}")
        # Return original value if transformation fails (graceful degradation)
        return value
