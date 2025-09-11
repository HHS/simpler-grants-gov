"""Tests for conditional transformation utilities."""

import pytest

from src.services.xml_generation.conditional_transformers import (
    ConditionalTransformationError,
    apply_conditional_transform,
    evaluate_condition,
)


class TestEvaluateCondition:
    """Test condition evaluation logic."""

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

    def test_field_equals_nested_field(self):
        """Test field_equals with nested field path."""
        condition = {
            "type": "field_equals",
            "field": "applicant_address.country_code",
            "value": "USA",
        }
        source_data = {"applicant_address": {"country_code": "USA", "city": "Washington"}}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_field_in_condition_true(self):
        """Test field_in condition that evaluates to True."""
        condition = {
            "type": "field_in",
            "field": "application_type",
            "values": ["Revision", "Continuation"],
        }
        source_data = {"application_type": "Revision"}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_field_in_condition_false(self):
        """Test field_in condition that evaluates to False."""
        condition = {
            "type": "field_in",
            "field": "application_type",
            "values": ["Revision", "Continuation"],
        }
        source_data = {"application_type": "New"}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_field_contains_condition_true(self):
        """Test field_contains condition that evaluates to True."""
        condition = {
            "type": "field_contains",
            "field": "applicant_type_code",
            "value": "X: Other (specify)",
        }
        source_data = {"applicant_type_code": ["A: State", "X: Other (specify)", "C: County"]}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_field_contains_condition_false(self):
        """Test field_contains condition that evaluates to False."""
        condition = {
            "type": "field_contains",
            "field": "applicant_type_code",
            "value": "X: Other (specify)",
        }
        source_data = {"applicant_type_code": ["A: State", "C: County"]}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_and_condition_all_true(self):
        """Test AND condition where all sub-conditions are true."""
        condition = {
            "type": "and",
            "conditions": [
                {"type": "field_equals", "field": "application_type", "value": "Revision"},
                {"type": "field_equals", "field": "delinquent_federal_debt", "value": True},
            ],
        }
        source_data = {"application_type": "Revision", "delinquent_federal_debt": True}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_and_condition_one_false(self):
        """Test AND condition where one sub-condition is false."""
        condition = {
            "type": "and",
            "conditions": [
                {"type": "field_equals", "field": "application_type", "value": "Revision"},
                {"type": "field_equals", "field": "delinquent_federal_debt", "value": True},
            ],
        }
        source_data = {"application_type": "Revision", "delinquent_federal_debt": False}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_or_condition_one_true(self):
        """Test OR condition where one sub-condition is true."""
        condition = {
            "type": "or",
            "conditions": [
                {"type": "field_equals", "field": "application_type", "value": "Revision"},
                {"type": "field_equals", "field": "application_type", "value": "Continuation"},
            ],
        }
        source_data = {"application_type": "Revision"}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_or_condition_all_false(self):
        """Test OR condition where all sub-conditions are false."""
        condition = {
            "type": "or",
            "conditions": [
                {"type": "field_equals", "field": "application_type", "value": "Revision"},
                {"type": "field_equals", "field": "application_type", "value": "Continuation"},
            ],
        }
        source_data = {"application_type": "New"}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_not_condition_true(self):
        """Test NOT condition that evaluates to True."""
        condition = {
            "type": "not",
            "condition": {"type": "field_equals", "field": "application_type", "value": "Revision"},
        }
        source_data = {"application_type": "New"}

        result = evaluate_condition(condition, source_data)
        assert result is True

    def test_not_condition_false(self):
        """Test NOT condition that evaluates to False."""
        condition = {
            "type": "not",
            "condition": {"type": "field_equals", "field": "application_type", "value": "Revision"},
        }
        source_data = {"application_type": "Revision"}

        result = evaluate_condition(condition, source_data)
        assert result is False

    def test_unknown_condition_type(self):
        """Test that unknown condition types raise an error."""
        condition = {"type": "unknown_condition"}
        source_data = {}

        with pytest.raises(
            ConditionalTransformationError, match="Unknown condition type: unknown_condition"
        ):
            evaluate_condition(condition, source_data)


