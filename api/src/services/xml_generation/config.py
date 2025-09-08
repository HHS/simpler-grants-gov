"""Configuration management for XML generation service."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class XMLTransformationConfig:
    """Manages transformation configuration for converting JSON to XML."""

    def __init__(self, form_name: str):
        self.form_name = form_name
        self._config = self._load_config()

    def _load_config(self) -> dict[str, Any]:
        """Load transformation rules from form schema module."""
        try:
            if self.form_name.upper() == "SF424_4_0":
                from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES
                logger.info(f"Loaded transformation config for {self.form_name} from sf424.py")
                return FORM_XML_TRANSFORM_RULES
            else:
                logger.warning(f"No transformation config found for {self.form_name}")
                return {}
        except ImportError as e:
            logger.error(f"Failed to import transformation config for {self.form_name}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Failed to load transformation config for {self.form_name}: {e}")
            return {}

    def get_field_mappings(self) -> dict[str, str]:
        """Get simple field name mappings (simpler_field -> grants_gov_field)."""
        return self._config.get("field_mappings", {})

    def get_xml_structure(self) -> dict:
        """Get the target XML structure definition."""
        return self._config.get("xml_structure", {})

    def get_namespace_config(self) -> dict:
        """Get XML namespace configuration."""
        return self._config.get("namespaces", {})
