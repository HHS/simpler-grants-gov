"""Configuration management for XML generation service."""

import logging
from typing import Any

from src.form_schema.forms.budget_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as BUDGET_NARRATIVE_TRANSFORM_RULES,
)
from src.form_schema.forms.project_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as PROJECT_NARRATIVE_TRANSFORM_RULES,
)
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES

logger = logging.getLogger(__name__)


def load_xml_transform_config(form_name: str) -> dict[str, Any]:
    """Load XML transformation rules for a given form."""
    try:
        form_name_upper = form_name.upper()

        if form_name_upper == "SF424_4_0":
            logger.info(f"Loaded transformation config for {form_name}")
            return FORM_XML_TRANSFORM_RULES
        elif form_name_upper == "PROJECTNARRATIVEATTACHMENTS_1_2":
            logger.info(f"Loaded transformation config for {form_name}")
            return PROJECT_NARRATIVE_TRANSFORM_RULES
        elif form_name_upper == "BUDGETNARRATIVEATTACHMENTS_1_2":
            logger.info(f"Loaded transformation config for {form_name}")
            return BUDGET_NARRATIVE_TRANSFORM_RULES
        else:
            logger.warning(f"No transformation config found for {form_name}")
            return {}
    except Exception as e:
        logger.error(f"Failed to load transformation config for {form_name}: {e}")
        return {}


def is_form_xml_supported(form_name: str) -> bool:
    """Check if a form has XML transformation rules configured."""
    config = load_xml_transform_config(form_name)
    return bool(config)
