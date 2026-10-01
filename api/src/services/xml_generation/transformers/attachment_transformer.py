"""Attachment transformer for XML generation."""

import logging
from typing import Any

from lxml import etree as lxml_etree

from ..utils.attachment_mapping import AttachmentInfo

logger = logging.getLogger(__name__)


class AttachmentTransformer:
    """Transformer for handling attachment data in XML generation."""

    def __init__(
        self,
        attachment_namespace: str = "http://apply.grants.gov/system/Attachments-V1.0",
        attachment_mapping: dict[str, AttachmentInfo] | None = None,
        attachment_field_config: dict[str, Any] | None = None,
    ):
        """Initialize the attachment transformer.

        Args:
            attachment_namespace: The XML namespace for attachments
            attachment_mapping: Mapping of attachment UUID strings to AttachmentInfo objects
            attachment_field_config: Configuration for attachment fields from form config
        """
        self.attachment_namespace = attachment_namespace
        self.attachment_mapping = attachment_mapping or {}
        self.attachment_field_config = attachment_field_config or {}
        # Fields already placed in sequence order, so the end-of-form flush skips them.
        self._emitted_fields: set[str] = set()

    def add_attachment_field(
        self,
        parent: lxml_etree._Element,
        field_name: str,
        data: dict[str, Any],
        nsmap: dict[str, str],
    ) -> bool:
        """Add the attachment element for a single configured field.

        Lets the caller place an attachment element at its correct position in the
        XSD sequence rather than appending all attachments at the end.

        Args:
            parent: Parent XML element
            field_name: Name of the attachment field to emit
            data: Data dictionary containing attachment UUIDs
            nsmap: Namespace map for XML generation

        Returns:
            True if an element was emitted, False if the field is not a configured
            attachment or has no value in ``data``.
        """
        field_config = self.attachment_field_config.get(field_name)
        if field_config is None or data.get(field_name) is None:
            return False

        xml_element = field_config["xml_element"]
        field_type = field_config["type"]
        field_value = data[field_name]

        if field_type == "single" or field_type == "single_with_wrapper":
            attachment_dict = self._resolve_attachment_uuid(field_value, field_name)
            self._add_single_attachment_element(
                parent, xml_element, attachment_dict, nsmap, field_config
            )
        elif field_type == "multiple":
            self._add_multiple_attachment_from_uuids(
                parent, xml_element, field_value, field_name, nsmap
            )

        self._emitted_fields.add(field_name)
        return True

    def add_attachment_elements(
        self, parent: lxml_etree._Element, data: dict[str, Any], nsmap: dict[str, str]
    ) -> None:
        """Add all attachment elements not already emitted to the parent XML element.

        Args:
            parent: Parent XML element
            data: Data dictionary containing attachment UUIDs
            nsmap: Namespace map for XML generation

        Raises:
            ValueError: If a UUID is found in data but not in the attachment mapping
        """
        for field_name in self.attachment_field_config:
            if field_name in self._emitted_fields:
                continue
            self.add_attachment_field(parent, field_name, data, nsmap)

    def _resolve_attachment_uuid(self, uuid_value: str, field_name: str) -> dict[str, Any]:
        """Resolve a UUID to attachment data.

        Args:
            uuid_value: UUID as object or string
            field_name: Name of the field for error messages

        Returns:
            Attachment data dictionary ready for XML generation

        Raises:
            ValueError: If UUID not found in mapping
        """
        # UUID values from JSON are already strings, use directly
        uuid_str = str(uuid_value) if not isinstance(uuid_value, str) else uuid_value

        # Look up UUID in mapping
        if uuid_str not in self.attachment_mapping:
            raise ValueError(
                f"Attachment UUID {uuid_str} for field '{field_name}' not found in attachment mapping. "
                f"Available UUIDs: {list(self.attachment_mapping.keys())}"
            )

        attachment_info = self.attachment_mapping[uuid_str]

        # attachment_mapping is typed as dict[str, AttachmentInfo], so we can directly call to_dict()
        return attachment_info.to_dict()

    def _add_multiple_attachment_from_uuids(
        self,
        parent: lxml_etree._Element,
        element_name: str,
        uuid_list: list[str] | str,
        field_name: str,
        nsmap: dict[str, str],
    ) -> None:
        """Add multiple attachment element from list of UUIDs.

        Args:
            parent: Parent XML element
            element_name: Name of the attachment group element
            uuid_list: List of UUID strings/objects, or single UUID
            field_name: Name of the field for error messages
            nsmap: Namespace map
        """
        # Handle single UUID (convert to list)
        if not isinstance(uuid_list, list):
            uuid_list = [uuid_list]

        # Resolve all UUIDs to attachment data
        attachment_dicts: list[dict[str, Any]] = []
        for uuid_value in uuid_list:
            resolved_attachment: dict[str, Any] = self._resolve_attachment_uuid(
                uuid_value, field_name
            )
            attachment_dicts.append(resolved_attachment)

        if attachment_dicts:
            self._add_multiple_attachment_element(
                parent, element_name, {"AttachedFile": attachment_dicts}, nsmap
            )

    def _add_single_attachment_element(
        self,
        parent: lxml_etree._Element,
        element_name: str,
        attachment_data: dict[str, Any],
        nsmap: dict[str, str],
        field_config: dict[str, Any] | None = None,
    ) -> None:
        """Add a single attachment element.

        Both 'single' and 'single_with_wrapper' place the attachment content inside a
        wrapper element named ``element_name`` in the form's default namespace. They
        differ only in whether an inner file element is nested inside that wrapper.

        Example structure (type='single', element of type att:AttachedFileDataType):
        <SF424_4_0:DebtExplanation>
            <att:FileName>...</att:FileName>
            <att:MimeType>...</att:MimeType>
            ...
        </SF424_4_0:DebtExplanation>

        Example structure with inner file element (type='single_with_wrapper'):
        <AttachmentForm_1_2:ATT1>
            <AttachmentForm_1_2:ATT1File>
                <att:FileName>...</att:FileName>
                ...
            </AttachmentForm_1_2:ATT1File>
        </AttachmentForm_1_2:ATT1>

        When 'file_element' is set in field_config, that name is used instead of '{element_name}File':
        <Project_Abstract_1_2:ProjectAbstractAddAttachment>
            <Project_Abstract_1_2:AttachedFile>
                <att:FileName>...</att:FileName>
                ...
            </Project_Abstract_1_2:AttachedFile>
        </Project_Abstract_1_2:ProjectAbstractAddAttachment>

        Args:
            parent: Parent XML element
            element_name: Name of the attachment element (e.g., "ATT1")
            attachment_data: Attachment data dictionary
            nsmap: Namespace map
            field_config: Field configuration containing type and optional file_element
        """
        field_type = field_config.get("type") if field_config else None

        # 'single' has no inner file element; content goes directly inside the wrapper.
        if field_type == "single":
            file_element_name: str = ""
        else:
            file_element_name = (
                field_config.get("file_element", f"{element_name}File")
                if field_config
                else f"{element_name}File"
            )

        default_ns = next(iter(nsmap.values()), None) if nsmap else None

        if default_ns:
            attachment_elem = lxml_etree.SubElement(parent, f"{{{default_ns}}}{element_name}")
        else:
            attachment_elem = lxml_etree.SubElement(parent, element_name)

        if file_element_name:
            if default_ns:
                file_elem = lxml_etree.SubElement(
                    attachment_elem, f"{{{default_ns}}}{file_element_name}"
                )
            else:
                file_elem = lxml_etree.SubElement(attachment_elem, file_element_name)
            self._populate_attachment_content(file_elem, attachment_data, nsmap)
        else:
            self._populate_attachment_content(attachment_elem, attachment_data, nsmap)

    def _get_namespace(self, tag: str) -> str | None:
        if tag.startswith("{"):
            return tag.split("}")[0][1:]
        return None

    def _add_multiple_attachment_element(
        self,
        parent: lxml_etree._Element,
        element_name: str,
        attachment_data: dict[str, Any] | list[Any],
        nsmap: dict[str, str],
    ) -> None:
        """Add a multiple attachment element (AttachmentGroup).

        Args:
            parent: Parent XML element
            element_name: Name of the attachment group element
            attachment_data: Attachment group data dictionary
            nsmap: Namespace map
        """

        form_ns = self._get_namespace(parent.tag)

        if form_ns:
            group_elem = lxml_etree.SubElement(parent, f"{{{form_ns}}}{element_name}")
        else:
            group_elem = lxml_etree.SubElement(parent, element_name)

        # Normalize to list of file data
        files_to_add: list[Any] = []
        if isinstance(attachment_data, list):
            files_to_add = attachment_data
        elif isinstance(attachment_data, dict) and "AttachedFile" in attachment_data:
            attached_files = attachment_data["AttachedFile"]
            files_to_add = attached_files if isinstance(attached_files, list) else [attached_files]

        # Add each file
        for file_data in files_to_add:
            self._add_attached_file_element(group_elem, file_data, nsmap)

    def _add_attached_file_element(
        self,
        parent: lxml_etree._Element,
        file_data: Any,
        nsmap: dict[str, str],
    ) -> None:

        att_ns = nsmap.get("att", self.attachment_namespace)

        file_elem = lxml_etree.SubElement(parent, f"{{{att_ns}}}AttachedFile")
        self._populate_attachment_content(file_elem, file_data, nsmap)

    def _populate_attachment_content(
        self,
        attachment_elem: lxml_etree._Element,
        attachment_data: Any,
        nsmap: dict[str, str],
    ) -> None:
        """Populate the content of an attachment element.

        Args:
            attachment_elem: The attachment XML element
            attachment_data: Attachment data dictionary
            nsmap: Namespace map
        """
        if not isinstance(attachment_data, dict):
            return

        # Get namespace URIs from nsmap
        att_ns = nsmap.get("att", self.attachment_namespace)
        glob_ns = nsmap.get("glob", "http://apply.grants.gov/system/Global-V1.0")

        # Add FileName with att: namespace prefix
        if "FileName" in attachment_data:
            filename_elem = lxml_etree.SubElement(attachment_elem, f"{{{att_ns}}}FileName")
            filename_elem.text = str(attachment_data["FileName"])

        # Add MimeType with att: namespace prefix
        if "MimeType" in attachment_data:
            mimetype_elem = lxml_etree.SubElement(attachment_elem, f"{{{att_ns}}}MimeType")
            mimetype_elem.text = str(attachment_data["MimeType"])

        # Add FileLocation with att:href attribute
        if "FileLocation" in attachment_data:
            filelocation_elem = lxml_etree.SubElement(attachment_elem, f"{{{att_ns}}}FileLocation")
            file_location_data = attachment_data["FileLocation"]

            if isinstance(file_location_data, dict) and "@href" in file_location_data:
                filelocation_elem.set(f"{{{att_ns}}}href", str(file_location_data["@href"]))
            elif isinstance(file_location_data, str):
                filelocation_elem.set(f"{{{att_ns}}}href", file_location_data)

        # Add HashValue with glob: prefix and glob:hashAlgorithm attribute
        if "HashValue" in attachment_data:
            hashvalue_elem = lxml_etree.SubElement(attachment_elem, f"{{{glob_ns}}}HashValue")
            hash_data = attachment_data["HashValue"]

            if isinstance(hash_data, dict):
                if "@hashAlgorithm" in hash_data:
                    hashvalue_elem.set(
                        f"{{{glob_ns}}}hashAlgorithm", str(hash_data["@hashAlgorithm"])
                    )
                if "#text" in hash_data:
                    hashvalue_elem.text = str(hash_data["#text"])
            elif isinstance(hash_data, str):
                hashvalue_elem.set(f"{{{glob_ns}}}hashAlgorithm", "SHA-1")  # Default
                hashvalue_elem.text = hash_data
