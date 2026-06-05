from decimal import Decimal, InvalidOperation
from typing import Any

ZERO_DECIMAL = Decimal("0.00")  # For formatting and defining 0 for decimal/monetary


def convert_monetary_field(value: Any) -> Decimal:
    """Convert a monetary string to a decimal number. Can raise ValueError for invalid values."""

    # We store monetary amounts as strings, for the purposes
    # of doing math, we want to convert those to Decimals
    if value is None:
        return ZERO_DECIMAL

    if not isinstance(value, str):
        raise ValueError("Cannot convert value to monetary field, is not a string")

    try:
        return Decimal(value)
    except InvalidOperation as e:
        raise ValueError("Invalid decimal format, cannot process") from e


def quantize_decimal(value: Decimal) -> Decimal:
    """
    Quantize a decimal number to always contain 2 values after the decimal.

    This uses the default behavior of quantizing and rounds UP
    See: https://docs.python.org/3/library/decimal.html#decimal.ROUND_HALF_UP
    """
    return value.quantize(ZERO_DECIMAL)
