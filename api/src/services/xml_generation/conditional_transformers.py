"""Conditional transformation utilities for XML generation.

This module provides support for conditional logic in XML transformations,
including if/then/else rules, field dependencies, and computed fields.
"""

import logging
from typing import Any, cast

from src.util.dict_util import get_nested_value

logger = logging.getLogger(__name__)


class ConditionalTransformationError(Exception):
    """Exception raised when conditional transformation fails."""

    pass


def evaluate_condition(condition: dict[str, Any], source_data: dict[str, Any]) -> bool:
    """Evaluate a conditional expression against source data.

    Supports various condition types:
    - field_equals: Check if field equals specific value
    - field_in: Check if field value is in a list
    - field_contains: Check if array field contains specific value
    - and: All conditions must be true
    - or: At least one condition must be true
    - not: Negate the condition

    Args:
        condition: Condition configuration dictionary
        source_data: Source data to evaluate against

    Returns:
        True if condition is met, False otherwise

    Raises:
        ConditionalTransformationError: If condition format is invalid
    """
    condition_type = condition.get("type")

    if condition_type == "field_equals":
        field_path = condition.get("field")
        expected_value = condition.get("value")
        path_list = field_path.split(".") if isinstance(field_path, str) else (field_path or [])
        actual_value = get_nested_value(source_data, cast(list[str], path_list))
        return actual_value == expected_value

    elif condition_type == "field_in":
        field_path = condition.get("field")
        allowed_values = condition.get("values", [])
        path_list = field_path.split(".") if isinstance(field_path, str) else (field_path or [])
        actual_value = get_nested_value(source_data, cast(list[str], path_list))
        return actual_value in allowed_values

    elif condition_type == "field_contains":
        field_path = condition.get("field")
        search_value = condition.get("value")
        path_list = field_path.split(".") if isinstance(field_path, str) else (field_path or [])
        actual_value = get_nested_value(source_data, cast(list[str], path_list))
        if isinstance(actual_value, list):
            return search_value in actual_value
        return False

    elif condition_type == "and":
        conditions = condition.get("conditions", [])
        return all(evaluate_condition(cond, source_data) for cond in conditions)

    elif condition_type == "or":
        conditions = condition.get("conditions", [])
        return any(evaluate_condition(cond, source_data) for cond in conditions)

    elif condition_type == "not":
        inner_condition = condition.get("condition")
        if inner_condition:
            return not evaluate_condition(inner_condition, source_data)
        return False

    else:
        raise ConditionalTransformationError(f"Unknown condition type: {condition_type}")


def apply_conditional_transform(
    transform_config: dict[str, Any], source_data: dict[str, Any], field_path: list[str]
) -> Any:
    """Apply conditional transformation logic.

    Supports:
    - one_to_many: Map array field to multiple XML elements
    - pivot_object: Restructure nested objects by pivoting dimensions
    - conditional_structure: Select different structures based on data conditions

    Args:
        transform_config: Conditional transformation configuration
        source_data: Source data for evaluation
        field_path: Current field path for context

    Returns:
        Transformed value or None if conditions not met

    Raises:
        ConditionalTransformationError: If transformation fails
    """
    transform_type = transform_config.get("type")

    if transform_type == "one_to_many":
        # Handle one-to-many field mappings (e.g., array to multiple XML elements)
        source_field = transform_config.get("source_field")
        target_pattern = transform_config.get("target_pattern")
        max_count = transform_config.get("max_count", 10)

        if source_field and target_pattern:
            source_path = (
                source_field.split(".") if isinstance(source_field, str) else (source_field or [])
            )
            source_values = get_nested_value(source_data, cast(list[str], source_path))

            if isinstance(source_values, list):
                result = {}
                for i, value in enumerate(source_values[:max_count]):  # Limit to max_count
                    target_field = target_pattern.format(index=i + 1)  # 1-based indexing
                    result[target_field] = value
                return result
            elif source_values is not None:
                # Single value - put it in the first position
                target_field = target_pattern.format(index=1)
                return {target_field: source_values}

        return None

    elif transform_type == "conditional_structure":
        # Handle conditional structure selection based on data conditions
        condition = transform_config.get("condition")
        if_true_config = transform_config.get("if_true")
        if_false_config = transform_config.get("if_false")

        if not condition:
            raise ConditionalTransformationError(
                "conditional_structure requires a 'condition' configuration"
            )

        if not if_true_config:
            raise ConditionalTransformationError(
                "conditional_structure requires an 'if_true' configuration"
            )

        # Evaluate the condition
        condition_result = evaluate_condition(condition, source_data)

        # Select the appropriate structure based on condition result
        selected_config = if_true_config if condition_result else if_false_config

        # If no config for this branch, return None (structure not applicable)
        if not selected_config:
            return None

        # Return the configuration that will be used by the transformer
        # This includes the target and any nested field mappings
        return selected_config

    elif transform_type == "pivot_object":
        return _apply_pivot_object_transform(transform_config, source_data)

    else:
        raise ConditionalTransformationError(
            f"Unknown conditional transform type: {transform_type}"
        )
