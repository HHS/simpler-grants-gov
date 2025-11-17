"""Tests for conditional transformation logic (simplified for one-to-many only)."""

import pytest

from src.services.xml_generation.conditional_transformers import (
    ConditionalTransformationError,
    apply_conditional_transform,
    evaluate_condition,
)


class TestEvaluateCondition:
    """Test basic condition evaluation logic (kept for potential future use)."""

    def test_field_equals_condition_true(self):
        """Test field_equals condition that evaluates to True."""
        condition = {"type": "field_equals", "field": "application_type", "value": "Revision"}
        source_data = {"application_type": "Revision"}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_field_equals_condition_false(self):
        """Test field_equals condition that evaluates to False."""
        condition = {"type": "field_equals", "field": "application_type", "value": "Revision"}
        source_data = {"application_type": "New"}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_unknown_condition_type(self):
        """Test that unknown condition types raise ConditionalTransformationError."""
        condition = {"type": "unknown_condition"}
        source_data = {"field": "value"}

        with pytest.raises(ConditionalTransformationError, match="Unknown condition type"):
            evaluate_condition(condition, source_data)


class TestApplyConditionalTransform:
    """Test conditional transformation logic (one-to-many only)."""

    def test_one_to_many_array_mapping(self):
        """Test one-to-many transformation with array input."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant_type_code": ["A", "B", "C"]}
        field_path = ["applicant_type_code_mapping"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "ApplicantTypeCode1": "A",
            "ApplicantTypeCode2": "B",
            "ApplicantTypeCode3": "C",
        }
        assert result == expected

    def test_one_to_many_single_value_mapping(self):
        """Test one-to-many transformation with single value input."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant_type_code": "A"}
        field_path = ["applicant_type_code_mapping"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {"ApplicantTypeCode1": "A"}
        assert result == expected

    def test_one_to_many_max_count_limit(self):
        """Test one-to-many transformation respects max_count limit."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 2,
        }
        source_data = {"applicant_type_code": ["A", "B", "C", "D"]}
        field_path = ["applicant_type_code_mapping"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "ApplicantTypeCode1": "A",
            "ApplicantTypeCode2": "B",
        }
        assert result == expected

    def test_one_to_many_missing_source_field(self):
        """Test one-to-many transformation with missing source field."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "missing_field",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"other_field": "value"}
        field_path = ["applicant_type_code_mapping"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_one_to_many_none_source_value(self):
        """Test one-to-many transformation with None source value."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant_type_code": None}
        field_path = ["applicant_type_code_mapping"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_unknown_transform_type(self):
        """Test that unknown transform types raise ConditionalTransformationError."""
        transform_config = {"type": "unknown_transform"}
        source_data = {"field": "value"}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError, match="Unknown conditional transform type"
        ):
            apply_conditional_transform(transform_config, source_data, field_path)


class TestArrayDecompositionTransform:
    """Test array decomposition transformation logic."""

    def test_array_decomposition_basic(self):
        """Test basic array decomposition with multiple fields."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "activity_line_items",
            "field_mappings": {
                "BudgetSummaries": {
                    "item_field": "budget_summary",
                    "total_field": "total_budget_summary",
                },
                "BudgetCategories": {
                    "item_field": "budget_categories",
                    "total_field": "total_budget_categories",
                },
            },
        }
        source_data = {
            "activity_line_items": [
                {
                    "activity_title": "Activity 1",
                    "budget_summary": {"amount": "1000"},
                    "budget_categories": {"personnel": "500"},
                },
                {
                    "activity_title": "Activity 2",
                    "budget_summary": {"amount": "2000"},
                    "budget_categories": {"personnel": "1000"},
                },
            ],
            "total_budget_summary": {"amount": "3000"},
            "total_budget_categories": {"personnel": "1500"},
        }
        field_path = ["budget_sections"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "BudgetSummaries": [
                {"amount": "1000"},
                {"amount": "2000"},
                {"amount": "3000"},
            ],
            "BudgetCategories": [
                {"personnel": "500"},
                {"personnel": "1000"},
                {"personnel": "1500"},
            ],
        }
        assert result == expected

    def test_array_decomposition_without_totals(self):
        """Test array decomposition without total fields."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
                "Values": {
                    "item_field": "value",
                },
            },
        }
        source_data = {
            "items": [
                {"name": "Item1", "value": 100},
                {"name": "Item2", "value": 200},
                {"name": "Item3", "value": 300},
            ],
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "Names": ["Item1", "Item2", "Item3"],
            "Values": [100, 200, 300],
        }
        assert result == expected

    def test_array_decomposition_with_missing_item_fields(self):
        """Test array decomposition when some items don't have the field."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {
            "items": [
                {"name": "Item1"},
                {"other_field": "value"},  # missing 'name'
                {"name": "Item3"},
            ],
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should only include items that have the field
        expected = {
            "Names": ["Item1", "Item3"],
        }
        assert result == expected

    def test_array_decomposition_with_none_values(self):
        """Test array decomposition skips None values in items."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Values": {
                    "item_field": "value",
                },
            },
        }
        source_data = {
            "items": [
                {"value": 100},
                {"value": None},  # Should be skipped
                {"value": 300},
            ],
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "Values": [100, 300],
        }
        assert result == expected

    def test_array_decomposition_empty_array(self):
        """Test array decomposition with empty source array."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {
            "items": [],
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_array_decomposition_missing_source_array(self):
        """Test array decomposition with missing source array."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {
            "other_field": "value",
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_array_decomposition_none_source_array(self):
        """Test array decomposition with None source array."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {
            "items": None,
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None

    def test_array_decomposition_missing_total_field(self):
        """Test array decomposition when total field is missing."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Values": {
                    "item_field": "value",
                    "total_field": "total_value",
                },
            },
        }
        source_data = {
            "items": [
                {"value": 100},
                {"value": 200},
            ],
            # total_value is missing
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should still work without total
        expected = {
            "Values": [100, 200],
        }
        assert result == expected

    def test_array_decomposition_none_total_field(self):
        """Test array decomposition when total field is None."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Values": {
                    "item_field": "value",
                    "total_field": "total_value",
                },
            },
        }
        source_data = {
            "items": [
                {"value": 100},
                {"value": 200},
            ],
            "total_value": None,
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should not include None total
        expected = {
            "Values": [100, 200],
        }
        assert result == expected

    def test_array_decomposition_nested_source_field(self):
        """Test array decomposition with nested source array path."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "budget.line_items",
            "field_mappings": {
                "Amounts": {
                    "item_field": "amount",
                },
            },
        }
        source_data = {
            "budget": {
                "line_items": [
                    {"amount": 1000},
                    {"amount": 2000},
                ],
            },
        }
        field_path = ["budget_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "Amounts": [1000, 2000],
        }
        assert result == expected

    def test_array_decomposition_nested_total_field(self):
        """Test array decomposition with nested total field path."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Values": {
                    "item_field": "value",
                    "total_field": "summary.total_value",
                },
            },
        }
        source_data = {
            "items": [
                {"value": 100},
                {"value": 200},
            ],
            "summary": {
                "total_value": 300,
            },
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        expected = {
            "Values": [100, 200, 300],
        }
        assert result == expected

    def test_array_decomposition_missing_source_array_field_config(self):
        """Test array decomposition raises error when source_array_field is missing."""
        transform_config = {
            "type": "array_decomposition",
            # Missing source_array_field
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {"items": []}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError,
            match="array_decomposition requires 'source_array_field'",
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_array_decomposition_invalid_source_array_field_type(self):
        """Test array decomposition raises error when source_array_field is not a string."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": ["items"],  # Should be string, not list
            "field_mappings": {
                "Names": {
                    "item_field": "name",
                },
            },
        }
        source_data = {"items": []}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError,
            match="array_decomposition requires 'source_array_field'",
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_array_decomposition_missing_field_mappings(self):
        """Test array decomposition raises error when field_mappings is missing."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            # Missing field_mappings
        }
        source_data = {"items": []}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError,
            match="array_decomposition requires 'field_mappings'",
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_array_decomposition_invalid_field_mappings_type(self):
        """Test array decomposition raises error when field_mappings is not a dict."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": "invalid",  # Should be dict, not string
        }
        source_data = {"items": []}
        field_path = ["test"]

        with pytest.raises(
            ConditionalTransformationError,
            match="array_decomposition requires 'field_mappings'",
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_array_decomposition_all_fields_excluded(self):
        """Test array decomposition returns None when all fields are excluded."""
        transform_config = {
            "type": "array_decomposition",
            "source_array_field": "items",
            "field_mappings": {
                "Values": {
                    "item_field": "missing_field",  # Field doesn't exist in items
                },
            },
        }
        source_data = {
            "items": [
                {"name": "Item1"},
                {"name": "Item2"},
            ],
        }
        field_path = ["items_decomposition"]

        result = apply_conditional_transform(transform_config, source_data, field_path)
        assert result is None


class TestConditionalStructure:
    """Test conditional structure selection logic."""

    def test_conditional_structure_if_true_branch(self):
        """Test conditional structure selects if_true branch when condition is True."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {"type": "field_equals", "field": "entity_type", "value": "prime"},
            "if_true": {
                "target": "PrimeEntity",
                "nested_fields": {
                    "organization_name": {
                        "xml_transform": {"target": "PrimeName", "type": "simple"}
                    },
                    "uei_number": {"xml_transform": {"target": "PrimeUEI", "type": "simple"}},
                },
            },
            "if_false": {
                "target": "SubawardeeEntity",
                "nested_fields": {
                    "organization_name": {
                        "xml_transform": {"target": "SubawardeeName", "type": "simple"}
                    }
                },
            },
        }
        source_data = {"entity_type": "prime"}
        field_path = ["report_entity"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should return the if_true configuration
        assert result is not None
        assert result["target"] == "PrimeEntity"
        assert "nested_fields" in result
        assert "organization_name" in result["nested_fields"]
        assert "uei_number" in result["nested_fields"]

    def test_conditional_structure_if_false_branch(self):
        """Test conditional structure selects if_false branch when condition is False."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {"type": "field_equals", "field": "entity_type", "value": "prime"},
            "if_true": {
                "target": "PrimeEntity",
                "nested_fields": {
                    "organization_name": {
                        "xml_transform": {"target": "PrimeName", "type": "simple"}
                    }
                },
            },
            "if_false": {
                "target": "SubawardeeEntity",
                "nested_fields": {
                    "organization_name": {
                        "xml_transform": {"target": "SubawardeeName", "type": "simple"}
                    }
                },
            },
        }
        source_data = {"entity_type": "subawardee"}
        field_path = ["report_entity"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should return the if_false configuration
        assert result is not None
        assert result["target"] == "SubawardeeEntity"
        assert "nested_fields" in result
        assert "organization_name" in result["nested_fields"]

    def test_conditional_structure_no_if_false_returns_none(self):
        """Test conditional structure returns None when if_false is missing and condition is False."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {"type": "field_equals", "field": "entity_type", "value": "prime"},
            "if_true": {
                "target": "PrimeEntity",
                "nested_fields": {
                    "organization_name": {
                        "xml_transform": {"target": "PrimeName", "type": "simple"}
                    }
                },
            },
            # No if_false branch
        }
        source_data = {"entity_type": "subawardee"}
        field_path = ["report_entity"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        # Should return None when condition is False and no if_false branch
        assert result is None

    def test_conditional_structure_missing_condition_raises_error(self):
        """Test conditional structure raises error when condition is missing."""
        transform_config = {
            "type": "conditional_structure",
            # No condition
            "if_true": {"target": "PrimeEntity", "nested_fields": {}},
        }
        source_data = {"entity_type": "prime"}
        field_path = ["report_entity"]

        with pytest.raises(
            ConditionalTransformationError, match="conditional_structure requires a 'condition'"
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_conditional_structure_missing_if_true_raises_error(self):
        """Test conditional structure raises error when if_true is missing."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {"type": "field_equals", "field": "entity_type", "value": "prime"},
            # No if_true
        }
        source_data = {"entity_type": "prime"}
        field_path = ["report_entity"]

        with pytest.raises(
            ConditionalTransformationError, match="conditional_structure requires an 'if_true'"
        ):
            apply_conditional_transform(transform_config, source_data, field_path)

    def test_conditional_structure_with_complex_condition(self):
        """Test conditional structure with complex AND condition."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {
                "type": "and",
                "conditions": [
                    {"type": "field_equals", "field": "entity_type", "value": "prime"},
                    {"type": "field_equals", "field": "report_type", "value": "final"},
                ],
            },
            "if_true": {"target": "PrimeFinalReport", "nested_fields": {}},
            "if_false": {"target": "OtherReport", "nested_fields": {}},
        }
        source_data = {"entity_type": "prime", "report_type": "final"}
        field_path = ["report"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        assert result["target"] == "PrimeFinalReport"

    def test_conditional_structure_with_field_in_condition(self):
        """Test conditional structure with field_in condition."""
        transform_config = {
            "type": "conditional_structure",
            "condition": {
                "type": "field_in",
                "field": "entity_type",
                "values": ["prime", "contractor"],
            },
            "if_true": {"target": "PrimeOrContractor", "nested_fields": {}},
            "if_false": {"target": "OtherEntity", "nested_fields": {}},
        }
        source_data = {"entity_type": "contractor"}
        field_path = ["entity"]

        result = apply_conditional_transform(transform_config, source_data, field_path)

        assert result is not None
        assert result["target"] == "PrimeOrContractor"
