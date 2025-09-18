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
