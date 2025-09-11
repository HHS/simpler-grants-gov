"""Conditional transformation utilities for XML generation.

This module provides support for conditional logic in XML transformations,
including if/then/else rules, field dependencies, and computed fields.
"""

import logging
from typing import Any, cast

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
        actual_value = _get_nested_value(source_data, cast(list[str], path_list))
        return actual_value == expected_value

    elif condition_type == "field_in":
        field_path = condition.get("field")
        allowed_values = condition.get("values", [])
        path_list = field_path.split(".") if isinstance(field_path, str) else (field_path or [])
        actual_value = _get_nested_value(source_data, cast(list[str], path_list))
        return actual_value in allowed_values

    elif condition_type == "field_contains":
        field_path = condition.get("field")
        search_value = condition.get("value")
        path_list = field_path.split(".") if isinstance(field_path, str) else (field_path or [])
        actual_value = _get_nested_value(source_data, cast(list[str], path_list))
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
    - if_then_else: Conditional field mapping
    - computed_field: Calculate value from other fields
    - required_when: Include field only when condition is met

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

    if transform_type == "if_then_else":
        condition = transform_config.get("if")
        then_config = transform_config.get("then")
        else_config = transform_config.get("else")

        if condition and evaluate_condition(condition, source_data):
            if then_config:
                return _apply_transform_action(then_config, source_data, field_path)
        elif else_config:
            return _apply_transform_action(else_config, source_data, field_path)
        else:
            return None

    elif transform_type == "computed_field":
        computation = transform_config.get("computation")
        if computation:
            return _apply_computation(computation, source_data, field_path)
        return None

    elif transform_type == "required_when":
        condition = transform_config.get("condition")
        value_config = transform_config.get("value")

        if condition and evaluate_condition(condition, source_data):
            if value_config:
                return _apply_transform_action(value_config, source_data, field_path)
        else:
            return None

    elif transform_type == "one_to_many":
        # Handle one-to-many field mappings (e.g., array to multiple XML elements)
        source_field = transform_config.get("source_field")
        target_pattern = transform_config.get("target_pattern")
        max_count = transform_config.get("max_count", 10)

        if source_field and target_pattern:
            source_path = (
                source_field.split(".") if isinstance(source_field, str) else (source_field or [])
            )
            source_values = _get_nested_value(source_data, cast(list[str], source_path))

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

    else:
        raise ConditionalTransformationError(
            f"Unknown conditional transform type: {transform_type}"
        )


def _apply_transform_action(
    action_config: dict[str, Any], source_data: dict[str, Any], field_path: list[str]
) -> Any:
    """Apply a transformation action (used in then/else clauses)."""
    action_type = action_config.get("type", "field_value")

    if action_type == "field_value":
        # Get value from another field
        source_field = action_config.get("field")
        path_list = (
            source_field.split(".") if isinstance(source_field, str) else (source_field or [])
        )
        return _get_nested_value(source_data, cast(list[str], path_list))

    elif action_type == "static_value":
        # Return a static value
        return action_config.get("value")

    elif action_type == "computed":
        # Apply a computation
        computation = action_config.get("computation")
        if computation:
            return _apply_computation(computation, source_data, field_path)
        return None

    else:
        raise ConditionalTransformationError(f"Unknown transform action type: {action_type}")


def _apply_computation(
    computation: dict[str, Any], source_data: dict[str, Any], field_path: list[str]
) -> Any:
    """Apply a computation to calculate a value."""
    computation_type = computation.get("type")

    if computation_type == "sum":
        # Sum multiple fields
        fields = computation.get("fields", [])
        total = 0.0
        for field in fields:
            path_list = field.split(".") if isinstance(field, str) else (field or [])
            value = _get_nested_value(source_data, cast(list[str], path_list))
            if value is not None:
                try:
                    # Handle both string and numeric values
                    if isinstance(value, str):
                        # Remove currency symbols and convert
                        cleaned = value.replace("$", "").replace(",", "")
                        total += float(cleaned)
                    else:
                        total += float(value)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Could not convert {value} to number for sum computation: {e}")

        # Format as currency string to match expected format
        return f"{total:.2f}"

    elif computation_type == "concat":
        # Concatenate multiple field values
        fields = computation.get("fields", [])
        separator = computation.get("separator", " ")
        values = []
        for field in fields:
            path_list = field.split(".") if isinstance(field, str) else (field or [])
            value = _get_nested_value(source_data, cast(list[str], path_list))
            if value is not None:
                values.append(str(value))
        return separator.join(values)

    elif computation_type == "format_template":
        # Format using a template string
        template = computation.get("template", "")
        fields = computation.get("fields", {})
        format_values = {}
        for key, field_path_str in fields.items():
            path_list = (
                field_path_str.split(".")
                if isinstance(field_path_str, str)
                else (field_path_str or [])
            )
            value = _get_nested_value(source_data, cast(list[str], path_list))
            format_values[key] = value if value is not None else ""
        return template.format(**format_values)

    else:
        raise ConditionalTransformationError(f"Unknown computation type: {computation_type}")


def _get_nested_value(data: dict[str, Any], path: list[str]) -> Any:
    """Get a nested value from a dictionary using a path."""
    current = data
    for part in path:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current
