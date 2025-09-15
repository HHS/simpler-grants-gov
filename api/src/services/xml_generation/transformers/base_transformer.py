"""Recursive transformer for converting JSON data to XML-ready format."""

import logging
from typing import Any

from ..conditional_transformers import apply_conditional_transform
from ..value_transformers import apply_value_transformation

logger = logging.getLogger(__name__)


class RecursiveXMLTransformer:
    """Recursive transformer using patterns from JSON rule processing."""

    def __init__(self, transform_config: dict[str, Any]):
        self.transform_config = transform_config
        self.root_source_data: dict[str, Any] = {}

    def transform(self, source_data: dict[str, Any]) -> dict[str, Any]:
        """Transform source data using recursive rule processing.

        Args:
            source_data: The input JSON data to transform

        Returns:
            Transformed data ready for XML generation
        """
        if not source_data:
            return {}

        # Store root data for conditional transformations
        self.root_source_data = source_data

        # Start recursive transformation from root
        result = self._process_transform_rules(source_data, self.transform_config, [])

        logger.info(
            f"Transformed {len(result)} fields from {len(source_data)} input fields using recursive pattern"
        )
        return result

    def _process_transform_rules(
        self, source_data: dict[str, Any], rules: dict[str, Any], path: list[str]
    ) -> dict[str, Any]:
        """Recursively process transformation rules, similar to JSON rule processing.

        Args:
            source_data: Input data at this level
            rules: Transformation rules at this level
            path: Current path in the data structure

        Returns:
            Transformed data at this level
        """
        result: dict[str, Any] = {}

        # Iterate over rules at this level
        for key, rule_config in rules.items():
            # Skip metadata keys
            if key.startswith("_"):
                continue

            # If this is an XML transformation rule, process it
            if isinstance(rule_config, dict) and "xml_transform" in rule_config:
                transform_rule = rule_config["xml_transform"]
                current_path = path + [key]

                # Get the source value from the input data
                transform_type = transform_rule.get("type", "simple")
                source_value = self._get_nested_value(source_data, current_path)

                # Handle None values based on configuration
                if source_value is None and transform_type != "conditional":
                    none_handling = transform_rule.get("null_handling", "exclude")

                    if none_handling == "exclude":
                        logger.debug(f"Excluding None value for {'.'.join(current_path)}")
                        continue
                    elif none_handling == "include_null":
                        # Include field with null/empty value
                        target_field = transform_rule["target"]
                        result[target_field] = None
                        logger.debug(
                            f"Including None value for {'.'.join(current_path)} -> {target_field}"
                        )
                        continue
                    elif none_handling == "default_value":
                        # Use configured default value
                        default_value = transform_rule.get("default_value", "")
                        source_value = default_value
                        logger.debug(
                            f"Using default value '{default_value}' for {'.'.join(current_path)}"
                        )
                    else:
                        logger.warning(
                            f"Unknown null_handling '{none_handling}' for {'.'.join(current_path)}, excluding field"
                        )
                        continue

                # Apply the transformation (conditional transformations can handle None source values)
                if transform_type == "conditional" or source_value is not None:
                    transformed_value = self._apply_transform_rule(
                        source_value, transform_rule, rule_config, current_path
                    )
                else:
                    transformed_value = None

                # Add to result if transformation succeeded and produced non-None value
                if transformed_value is not None:
                    # Handle one-to-many mappings that return dictionaries
                    if (
                        isinstance(transformed_value, dict)
                        and transform_type == "conditional"
                        and transform_rule.get("conditional_transform", {}).get("type")
                        == "one_to_many"
                    ):
                        # Add all key-value pairs from one-to-many result
                        result.update(transformed_value)
                        logger.debug(
                            f"One-to-many transform {'.'.join(current_path)} -> {list(transformed_value.keys())}"
                        )
                    else:
                        # Standard field assignment for all other cases
                        target_field = transform_rule["target"]
                        result[target_field] = transformed_value
                        logger.debug(
                            f"Transformed {'.'.join(current_path)} -> {target_field}: {source_value}"
                        )

            # If this is a nested structure (dict without xml_transform), recurse
            elif isinstance(rule_config, dict) and "xml_transform" not in rule_config:
                # Get source data at this path level
                nested_source = self._get_nested_value(source_data, path + [key])
                if isinstance(nested_source, dict):
                    # Recursively process nested rules
                    nested_result = self._process_transform_rules(
                        source_data, rule_config, path + [key]
                    )
                    if nested_result:
                        result.update(nested_result)

        return result

    def _apply_transform_rule(
        self, source_value: Any, transform_rule: dict, full_rule_config: dict, path: list[str]
    ) -> Any:
        """Apply a specific transformation rule to a source value."""
        transform_type = transform_rule.get("type", "simple")

        if transform_type == "conditional":
            # Handle conditional transformations
            conditional_config = transform_rule.get("conditional_transform")
            if conditional_config:
                # Use the stored root source data for condition evaluation
                return apply_conditional_transform(conditional_config, self.root_source_data, path)
            else:
                logger.warning(
                    f"Conditional transform specified but no conditional_transform config at {'.'.join(path)}"
                )
                return None

        elif transform_type == "nested_object":
            # For nested objects, we need to process the child rules
            if not isinstance(source_value, dict):
                return None

            nested_result = {}
            # Process child transformation rules
            for child_key, child_config in full_rule_config.items():
                if child_key == "xml_transform":
                    continue
                if isinstance(child_config, dict) and "xml_transform" in child_config:
                    child_transform = child_config["xml_transform"]
                    if child_key in source_value and source_value[child_key] is not None:
                        nested_result[child_transform["target"]] = source_value[child_key]
                        logger.debug(
                            f"Nested transform: {'.'.join(path)}.{child_key} -> {child_transform['target']}"
                        )

            return nested_result if nested_result else None
        else:
            # Simple transformation - apply value transformation if specified
            transformed_value = source_value

            # Check if there's a value transformation specified
            if "value_transform" in transform_rule:
                transformed_value = apply_value_transformation(
                    source_value, transform_rule["value_transform"]
                )
                logger.debug(
                    f"Applied value transformation at {'.'.join(path)}: {source_value} -> {transformed_value}"
                )

            return transformed_value

    def _get_nested_value(self, data: dict[str, Any], path: list[str]) -> Any:
        """Get a nested value from a dictionary using a path."""
        current = data
        for part in path:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current
