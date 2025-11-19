"""Conditional transformation utilities for XML generation.

This module provides support for conditional logic in XML transformations,
including if/then/else rules, field dependencies, and computed fields.
"""

import logging
from typing import Any

from src.util.dict_util import get_nested_value

logger = logging.getLogger(__name__)


def _transform_nested_field_names(
    data: dict[str, Any], transform_config_root: dict[str, Any]
) -> dict[str, Any]:
    """Transform field names in a nested object based on transform rules."""
    if not isinstance(data, dict) or not transform_config_root:
        return data

    result = {}
    processed_fields = set()

    # First, iterate over transform config to maintain correct order per XSD
    for field_name, field_config in transform_config_root.items():
        # Skip metadata config fields
        if field_name.startswith("_"):
            continue

        # Check if this field exists in data
        if field_name not in data:
            continue

        field_value = data[field_name]

        # Skip metadata fields
        if field_name.startswith("__"):
            result[field_name] = field_value
            processed_fields.add(field_name)
            continue

        # Transform field name if configured
        if isinstance(field_config, dict):
            xml_transform = field_config.get("xml_transform", {})
            target_name = xml_transform.get("target")
            if target_name and xml_transform.get("type") != "attribute":
                # Use transformed name
                result[target_name] = field_value
                processed_fields.add(field_name)
                continue

        # Keep original name if no transformation found
        result[field_name] = field_value
        processed_fields.add(field_name)

    # Add any remaining fields from data that weren't in config (preserve as-is)
    for field_name, field_value in data.items():
        if field_name not in processed_fields:
            result[field_name] = field_value

    return result


