"""Configuration management for XML generation service."""

import logging
from typing import Any

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES

logger = logging.getLogger(__name__)


def load_xml_transform_config(form_name: str) -> dict[str, Any]:
    """Load XML transformation rules for a given form."""
    try:
        if form_name.upper() == "SF424_4_0":
            logger.info(f"Loaded transformation config for {form_name} from sf424.py")
            return FORM_XML_TRANSFORM_RULES
        else:
            logger.warning(f"No transformation config found for {form_name}")
            return {}
    except ImportError as e:
        logger.error(f"Failed to import transformation config for {form_name}: {e}")
        return {}
    except Exception as e:
        logger.error(f"Failed to load transformation config for {form_name}: {e}")
        return {}
