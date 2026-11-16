"""Write a resolved mapping (``transform_from_mapping``'s tree) as Grants.gov XML.

A key without a prefix is in the form's namespace, ``prefix:Name`` is in another, and
``@prefix:Name`` is an attribute. A ``Group`` is an element's children, a list repeats its
element once per entry, an ``AttachmentInfo`` is an ``att:AttachedFileDataType``, an
``EmptyElement`` is an element with no content, and anything else is the element's text. The
output matches the current generator's: the same namespace declarations, serialization and
attachment elements.
"""

from typing import Any

from lxml import etree as lxml_etree

from ..utils.attachment_mapping import AttachmentInfo
from .handlers import EmptyElement
from .transform import Group

ATTACHMENTS_NS = "http://apply.grants.gov/system/Attachments-V1.0"
GLOBAL_NS = "http://apply.grants.gov/system/Global-V1.0"

# =============================================================================
# PUBLIC FUNCTIONS
# =============================================================================


def write_xml(root: Group, namespaces: dict[str, str], pretty_print: bool = True) -> str:
    """``root``, one key naming the root element, as an XML document. ``namespaces`` maps
    each prefix to its namespace, with ``default`` as the form's own."""
    writer = _Writer(namespaces)
    ((root_key, content),) = root.items()
    element = lxml_etree.Element(writer.element_name(root_key), nsmap=writer.namespaces)
    writer.write_children(element, content)

    xml_bytes = lxml_etree.tostring(
        element, encoding="utf-8", xml_declaration=True, pretty_print=pretty_print
    )
    return xml_bytes.decode("utf-8").strip()


# =============================================================================
# HELPERS
# =============================================================================


class _Writer:
    def __init__(self, namespaces: dict[str, str]):
        declared = dict(namespaces)
        self.default_namespace = declared.pop("default")
        self.namespaces = declared

    def element_name(self, key: str) -> str:
        prefix, _, name = key.rpartition(":")
        return f"{{{self.namespaces[prefix] if prefix else self.default_namespace}}}{name}"

    def attribute_name(self, key: str) -> str:
        prefix, _, name = key.removeprefix("@").rpartition(":")
        if not prefix:
            raise ValueError(f"Attribute {key} has no namespace prefix")
        return f"{{{self.namespaces[prefix]}}}{name}"

    def write_children(self, parent: lxml_etree._Element, content: Any) -> None:
        if not isinstance(content, Group):
            raise ValueError(f"Expected elements, got {content!r}")
        for key, value in content.items():
            if key.startswith("@"):
                text = "" if isinstance(value, EmptyElement) else _text(value)
                parent.set(self.attribute_name(key), text)
            else:
                for entry in value if isinstance(value, list) else [value]:
                    self.write_element(parent, key, entry)

    def write_element(self, parent: lxml_etree._Element, key: str, value: Any) -> None:
        element = lxml_etree.SubElement(parent, self.element_name(key))
        if isinstance(value, Group):
            self.write_children(element, value)
        elif isinstance(value, AttachmentInfo):
            self.write_attachment(element, value)
        elif not isinstance(value, EmptyElement):
            element.text = _text(value)

    def write_attachment(self, element: lxml_etree._Element, info: AttachmentInfo) -> None:
        att = self.namespaces.get("att", ATTACHMENTS_NS)
        glob = self.namespaces.get("glob", GLOBAL_NS)
        lxml_etree.SubElement(element, f"{{{att}}}FileName").text = info.filename
        lxml_etree.SubElement(element, f"{{{att}}}MimeType").text = info.mime_type
        location = lxml_etree.SubElement(element, f"{{{att}}}FileLocation")
        location.set(f"{{{att}}}href", info.file_location)
        hash_value = lxml_etree.SubElement(element, f"{{{glob}}}HashValue")
        hash_value.set(f"{{{glob}}}hashAlgorithm", info.hash_algorithm)
        hash_value.text = info.hash_value


def _text(value: Any) -> str:
    """Write a value as XML text: a boolean as ``true``/``false``, a whole number without ``.0``."""
    if isinstance(value, (dict, list)):
        raise ValueError(f"Expected a value, got {value!r}")
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)
