from decimal import Decimal

import pytest

from src.util.decimal_util import ZERO_DECIMAL, convert_monetary_field, quantize_decimal


def test_convert_monetary_field():
    assert convert_monetary_field(None) == ZERO_DECIMAL
    assert convert_monetary_field("1") == Decimal("1")
    assert convert_monetary_field("1.0005") == Decimal("1.0005")


@pytest.mark.parametrize("value", [10, "hello", {}, "1.2.3.4.5"])
def test_convert_monetary_field_error_cases(value):
    with pytest.raises(ValueError):
        convert_monetary_field(value)


def test_quantize_decimal():
    assert quantize_decimal(Decimal("1.00")) == Decimal("1.00")
    assert quantize_decimal(Decimal("1.456")) == Decimal("1.46")
    assert quantize_decimal(Decimal("1.351")) == Decimal("1.35")
    assert quantize_decimal(Decimal("-.56")) == Decimal("-.56")
    assert quantize_decimal(Decimal("-1000.000001")) == Decimal("-1000.00")
    assert quantize_decimal(Decimal("100")) == Decimal("100")
    assert quantize_decimal(Decimal("20.1")) == Decimal("20.1")
