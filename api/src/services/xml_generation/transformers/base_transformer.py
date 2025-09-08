"""Base transformer for converting JSON data to XML-ready format."""

import logging
from typing import Any, Dict

from ..config import XMLTransformationConfig

logger = logging.getLogger(__name__)


class BaseTransformer:
    """Base class for transforming JSON data according to configuration rules."""

    def __init__(self, config: XMLTransformationConfig):
        self.config = config
        self.field_mappings = config.get_field_mappings()

    def transform(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
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
        for source_field, target_field in self.field_mappings.items():
            if source_field in source_data:
                value = source_data[source_field]
                transformed_data[target_field] = value
                logger.debug(f"Mapped {source_field} -> {target_field}: {value}")

        logger.info(f"Transformed {len(transformed_data)} fields from {len(source_data)} input fields")
        return transformed_data
