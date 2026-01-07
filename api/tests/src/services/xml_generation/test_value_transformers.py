"""Tests for value transformation utilities."""

import pytest

from src.services.xml_generation.constants import NO_VALUE, YES_VALUE
from src.services.xml_generation.value_transformers import (
    ValueTransformationError,
    apply_value_transformation,
    transform_boolean_to_yes_no,
    transform_currency_format,
    transform_map_values,
    transform_string_case,
    transform_truncate_string,
)


class TestBooleanTransformations:
    """Test boolean to Yes/No transformations."""

    def test_transform_boolean_to_yes_no_true(self):
        """Test transforming True to YES_VALUE."""
        result = transform_boolean_to_yes_no(True)
        assert result == YES_VALUE

    def test_transform_boolean_to_yes_no_false(self):
        """Test transforming False to NO_VALUE."""
        result = transform_boolean_to_yes_no(False)
        assert result == NO_VALUE

    def test_transform_boolean_to_yes_no_string_true(self):
        """Test transforming string 'true' to YES_VALUE."""
        assert transform_boolean_to_yes_no("true") == YES_VALUE
        assert transform_boolean_to_yes_no("TRUE") == YES_VALUE
        assert transform_boolean_to_yes_no("yes") == YES_VALUE
        assert transform_boolean_to_yes_no("1") == YES_VALUE
        assert transform_boolean_to_yes_no("y") == YES_VALUE

    def test_transform_boolean_to_yes_no_string_false(self):
        """Test transforming string 'false' to NO_VALUE."""
        assert transform_boolean_to_yes_no("false") == NO_VALUE
        assert transform_boolean_to_yes_no("FALSE") == NO_VALUE
        assert transform_boolean_to_yes_no("no") == NO_VALUE
        assert transform_boolean_to_yes_no("0") == NO_VALUE
        assert transform_boolean_to_yes_no("n") == NO_VALUE

    def test_transform_boolean_to_yes_no_invalid(self):
        """Test error handling for invalid boolean values."""
        with pytest.raises(ValueTransformationError):
            transform_boolean_to_yes_no("invalid")

        with pytest.raises(ValueTransformationError):
            transform_boolean_to_yes_no(42)


class TestCurrencyTransformations:
    """Test currency format transformations."""

    def test_transform_currency_string_valid(self):
        """Test currency transformation with valid string."""
        result = transform_currency_format("50000.00")
        assert result == "50000.00"

    def test_transform_currency_string_no_decimal(self):
        """Test currency transformation with integer string - now formats with .00."""
        result = transform_currency_format("50000")
        assert result == "50000.00"

    def test_transform_currency_string_decimal_only(self):
        """Test currency transformation with decimal starting with dot - adds leading zero."""
        result = transform_currency_format(".50")
        assert result == "0.50"

    def test_transform_currency_empty_string(self):
        """Test currency transformation with empty string - should raise error."""
        with pytest.raises(ValueTransformationError, match="Cannot convert currency value to decimal"):
            transform_currency_format("")

    def test_transform_currency_non_string_error(self):
        """Test error handling for non-string input."""
        with pytest.raises(ValueTransformationError):
            transform_currency_format(50000)  # Integer not allowed

        with pytest.raises(ValueTransformationError):
            transform_currency_format(50000.0)  # Float not allowed

    def test_transform_currency_invalid(self):
        """Test error handling for invalid currency values."""
        with pytest.raises(ValueTransformationError):
            transform_currency_format("not-a-number")

        with pytest.raises(ValueTransformationError):
            transform_currency_format("123.456")  # Too many decimal places

        with pytest.raises(ValueTransformationError):
            transform_currency_format("123.5")  # Single decimal place not allowed

        with pytest.raises(ValueTransformationError):
            transform_currency_format("$50,000.00")  # Currency symbols not allowed


class TestStringTransformations:
    """Test string case transformations."""

    def test_transform_string_case_upper(self):
        """Test uppercase transformation."""
        result = transform_string_case("hello world", "upper")
        assert result == "HELLO WORLD"

    def test_transform_string_case_lower(self):
        """Test lowercase transformation."""
        result = transform_string_case("HELLO WORLD", "lower")
        assert result == "hello world"

    def test_transform_string_case_title(self):
        """Test title case transformation."""
        result = transform_string_case("hello world", "title")
        assert result == "Hello World"

    def test_transform_string_case_invalid_type(self):
        """Test error handling for invalid case type."""
        with pytest.raises(ValueTransformationError):
            transform_string_case("hello", "invalid")

    def test_transform_string_case_non_string(self):
        """Test error handling for non-string input."""
        with pytest.raises(ValueTransformationError):
            transform_string_case(123, "upper")


