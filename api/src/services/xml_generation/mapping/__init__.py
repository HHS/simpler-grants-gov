"""XML generation from a mapping shaped like the XML (``xml_mapping.json``)."""

from .fields import mapped_root_fields
from .generator import XML_MAPPING_FORMAT, generate_xml_from_mapping, is_xml_mapping

__all__ = [
    "XML_MAPPING_FORMAT",
    "generate_xml_from_mapping",
    "is_xml_mapping",
    "mapped_root_fields",
]
