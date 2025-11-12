"""Tests for pivot_object transformation logic."""

import pytest

from src.services.xml_generation.conditional_transformers import (
    ConditionalTransformationError,
    apply_conditional_transform,
)


class TestPivotObjectTransformation:
    """Test pivot_object transformation for restructuring nested objects."""

    def test_pivot_forecasted_cash_needs_full_data(self):
        """Test pivoting forecasted cash needs with all fields populated."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.total_amount",
                    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.total_amount",
                },
                "BudgetFirstQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.first_quarter_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.first_quarter_amount",
                    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.first_quarter_amount",
                },
                "BudgetSecondQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.second_quarter_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.second_quarter_amount",
                    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.second_quarter_amount",
                },
                "BudgetThirdQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.third_quarter_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.third_quarter_amount",
                    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.third_quarter_amount",
                },
                "BudgetFourthQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.fourth_quarter_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.fourth_quarter_amount",
                    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs.fourth_quarter_amount",
                },
            },
        }

        source_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "1.00",
                    "second_quarter_amount": "3.00",
                    "third_quarter_amount": "5.00",
                    "fourth_quarter_amount": "7.00",
                    "total_amount": "16.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "2.00",
                    "second_quarter_amount": "4.00",
                    "third_quarter_amount": "6.00",
                    "fourth_quarter_amount": "8.00",
                    "total_amount": "20.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "3.00",
                    "second_quarter_amount": "7.00",
                    "third_quarter_amount": "11.00",
                    "fourth_quarter_amount": "15.00",
                    "total_amount": "36.00",
                },
            }
        }

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Verify the structure is pivoted correctly
        assert result is not None
        assert "BudgetFirstYearAmounts" in result
        assert "BudgetFirstQuarterAmounts" in result
        assert "BudgetSecondQuarterAmounts" in result
        assert "BudgetThirdQuarterAmounts" in result
        assert "BudgetFourthQuarterAmounts" in result

        # Verify first year amounts (totals)
        assert result["BudgetFirstYearAmounts"]["BudgetFederalForecastedAmount"] == "16.00"
        assert result["BudgetFirstYearAmounts"]["BudgetNonFederalForecastedAmount"] == "20.00"
        assert result["BudgetFirstYearAmounts"]["BudgetTotalForecastedAmount"] == "36.00"

        # Verify first quarter amounts
        assert result["BudgetFirstQuarterAmounts"]["BudgetFederalForecastedAmount"] == "1.00"
        assert result["BudgetFirstQuarterAmounts"]["BudgetNonFederalForecastedAmount"] == "2.00"
        assert result["BudgetFirstQuarterAmounts"]["BudgetTotalForecastedAmount"] == "3.00"

        # Verify second quarter amounts
        assert result["BudgetSecondQuarterAmounts"]["BudgetFederalForecastedAmount"] == "3.00"
        assert result["BudgetSecondQuarterAmounts"]["BudgetNonFederalForecastedAmount"] == "4.00"
        assert result["BudgetSecondQuarterAmounts"]["BudgetTotalForecastedAmount"] == "7.00"

        # Verify third quarter amounts
        assert result["BudgetThirdQuarterAmounts"]["BudgetFederalForecastedAmount"] == "5.00"
        assert result["BudgetThirdQuarterAmounts"]["BudgetNonFederalForecastedAmount"] == "6.00"
        assert result["BudgetThirdQuarterAmounts"]["BudgetTotalForecastedAmount"] == "11.00"

        # Verify fourth quarter amounts
        assert result["BudgetFourthQuarterAmounts"]["BudgetFederalForecastedAmount"] == "7.00"
        assert result["BudgetFourthQuarterAmounts"]["BudgetNonFederalForecastedAmount"] == "8.00"
        assert result["BudgetFourthQuarterAmounts"]["BudgetTotalForecastedAmount"] == "15.00"

    def test_pivot_forecasted_cash_needs_partial_data(self):
        """Test pivoting with some missing fields."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.total_amount",
                },
                "BudgetFirstQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.first_quarter_amount",
                },
            },
        }

        source_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "1.00",
                    "total_amount": "16.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "total_amount": "20.00",
                },
            }
        }

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        assert "BudgetFirstYearAmounts" in result
        assert "BudgetFirstQuarterAmounts" in result

        # First year should have both federal and non-federal
        assert result["BudgetFirstYearAmounts"]["BudgetFederalForecastedAmount"] == "16.00"
        assert result["BudgetFirstYearAmounts"]["BudgetNonFederalForecastedAmount"] == "20.00"

        # First quarter should only have federal (non-federal was not in source)
        assert result["BudgetFirstQuarterAmounts"]["BudgetFederalForecastedAmount"] == "1.00"
        assert "BudgetNonFederalForecastedAmount" not in result["BudgetFirstQuarterAmounts"]

    def test_pivot_missing_source_field(self):
        """Test pivot when source field is missing from data."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                },
            },
        }

        source_data = {"other_field": "value"}

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is None

    def test_pivot_source_field_not_dict(self):
        """Test pivot when source field is not a dictionary."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                },
            },
        }

        source_data = {"forecasted_cash_needs": "not_a_dict"}

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is None

    def test_pivot_empty_field_mapping(self):
        """Test pivot with empty field mapping."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {},
        }

        source_data = {
            "forecasted_cash_needs": {"federal_forecasted_cash_needs": {"total_amount": "16.00"}}
        }

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is None

    def test_pivot_missing_config_parameters(self):
        """Test pivot with missing configuration parameters."""
        # Missing source_field - should raise error
        transform_config = {
            "type": "pivot_object",
            "field_mapping": {"Target": {"Field": "source.field"}},
        }

        source_data = {"data": "value"}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError,
            match="pivot_object requires 'source_field' to be a non-empty string",
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

        # Missing field_mapping - returns None (empty result)
        transform_config = {"type": "pivot_object", "source_field": "data"}

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_pivot_with_none_values(self):
        """Test that None values are excluded from the pivoted result."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.total_amount",
                },
            },
        }

        source_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {"total_amount": "16.00"},
                "non_federal_forecasted_cash_needs": {"total_amount": None},
            }
        }

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        assert "BudgetFirstYearAmounts" in result
        # Federal should be present
        assert result["BudgetFirstYearAmounts"]["BudgetFederalForecastedAmount"] == "16.00"
        # Non-federal should be excluded because it was None
        assert "BudgetNonFederalForecastedAmount" not in result["BudgetFirstYearAmounts"]

    def test_pivot_all_values_none_excludes_target_field(self):
        """Test that if all values for a target field are None, the target field is excluded."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "forecasted_cash_needs",
            "field_mapping": {
                "BudgetFirstYearAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.total_amount",
                    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs.total_amount",
                },
                "BudgetFirstQuarterAmounts": {
                    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs.first_quarter_amount",
                },
            },
        }

        source_data = {
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "total_amount": None,
                    "first_quarter_amount": "1.00",
                },
                "non_federal_forecasted_cash_needs": {"total_amount": None},
            }
        }

        field_path = ["forecasted_cash_needs"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        # BudgetFirstYearAmounts should be excluded because all its values were None
        assert "BudgetFirstYearAmounts" not in result
        # BudgetFirstQuarterAmounts should be present
        assert "BudgetFirstQuarterAmounts" in result
        assert result["BudgetFirstQuarterAmounts"]["BudgetFederalForecastedAmount"] == "1.00"

    def test_pivot_deep_nested_path(self):
        """Test pivot with deeply nested source paths."""
        transform_config = {
            "type": "pivot_object",
            "source_field": "data.nested",
            "field_mapping": {
                "TargetField": {"SubField": "level1.level2.level3.value"},
            },
        }

        source_data = {
            "data": {"nested": {"level1": {"level2": {"level3": {"value": "deep_value"}}}}}
        }

        field_path = ["data", "nested"]
        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        assert "TargetField" in result
        assert result["TargetField"]["SubField"] == "deep_value"