class TestStringTruncation:
    """Test string truncation transformations."""

    def test_transform_truncate_string_normal(self):
        """Test normal string truncation."""
        result = transform_truncate_string("Hello World", 5)
        assert result == "Hello"

    def test_transform_truncate_string_no_truncation(self):
        """Test string shorter than max length."""
        result = transform_truncate_string("Hi", 5)
        assert result == "Hi"

    def test_transform_truncate_string_zero_length(self):
        """Test truncation to zero length."""
        result = transform_truncate_string("Hello", 0)
        assert result == ""

    def test_transform_truncate_string_negative_length(self):
        """Test error handling for negative max length."""
        with pytest.raises(ValueTransformationError):
            transform_truncate_string("Hello", -1)

    def test_transform_truncate_string_non_string(self):
        """Test error handling for non-string input."""
        with pytest.raises(ValueTransformationError):
            transform_truncate_string(123, 5)


class TestApplyValueTransformation:
    """Test the main value transformation function."""

    def test_apply_value_transformation_boolean(self):
        """Test applying boolean transformation."""
        config = {"type": "boolean_to_yes_no"}
        result = apply_value_transformation(True, config)
        assert result == YES_VALUE

    def test_apply_value_transformation_with_params(self):
        """Test applying transformation with parameters."""
        config = {"type": "truncate_string", "params": {"max_length": 5}}
        result = apply_value_transformation("Hello World", config)
        assert result == "Hello"

    def test_apply_value_transformation_no_type(self):
        """Test applying transformation with no type specified."""
        config = {}
        result = apply_value_transformation("unchanged", config)
        assert result == "unchanged"

    def test_apply_value_transformation_unknown_type(self):
        """Test error handling for unknown transformation type."""
        config = {"type": "unknown_transformation"}
        with pytest.raises(ValueTransformationError):
            apply_value_transformation("value", config)

    def test_apply_value_transformation_error_propagation(self):
        """Test that transformation errors propagate instead of graceful degradation."""
        config = {"type": "boolean_to_yes_no"}
        # This should raise an error, not return the original value
        with pytest.raises(ValueTransformationError):
            apply_value_transformation("not-a-boolean", config)


class TestMapValues:
    """Test map_values transformation."""

    def test_map_values_basic(self):
        """Test basic value mapping."""
        mappings = {"Prime": "Y: Yes", "SubAwardee": "N: No"}
        assert transform_map_values("Prime", mappings) == "Y: Yes"
        assert transform_map_values("SubAwardee", mappings) == "N: No"

    def test_map_values_string_conversion(self):
        """Test that values are converted to strings for lookup."""
        mappings = {"1": "One", "2": "Two", "3": "Three"}
        assert transform_map_values(1, mappings) == "One"
        assert transform_map_values("2", mappings) == "Two"

    def test_map_values_with_default(self):
        """Test mapping with default value for unmapped inputs."""
        mappings = {"A": "Alpha", "B": "Beta"}
        assert transform_map_values("C", mappings, default="Unknown") == "Unknown"

    def test_map_values_no_match_no_default(self):
        """Test error when value not in mappings and no default provided."""
        mappings = {"Prime": "Y: Yes"}
        with pytest.raises(ValueTransformationError) as exc_info:
            transform_map_values("SubAwardee", mappings)
        assert "not found in mappings" in str(exc_info.value)
        assert "Prime" in str(exc_info.value)

    def test_map_values_none_handling(self):
        """Test handling of None values."""
        mappings = {"None": "No Value", "Something": "Has Value"}
        assert transform_map_values(None, mappings) == "No Value"

    def test_map_values_via_apply_value_transformation(self):
        """Test map_values through the apply_value_transformation interface."""
        config = {
            "type": "map_values",
            "params": {"mappings": {"Prime": YES_VALUE, "SubAwardee": NO_VALUE}},
        }
        assert apply_value_transformation("Prime", config) == YES_VALUE
        assert apply_value_transformation("SubAwardee", config) == NO_VALUE

    def test_map_values_complex_mappings(self):
        """Test mapping to complex output values."""
        mappings = {
            "Grant": "a. Grant",
            "Cooperative Agreement": "b. Cooperative Agreement",
            "Contract": "c. Contract",
            "Loan": "d. Loan",
            "Loan Guarantee": "e. Loan Guarantee",
        }
        assert transform_map_values("Grant", mappings) == "a. Grant"
        assert transform_map_values("Loan Guarantee", mappings) == "e. Loan Guarantee"

    def test_map_values_numeric_output(self):
        """Test mapping to numeric output values."""
        mappings = {"low": 1, "medium": 5, "high": 10}
        assert transform_map_values("low", mappings) == 1
        assert transform_map_values("high", mappings) == 10
