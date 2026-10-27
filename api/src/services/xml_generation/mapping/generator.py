"""Generate a form's XML from a mapping shaped like the XML (``xml_mapping.json``).

In two steps, as the CommonGrants SDK's ``transform_from_mapping`` does the first:

1. ``transform_from_mapping`` resolves the mapping against the response, with one handler
   per ``$`` word (``handlers.py``), into a tree shaped like the document.
2. ``write_xml`` writes that tree as XML (``xml_writer.py``).

The format itself is described in README.md beside this file.
"""

from typing import Any

from ..utils.attachment_mapping import AttachmentInfo
from .handlers import default_handlers
from .transform import Group, transform_from_mapping
from .xml_writer import write_xml

XML_MAPPING_FORMAT = "xml-mapping"


def is_xml_mapping(transform_config: dict[str, Any]) -> bool:
    """Whether a form's XML configuration is a mapping in this format."""
    return transform_config.get("format") == XML_MAPPING_FORMAT


def generate_xml_from_mapping(
    mapping: dict[str, Any],
    data: dict[str, Any],
    attachment_mapping: dict[str, AttachmentInfo] | None = None,
    pretty_print: bool = True,
) -> str:
    """The XML ``mapping`` builds from ``data``, a form's response."""
    handlers = default_handlers(attachment_mapping or {})
    root = transform_from_mapping(data, mapping["root"], handlers)
    if not isinstance(root, Group) or not root:
        root = Group({next(iter(mapping["root"])): Group()})
    return write_xml(root, mapping["namespaces"], pretty_print)
