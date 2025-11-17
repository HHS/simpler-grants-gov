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
