"""Configuration management for XML generation service."""

import logging
from typing import Any

from src.form_schema.forms import get_active_forms, init_form_registry

logger = logging.getLogger(__name__)


def _build_xml_form_map() -> dict[str, dict[str, Any]]:
    """Build a dynamic map of form names (uppercase) to their XML transformation rules."""
    xml_form_map: dict[str, dict[str, Any]] = {}
    for form in get_active_forms():
        if form.json_to_xml_schema is not None:
            xml_form_map[form.short_form_name.upper()] = form.json_to_xml_schema
    return xml_form_map


def _build_xml_form_xsd_url_map() -> dict[str, str]:
    """Build a map of form names (uppercase) to their configured XSD schema URL.

    Reuses `_build_xml_form_map` so the form registry is only read in one
    place. Forms without an ``xsd_url`` configured (e.g. no XML transform
    config yet) are omitted.
    """
    xsd_urls: dict[str, str] = {}
    for form_name, transform_config in _build_xml_form_map().items():
        xml_config = (transform_config or {}).get("_xml_config", {})
        xsd_url = xml_config.get("xsd_url")
        if xsd_url:
            xsd_urls[form_name] = xsd_url
        else:
            logger.debug(f"No xsd_url configured for form: {form_name}")
    return xsd_urls


def load_xml_transform_config(form_name: str) -> dict[str, Any]:
    """Load XML transformation rules for a given form."""
    try:
        init_form_registry()
        xml_form_map = _build_xml_form_map()
        form_name_upper = form_name.upper()

        if form_name_upper in xml_form_map:
            logger.info(f"Loaded transformation config for {form_name}")
            return xml_form_map[form_name_upper]
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