class TestApplyConditionalTransform:
    """Test conditional transformation application."""

    def test_required_when_condition_met(self):
        """Test required_when transform when condition is met."""
        transform_config = {
            "type": "required_when",
            "condition": {"type": "field_equals", "field": "application_type", "value": "Revision"},
            "value": {"type": "field_value", "field": "revision_type"},
        }
        source_data = {"application_type": "Revision", "revision_type": "A: Increase Award"}

        result = apply_conditional_transform(transform_config, source_data, ["revision_type"])
        assert result == "A: Increase Award"

    def test_required_when_condition_not_met(self):
        """Test required_when transform when condition is not met."""
        transform_config = {
            "type": "required_when",
            "condition": {"type": "field_equals", "field": "application_type", "value": "Revision"},
            "value": {"type": "field_value", "field": "revision_type"},
        }
        source_data = {"application_type": "New", "revision_type": "A: Increase Award"}

        result = apply_conditional_transform(transform_config, source_data, ["revision_type"])
        assert result is None

    def test_if_then_else_condition_true(self):
        """Test if_then_else transform when condition is true."""
        transform_config = {
            "type": "if_then_else",
            "if": {"type": "field_equals", "field": "delinquent_federal_debt", "value": True},
            "then": {"type": "field_value", "field": "debt_explanation"},
            "else": {"type": "static_value", "value": "No debt"},
        }
        source_data = {
            "delinquent_federal_debt": True,
            "debt_explanation": "Payment plan established",
        }

        result = apply_conditional_transform(transform_config, source_data, ["debt_explanation"])
        assert result == "Payment plan established"

    def test_if_then_else_condition_false_with_else(self):
        """Test if_then_else transform when condition is false and else clause exists."""
        transform_config = {
            "type": "if_then_else",
            "if": {"type": "field_equals", "field": "delinquent_federal_debt", "value": True},
            "then": {"type": "field_value", "field": "debt_explanation"},
            "else": {"type": "static_value", "value": "No debt"},
        }
        source_data = {
            "delinquent_federal_debt": False,
            "debt_explanation": "Payment plan established",
        }

        result = apply_conditional_transform(transform_config, source_data, ["debt_explanation"])
        assert result == "No debt"

    def test_if_then_else_condition_false_no_else(self):
        """Test if_then_else transform when condition is false and no else clause."""
        transform_config = {
            "type": "if_then_else",
            "if": {"type": "field_equals", "field": "delinquent_federal_debt", "value": True},
            "then": {"type": "field_value", "field": "debt_explanation"},
        }
        source_data = {
            "delinquent_federal_debt": False,
            "debt_explanation": "Payment plan established",
        }

        result = apply_conditional_transform(transform_config, source_data, ["debt_explanation"])
        assert result is None

    def test_computed_field_sum(self):
        """Test computed field with sum calculation."""
        transform_config = {
            "type": "computed_field",
            "computation": {
                "type": "sum",
                "fields": [
                    "federal_estimated_funding",
                    "applicant_estimated_funding",
                    "state_estimated_funding",
                ],
            },
        }
        source_data = {
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "50000.00",
            "state_estimated_funding": "25000.00",
        }

        result = apply_conditional_transform(transform_config, source_data, ["total_funding"])
        assert result == "175000.00"

    def test_computed_field_sum_with_none_values(self):
        """Test computed field sum that handles None values gracefully."""
        transform_config = {
            "type": "computed_field",
            "computation": {
                "type": "sum",
                "fields": [
                    "federal_estimated_funding",
                    "applicant_estimated_funding",
                    "state_estimated_funding",
                ],
            },
        }
        source_data = {
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": None,
            "state_estimated_funding": "25000.00",
        }

        result = apply_conditional_transform(transform_config, source_data, ["total_funding"])
        assert result == "125000.00"

    def test_computed_field_concat(self):
        """Test computed field with concatenation."""
        transform_config = {
            "type": "computed_field",
            "computation": {
                "type": "concat",
                "fields": ["organization_name", "project_title"],
                "separator": " - ",
            },
        }
        source_data = {"organization_name": "Test University", "project_title": "Research Project"}

        result = apply_conditional_transform(transform_config, source_data, ["combined_title"])
        assert result == "Test University - Research Project"

    def test_computed_field_format_template(self):
        """Test computed field with template formatting."""
        transform_config = {
            "type": "computed_field",
            "computation": {
                "type": "format_template",
                "template": "{org} submits {project} for {amount}",
                "fields": {
                    "org": "organization_name",
                    "project": "project_title",
                    "amount": "federal_estimated_funding",
                },
            },
        }
        source_data = {
            "organization_name": "Test University",
            "project_title": "Research Project",
            "federal_estimated_funding": "$100,000",
        }

        result = apply_conditional_transform(transform_config, source_data, ["description"])
        assert result == "Test University submits Research Project for $100,000"

    def test_static_value_action(self):
        """Test static value transformation action."""
        transform_config = {
            "type": "required_when",
            "condition": {"type": "field_equals", "field": "always_true", "value": True},
            "value": {"type": "static_value", "value": "Static Result"},
        }
        source_data = {"always_true": True}

        result = apply_conditional_transform(transform_config, source_data, ["test_field"])
        assert result == "Static Result"

    def test_unknown_transform_type(self):
        """Test that unknown transform types raise an error."""
        transform_config = {"type": "unknown_transform"}
        source_data = {}

        with pytest.raises(
            ConditionalTransformationError,
            match="Unknown conditional transform type: unknown_transform",
        ):
            apply_conditional_transform(transform_config, source_data, ["test_field"])

    def test_unknown_action_type(self):
        """Test that unknown action types raise an error."""
        transform_config = {
            "type": "required_when",
            "condition": {"type": "field_equals", "field": "always_true", "value": True},
            "value": {"type": "unknown_action"},
        }
        source_data = {"always_true": True}

        with pytest.raises(
            ConditionalTransformationError, match="Unknown transform action type: unknown_action"
        ):
            apply_conditional_transform(transform_config, source_data, ["test_field"])

    def test_unknown_computation_type(self):
        """Test that unknown computation types raise an error."""
        transform_config = {
            "type": "computed_field",
            "computation": {"type": "unknown_computation"},
        }
        source_data = {}

        with pytest.raises(
            ConditionalTransformationError, match="Unknown computation type: unknown_computation"
        ):
            apply_conditional_transform(transform_config, source_data, ["test_field"])

    def test_one_to_many_mapping_with_array(self):
        """Test one-to-many mapping with array input."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant_type_code": ["A: State", "B: County", "C: Municipal"]}

        result = apply_conditional_transform(
            transform_config, source_data, ["applicant_type_code_mapping"]
        )

        expected = {
            "ApplicantTypeCode1": "A: State",
            "ApplicantTypeCode2": "B: County",
            "ApplicantTypeCode3": "C: Municipal",
        }
        assert result == expected

    def test_one_to_many_mapping_with_single_value(self):
        """Test one-to-many mapping with single value input."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant_type_code": "A: State"}

        result = apply_conditional_transform(
            transform_config, source_data, ["applicant_type_code_mapping"]
        )

        expected = {"ApplicantTypeCode1": "A: State"}
        assert result == expected

    def test_one_to_many_mapping_with_max_count_limit(self):
        """Test one-to-many mapping respects max_count limit."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 2,
        }
        source_data = {"applicant_type_code": ["A: State", "B: County", "C: Municipal", "D: Other"]}

        result = apply_conditional_transform(
            transform_config, source_data, ["applicant_type_code_mapping"]
        )

        # Should only include first 2 items due to max_count
        expected = {"ApplicantTypeCode1": "A: State", "ApplicantTypeCode2": "B: County"}
        assert result == expected

    def test_one_to_many_mapping_with_missing_source(self):
        """Test one-to-many mapping with missing source field."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant_type_code",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"other_field": "value"}

        result = apply_conditional_transform(
            transform_config, source_data, ["applicant_type_code_mapping"]
        )

        assert result is None

    def test_one_to_many_mapping_with_nested_source_field(self):
        """Test one-to-many mapping with nested source field path."""
        transform_config = {
            "type": "one_to_many",
            "source_field": "applicant.type_codes",
            "target_pattern": "ApplicantTypeCode{index}",
            "max_count": 3,
        }
        source_data = {"applicant": {"type_codes": ["A: State", "B: County"]}}

        result = apply_conditional_transform(
            transform_config, source_data, ["applicant_type_code_mapping"]
        )

        expected = {"ApplicantTypeCode1": "A: State", "ApplicantTypeCode2": "B: County"}
        assert result == expected