def _apply_pivot_object_transform(
    transform_config: dict[str, Any], source_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Apply pivot transformation to restructure nested objects."""
    source_field = transform_config.get("source_field")
    field_mapping = transform_config.get("field_mapping", {})

    # Validate source_field is configured properly
    if not source_field or not isinstance(source_field, str):
        raise ConditionalTransformationError(
            "pivot_object requires 'source_field' to be a non-empty string"
        )

    # Get the source object to pivot
    source_path = source_field.split(".")
    source_object = get_nested_value(source_data, source_path)

    result = {}

    for target_field, target_subfields in field_mapping.items():
        if not isinstance(target_subfields, dict):
            continue

        # Build nested object for this target field
        nested_result = {}
        for target_subfield, source_path_str in target_subfields.items():
            # Parse the source path
            if not isinstance(source_path_str, str):
                continue

            path_parts = source_path_str.split(".")
            value = source_object

            # Navigate through the path
            for part in path_parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    value = None
                    break

            # Add value if found
            if value is not None:
                nested_result[target_subfield] = value

        # Only add target field if we got at least one value
        if nested_result:
            result[target_field] = nested_result

    return result if result else None


def _apply_array_decomposition_transform(
    transform_config: dict[str, Any],
    source_data: dict[str, Any],
    transform_config_root: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Apply array decomposition transformation.

    Transforms row-oriented array data into column-oriented structure by extracting
    specific fields from each array element and grouping them by field type. Supports
    XML wrapper elements and attributes for proper XML generation.

    Configuration options per field mapping:
    - item_field: Field to extract from each array item (required)
    - item_wrapper: XML wrapper element name for line items (optional)
    - item_attributes: List of attribute names to extract from source items (optional)
    - total_field: Field containing the total/summary (optional)
    - total_wrapper: XML wrapper element name for totals (optional)

    Args:
        transform_config: Array decomposition configuration
        source_data: Source data to transform
        transform_config_root: Root transform configuration for field name lookups
    """
    source_array_field = transform_config.get("source_array_field")
    field_mappings = transform_config.get("field_mappings", {})

    # Validate configuration
    if not source_array_field or not isinstance(source_array_field, str):
        raise ConditionalTransformationError(
            "array_decomposition requires 'source_array_field' to be a non-empty string"
        )

    if not field_mappings or not isinstance(field_mappings, dict):
        raise ConditionalTransformationError(
            "array_decomposition requires 'field_mappings' to be a non-empty dictionary"
        )

    # Get the source array
    source_path = source_array_field.split(".")
    source_array = get_nested_value(source_data, source_path)

    # If source array doesn't exist or is empty, return None
    if not source_array or not isinstance(source_array, list):
        return None

    result = {}

    # Process each field mapping
    for output_field_name, mapping_config in field_mappings.items():
        if not isinstance(mapping_config, dict):
            continue

        item_field = mapping_config.get("item_field")
        item_wrapper = mapping_config.get("item_wrapper")
        item_attributes = mapping_config.get("item_attributes", [])
        total_field = mapping_config.get("total_field")
        total_wrapper = mapping_config.get("total_wrapper")

        if not item_field:
            logger.warning(f"Skipping field mapping '{output_field_name}': missing 'item_field'")
            continue

        # Extract the field from each item in the array
        extracted_values = []
        for item in source_array:
            if isinstance(item, dict) and item_field in item:
                value = item[item_field]
                if value is not None:
                    # Wrap value with metadata if configured
                    if item_wrapper or item_attributes:
                        wrapped_value = {}

                        # Add wrapper element name
                        if item_wrapper:
                            wrapped_value["__wrapper"] = item_wrapper

                        # Extract attributes from source item
                        if item_attributes:
                            attrs = {}
                            for attr_name in item_attributes:
                                if attr_name in item and item[attr_name] is not None:
                                    # Transform attribute name if transform config is provided
                                    transformed_attr_name = attr_name
                                    if transform_config_root and attr_name in transform_config_root:
                                        attr_config = transform_config_root[attr_name]
                                        if isinstance(attr_config, dict):
                                            xml_transform = attr_config.get("xml_transform", {})
                                            if xml_transform.get("type") == "attribute":
                                                target_name = xml_transform.get("target")
                                                if target_name:
                                                    transformed_attr_name = target_name
                                    attrs[transformed_attr_name] = item[attr_name]
                            if attrs:
                                wrapped_value["__attributes"] = attrs

                        # Add the actual data
                        if isinstance(value, dict):
                            # Transform field names if transform config is provided
                            if transform_config_root:
                                value = _transform_nested_field_names(value, transform_config_root)
                            wrapped_value.update(value)
                        else:
                            wrapped_value["value"] = value

                        extracted_values.append(wrapped_value)
                    else:
                        extracted_values.append(value)

        # Add total field if configured and available
        if total_field:
            total_path = total_field.split(".")
            total_value = get_nested_value(source_data, total_path)
            if total_value is not None:
                # Wrap total value with metadata if configured
                if total_wrapper:
                    wrapped_total = {"__wrapper": total_wrapper}
                    if isinstance(total_value, dict):
                        # Transform field names if transform config is provided
                        if transform_config_root:
                            total_value = _transform_nested_field_names(
                                total_value, transform_config_root
                            )
                        wrapped_total.update(total_value)
                    else:
                        wrapped_total["value"] = total_value
                    extracted_values.append(wrapped_total)
                else:
                    extracted_values.append(total_value)

        # Add to result if we have any values
        if extracted_values:
            result[output_field_name] = extracted_values

    return result if result else None


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
        if not field_path or not isinstance(field_path, str):
            raise ConditionalTransformationError(
                "field_equals condition requires 'field' to be a non-empty string"
            )
        path_list = field_path.split(".")
        actual_value = get_nested_value(source_data, path_list)
        return actual_value == expected_value

    elif condition_type == "field_in":
        field_path = condition.get("field")
        allowed_values = condition.get("values", [])
        if not field_path or not isinstance(field_path, str):
            raise ConditionalTransformationError(
                "field_in condition requires 'field' to be a non-empty string"
            )
        path_list = field_path.split(".")
        actual_value = get_nested_value(source_data, path_list)
        return actual_value in allowed_values

    elif condition_type == "field_contains":
        field_path = condition.get("field")
        search_value = condition.get("value")
        if not field_path or not isinstance(field_path, str):
            raise ConditionalTransformationError(
                "field_contains condition requires 'field' to be a non-empty string"
            )
        path_list = field_path.split(".")
        actual_value = get_nested_value(source_data, path_list)
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
    transform_config: dict[str, Any],
    source_data: dict[str, Any],
    field_path: list[str],
    transform_config_root: dict[str, Any] | None = None,
) -> Any:
    """Apply conditional transformation logic.

    Supports:
    - one_to_many: Map array field to multiple XML elements
    - pivot_object: Restructure nested objects by pivoting dimensions
    - array_decomposition: Transform row-oriented arrays to column-oriented structure
    - conditional_structure: Select different structures based on data conditions

    Args:
        transform_config: Conditional transformation configuration
        source_data: Source data for evaluation
        field_path: Current field path for context
        transform_config_root: Root transform configuration for field name lookups

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
            # Validate source_field is a string
            if not isinstance(source_field, str):
                raise ConditionalTransformationError(
                    "one_to_many requires 'source_field' to be a string"
                )
            source_path = source_field.split(".")
            source_values = get_nested_value(source_data, source_path)

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

    elif transform_type == "array_decomposition":
        return _apply_array_decomposition_transform(
            transform_config, source_data, transform_config_root
        )

    else:
        raise ConditionalTransformationError(
            f"Unknown conditional transform type: {transform_type}"
        )
