"""Base transformer for converting JSON data to XML-ready format."""

import logging
from typing import Any

from ..config import XMLTransformationConfig

logger = logging.getLogger(__name__)


class BaseTransformer:
    """Base class for transforming JSON data according to configuration rules."""

    def __init__(self, config: XMLTransformationConfig):
        self.config = config
        self.field_mappings = config.get_field_mappings()

    def transform(self, source_data: dict[str, Any]) -> dict[str, Any]:
        """Transform source data according to configuration rules.

        Args:
            source_data: The input JSON data to transform

        Returns:
            Transformed data ready for XML generation
        """
        if not source_data:
            return {}

        transformed_data = {}

        # Apply field mappings
        for source_field, mapping_config in self.field_mappings.items():
            if source_field in source_data:
                value = source_data[source_field]

                # Handle object-based mappings
                if isinstance(mapping_config, dict):  # type: ignore[unreachable]
                    if mapping_config.get("type") == "nested_object":  # type: ignore[unreachable]
                        # Handle nested object transformation
                        nested_data = self._transform_nested_object(value, mapping_config)
                        if nested_data:
                            transformed_data[mapping_config["name"]] = nested_data
                    else:
                        # Simple object mapping
                        target_field = mapping_config.get("name", source_field)
                        transformed_data[target_field] = value
                        logger.debug(f"Mapped {source_field} -> {target_field}: {value}")
                elif isinstance(mapping_config, str):
                    # Legacy string mapping (backward compatibility)
                    transformed_data[mapping_config] = value
                    logger.debug(f"Mapped {source_field} -> {mapping_config}: {value}")

        logger.info(
            f"Transformed {len(transformed_data)} fields from {len(source_data)} input fields"
        )
        return transformed_data

    def _transform_nested_object(
        self, source_value: Any, mapping_config: dict
    ) -> dict[str, Any] | None:
        """Transform a nested object according to field mappings."""
        if not isinstance(source_value, dict):
            return None

        nested_result = {}
        field_mappings = mapping_config.get("fields", {})

        for source_field, target_field in field_mappings.items():
            if source_field in source_value and source_value[source_field] is not None:
                nested_result[target_field] = source_value[source_field]
                logger.debug(
                    f"Nested mapping: {source_field} -> {target_field}: {source_value[source_field]}"
                )

        return nested_result if nested_result else None
