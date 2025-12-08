"""Recursive transformer for converting JSON data to XML-ready format."""

import logging
import re
from typing import Any

from src.util.dict_util import get_nested_value

from ..conditional_transformers import apply_conditional_transform
from ..value_transformers import apply_value_transformation

logger = logging.getLogger(__name__)

# Pattern for field references: snake_case identifiers (lowercase letters, digits, underscores)
FIELD_REFERENCE_PATTERN = re.compile(r"^[a-z_][a-z0-9_]*$")


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
        # Store root data for conditional transformations
        self.root_source_data = source_data

        # Start recursive transformation from root
        result = self._process_transform_rules(source_data, self.transform_config, [])

        # Preserve root attribute values for XML generation
        # Root attributes are defined in _xml_config.xml_structure.root_attributes
        # and map attribute names to source field names or static values
        xml_config = self.transform_config.get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        root_attributes = xml_structure.get("root_attributes", {})

        if root_attributes:
            # Extract attribute values from source data
            root_attr_values = {}
            for attr_name, source_field_or_value in root_attributes.items():
                if isinstance(source_field_or_value, str):
                    # Determine if it's a field reference or static value
                    # Field references are snake_case identifiers (only lowercase, digits, underscores)
                    # Static values can have dots, hyphens, uppercase, or other characters
                    is_field_reference = bool(FIELD_REFERENCE_PATTERN.match(source_field_or_value))

                    if is_field_reference and source_field_or_value in source_data:
                        # It's a field reference and exists - get value from source data
                        root_attr_values[attr_name] = source_data[source_field_or_value]
                    elif not is_field_reference:
                        # It's a static value - always include it
                        root_attr_values[attr_name] = source_field_or_value
                    # else: It's a field reference but doesn't exist in data - skip it
                else:
                    # Non-string values are static values
                    root_attr_values[attr_name] = source_field_or_value

            # Store root attributes in result with special key
            if root_attr_values:
                result["__root_attributes__"] = root_attr_values

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

            # Process XML transformation rules
            if isinstance(rule_config, dict) and "xml_transform" in rule_config:
                self._process_xml_transform_rule(source_data, key, rule_config, path, result)

            # Process nested structure rules (dict without xml_transform)
            elif isinstance(rule_config, dict) and "xml_transform" not in rule_config:
                self._process_nested_structure_rule(source_data, key, rule_config, path, result)

        return result

    def _process_xml_transform_rule(
        self,
        source_data: dict[str, Any],
        key: str,
        rule_config: dict[str, Any],
        path: list[str],
        result: dict[str, Any],
    ) -> None:
        """Process a single XML transformation rule."""
        transform_rule = rule_config["xml_transform"]
        current_path = path + [key]

        # Check if this is a static value (no source data needed)
        if "static_value" in transform_rule:
            target_field = transform_rule["target"]
            static_val = transform_rule["static_value"]
            result[target_field] = static_val

            logger.debug(
                f"Applied static value for {'.'.join(current_path)} -> {target_field}: {static_val}"
            )
            return

        # Get the source value from the input data
        transform_type = transform_rule.get("type", "simple")
        source_value = get_nested_value(source_data, current_path)

        # Handle None values based on configuration
        processed_source_value = self._handle_none_values(
            source_value, transform_rule, transform_type, current_path
        )

        # If None handling returned None, skip this rule
        if (
            processed_source_value is None
            and source_value is None
            and transform_type != "conditional"
        ):
            return

        # Handle special marker for null inclusion
        if processed_source_value == "INCLUDE_NULL_MARKER":
            target_field = transform_rule["target"]
            result[target_field] = "INCLUDE_NULL_MARKER"
            logger.debug(f"Including None value for {'.'.join(current_path)} -> {target_field}")
            return

        # Use processed value if it was changed by None handling
        if processed_source_value is not None:
            source_value = processed_source_value

        # Apply the transformation (conditional transformations can handle None source values)
        if transform_type == "conditional" or source_value is not None:
            transformed_value = self._apply_transform_rule(
                source_value, transform_rule, rule_config, current_path
            )
        else:
            transformed_value = None

        # Add transformed value to result
        self._add_transformed_value_to_result(
            transformed_value, transform_rule, transform_type, current_path, source_value, result
        )

    def _process_nested_structure_rule(
        self,
        source_data: dict[str, Any],
        key: str,
        rule_config: dict[str, Any],
        path: list[str],
        result: dict[str, Any],
    ) -> None:
        """Process a nested structure rule (dict without xml_transform)."""
        # Get source data at this path level
        nested_source = get_nested_value(source_data, path + [key])
        if isinstance(nested_source, dict):
            # Recursively process nested rules
            nested_result = self._process_transform_rules(source_data, rule_config, path + [key])
            if nested_result:
                result.update(nested_result)

    def _handle_none_values(
        self,
        source_value: Any,
        transform_rule: dict[str, Any],
        transform_type: str,
        current_path: list[str],
    ) -> Any:
        """Handle None values based on configuration.

        Returns:
            - The original source_value if not None
            - A default value if None handling specifies one
            - None if the value should be excluded or included as null
        """
        if source_value is None and transform_type != "conditional":
            none_handling = transform_rule.get("null_handling", "exclude")

            if none_handling == "exclude":
                logger.debug(f"Excluding None value for {'.'.join(current_path)}")
                return None
            elif none_handling == "include_null":
                # Signal that we should include this field with null value
                return "INCLUDE_NULL_MARKER"
            elif none_handling == "default_value":
                # Use configured default value - error if not provided
                if "default_value" not in transform_rule:
                    raise ValueError(
                        f"null_handling 'default_value' specified but no default_value provided for {'.'.join(current_path)}"
                    )
                default_value = transform_rule["default_value"]
                logger.debug(f"Using default value '{default_value}' for {'.'.join(current_path)}")
                return default_value
            else:
                raise ValueError(
                    f"Unknown null_handling '{none_handling}' for {'.'.join(current_path)}"
                )

        return source_value

    def _add_transformed_value_to_result(
        self,
        transformed_value: Any,
        transform_rule: dict[str, Any],
        transform_type: str,
        current_path: list[str],
        source_value: Any,
        result: dict[str, Any],
    ) -> None:
        """Add transformed value to result dictionary."""
        # Add to result if transformation succeeded and produced non-None value
        if transformed_value is not None:
            conditional_transform = transform_rule.get("conditional_transform", {})
            conditional_type = conditional_transform.get("type")

            # Handle transforms that return dictionaries to be spread at current level
            # - one_to_many: Always spreads (never has a target)
            # - array_decomposition: Spreads only when no target is specified (for XSD compliance)
            if (
                isinstance(transformed_value, dict)
                and transform_type == "conditional"
                and (
                    conditional_type == "one_to_many"
                    or (
                        conditional_type == "array_decomposition"
                        and not transform_rule.get("target")
                    )
                )
            ):
                # Add all key-value pairs from the result (spread them at current level)
                result.update(transformed_value)
                logger.debug(
                    f"{conditional_type} transform {'.'.join(current_path)} -> {list(transformed_value.keys())}"
                )
            # Handle conditional_structure that returns nested objects
            elif (
                isinstance(transformed_value, dict)
                and transform_type == "conditional"
                and conditional_type == "conditional_structure"
            ):
                # Get the target field name from the transform rule
                target_field = transform_rule.get("target")
                if target_field:
                    result[target_field] = transformed_value
                    logger.debug(
                        f"Conditional structure transform {'.'.join(current_path)} -> {target_field}"
                    )
            else:
                # Standard field assignment for all other cases
                target_field = transform_rule["target"]
                result[target_field] = transformed_value

                logger.debug(
                    f"Transformed {'.'.join(current_path)} -> {target_field}: {source_value}"
                )

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
                # Pass root transform config for nested field name transformations
                conditional_result = apply_conditional_transform(
                    conditional_config, self.root_source_data, path, self.transform_config
                )

                # Check if this is a conditional_structure result
                if (
                    conditional_config.get("type") == "conditional_structure"
                    and isinstance(conditional_result, dict)
                    and "target" in conditional_result
                ):
                    # Handle conditional structure - extract and process nested fields
                    return self._process_conditional_structure(
                        conditional_result, source_value, path
                    )

                return conditional_result
            else:
                logger.warning(
                    f"Conditional transform specified but no conditional_transform config at {'.'.join(path)}"
                )
                return None

        elif transform_type == "nested_object":
            # For nested objects, we need to process the child rules recursively
            if not isinstance(source_value, dict):
                return None

            nested_result = {}

            # Process attributes if specified
            if "attributes" in transform_rule:
                attributes = {}
                for attr_name, attr_source_path in transform_rule["attributes"].items():
                    # attr_source_path can be a simple field name, a dotted path, or a static/literal value
                    if "." in attr_source_path:
                        # It's a dotted path - not supported yet for parent attributes
                        # For now, just get from current source_value
                        path_parts = attr_source_path.split(".")
                        if path_parts[0] in source_value:
                            attributes[attr_name] = source_value[path_parts[0]]
                    elif (
                        attr_source_path in source_value
                        and source_value[attr_source_path] is not None
                    ):
                        # It's a field name in source data - use its value
                        attributes[attr_name] = source_value[attr_source_path]
                    else:
                        # Not a field in source data - treat as static/literal value
                        attributes[attr_name] = attr_source_path

                if attributes:
                    nested_result["__attributes"] = attributes

            # Check if nested_fields is defined in the transform_rule
            nested_fields = transform_rule.get("nested_fields")

            if nested_fields:
                # New format: nested fields are inside nested_fields key
                for child_key, child_config in nested_fields.items():
                    if isinstance(child_config, dict) and "xml_transform" in child_config:
                        child_transform = child_config["xml_transform"]
                        if child_key in source_value and source_value[child_key] is not None:
                            child_value = source_value[child_key]

                            # Recursively process nested transformations
                            transformed_child = self._apply_transform_rule(
                                child_value, child_transform, child_config, path + [child_key]
                            )

                            if transformed_child is not None:
                                nested_result[child_transform["target"]] = transformed_child
            else:
                # Nested fields may be siblings of xml_transform in full_rule_config
                for child_key, child_config in full_rule_config.items():
                    if child_key == "xml_transform":
                        continue
                    if isinstance(child_config, dict) and "xml_transform" in child_config:
                        child_transform = child_config["xml_transform"]
                        if child_key in source_value and source_value[child_key] is not None:
                            child_value = source_value[child_key]

                            # Recursively process nested transformations
                            transformed_child = self._apply_transform_rule(
                                child_value, child_transform, child_config, path + [child_key]
                            )

                            if transformed_child is not None:
                                nested_result[child_transform["target"]] = transformed_child

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

    def _process_conditional_structure(
        self, structure_config: dict[str, Any], source_value: Any, path: list[str]
    ) -> dict[str, Any] | None:
        """Process a conditional structure configuration.

        Args:
            structure_config: Selected structure configuration (from if_true or if_false)
            source_value: Source data value at this path
            path: Current field path

        Returns:
            Nested dictionary with transformed fields, or None if source_value is not a dict
        """
        if not isinstance(source_value, dict):
            return None

        nested_result = {}
        nested_fields = structure_config.get("nested_fields", {})

        # Process each nested field according to its configuration
        for field_key, field_config in nested_fields.items():
            if not isinstance(field_config, dict):
                continue

            # Check if this nested field has an xml_transform
            if "xml_transform" in field_config:
                child_transform = field_config["xml_transform"]
                target_name = child_transform.get("target")

                if field_key in source_value:
                    field_value = source_value[field_key]

                    # Handle None values based on null_handling
                    if field_value is None:
                        null_handling = child_transform.get("null_handling", "exclude")
                        if null_handling == "exclude":
                            continue
                        elif null_handling == "include_null":
                            nested_result[target_name] = "INCLUDE_NULL_MARKER"
                            continue
                        elif null_handling == "default_value":
                            field_value = child_transform.get("default_value")

                    # Apply value transformation if specified
                    if "value_transform" in child_transform:
                        field_value = apply_value_transformation(
                            field_value, child_transform["value_transform"]
                        )

                    if field_value is not None:
                        nested_result[target_name] = field_value

        return nested_result if nested_result else None
