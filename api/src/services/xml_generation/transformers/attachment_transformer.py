"""Attachment transformer for XML generation."""

import logging
from typing import Any
from uuid import UUID

from lxml import etree as lxml_etree

from ..models.attachment import HASH_ALGORITHM, AttachmentFile

logger = logging.getLogger(__name__)


class AttachmentTransformer:
    """Transformer for handling attachment data in XML generation."""

    def __init__(
        self,
        attachment_namespace: str = "http://apply.grants.gov/system/Attachments-V1.0",
        attachment_mapping: dict[UUID, Any] | None = None,
        attachment_field_config: dict[str, Any] | None = None,
    ):
        """Initialize the attachment transformer.

        Args:
            attachment_namespace: The XML namespace for attachments
            attachment_mapping: Mapping of attachment UUIDs to attachment info objects
            attachment_field_config: Configuration for attachment fields from form config
        """
        self.attachment_namespace = attachment_namespace
        self.attachment_mapping = attachment_mapping or {}
        self.attachment_field_config = attachment_field_config or {}

    def add_attachment_elements(
        self, parent: lxml_etree._Element, data: dict[str, Any], nsmap: dict[str, str]
    ) -> None:
        """Add attachment elements to the parent XML element.

        Args:
            parent: Parent XML element
            data: Data dictionary containing attachment UUIDs
            nsmap: Namespace map for XML generation

        Raises:
            ValueError: If a UUID is found in data but not in the attachment mapping
        """
        # Process each configured attachment field
        for field_name, field_config in self.attachment_field_config.items():
            if field_name not in data or data[field_name] is None:
                continue

            xml_element = field_config["xml_element"]
            field_type = field_config["type"]
            field_value = data[field_name]

            if field_type == "single":
                # Single attachment field - expect UUID string
                attachment_dict = self._resolve_attachment_uuid(field_value, field_name)
                self._add_single_attachment_element(parent, xml_element, attachment_dict, nsmap)
            elif field_type == "multiple":
                # Multiple attachment field - expect list of UUIDs
                self._add_multiple_attachment_from_uuids(
                    parent, xml_element, field_value, field_name, nsmap
                )

    def _resolve_attachment_uuid(self, uuid_value: UUID | str, field_name: str) -> dict[str, Any]:
        """Resolve a UUID to attachment data.

        Args:
            uuid_value: UUID as object or string
            field_name: Name of the field for error messages

        Returns:
            Attachment data dictionary ready for XML generation

        Raises:
            ValueError: If UUID format is invalid or UUID not found in mapping
        """
        # Convert string UUID to UUID object
        if isinstance(uuid_value, str):
            try:
                uuid_value = UUID(uuid_value)
            except (ValueError, AttributeError) as e:
                raise ValueError(
                    f"Invalid UUID format for field '{field_name}': {uuid_value}"
                ) from e

        # Look up UUID in mapping
        if uuid_value not in self.attachment_mapping:
            raise ValueError(
                f"Attachment UUID {uuid_value} for field '{field_name}' not found in attachment mapping. "
                f"Available UUIDs: {list(self.attachment_mapping.keys())}"
            )

        attachment_info = self.attachment_mapping[uuid_value]

        # Convert AttachmentInfo to dict
        if hasattr(attachment_info, "to_dict"):
            return attachment_info.to_dict()

        # If it's already a dict, return it
        if isinstance(attachment_info, dict):
            return attachment_info

        raise ValueError(
            f"Unexpected attachment info type for UUID {uuid_value}: {type(attachment_info)}"
        )

    def _add_multiple_attachment_from_uuids(
        self,
        parent: lxml_etree._Element,
        element_name: str,
        uuid_list: list[UUID | str] | UUID | str,
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
    ) -> None:
        """Add a single attachment element.

        Args:
            parent: Parent XML element
            element_name: Name of the attachment element
            attachment_data: Attachment data dictionary
            nsmap: Namespace map
        """
        attachment_elem = lxml_etree.SubElement(parent, element_name)
        self._populate_attachment_content(attachment_elem, attachment_data, nsmap)

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
        group_elem = lxml_etree.SubElement(parent, element_name)

        # Handle direct list of attachments
        if isinstance(attachment_data, list):
            for file_data in attachment_data:
                file_elem = lxml_etree.SubElement(group_elem, "AttachedFile")
                self._populate_attachment_content(file_elem, file_data, nsmap)
        elif isinstance(attachment_data, dict) and "AttachedFile" in attachment_data:
            attached_files = attachment_data["AttachedFile"]
            if isinstance(attached_files, list):
                for file_data in attached_files:
                    file_elem = lxml_etree.SubElement(group_elem, "AttachedFile")
                    self._populate_attachment_content(file_elem, file_data, nsmap)
            else:
                # Single file in the list
                file_elem = lxml_etree.SubElement(group_elem, "AttachedFile")
                self._populate_attachment_content(file_elem, attached_files, nsmap)

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

        # Add FileName
        if "FileName" in attachment_data:
            filename_elem = lxml_etree.SubElement(attachment_elem, "FileName")
            filename_elem.text = str(attachment_data["FileName"])

        # Add MimeType
        if "MimeType" in attachment_data:
            mimetype_elem = lxml_etree.SubElement(attachment_elem, "MimeType")
            mimetype_elem.text = str(attachment_data["MimeType"])

        # Add FileLocation with href attribute
        if "FileLocation" in attachment_data:
            filelocation_elem = lxml_etree.SubElement(attachment_elem, "FileLocation")
            file_location_data = attachment_data["FileLocation"]

            if isinstance(file_location_data, dict) and "@href" in file_location_data:
                filelocation_elem.set("href", str(file_location_data["@href"]))
            elif isinstance(file_location_data, str):
                filelocation_elem.set("href", file_location_data)

        # Add HashValue with hashAlgorithm attribute and text content
        if "HashValue" in attachment_data:
            hashvalue_elem = lxml_etree.SubElement(attachment_elem, "HashValue")
            hash_data = attachment_data["HashValue"]

            if isinstance(hash_data, dict):
                if "@hashAlgorithm" in hash_data:
                    hashvalue_elem.set("hashAlgorithm", str(hash_data["@hashAlgorithm"]))
                if "#text" in hash_data:
                    hashvalue_elem.text = str(hash_data["#text"])
            elif isinstance(hash_data, str):
                hashvalue_elem.set("hashAlgorithm", "SHA-1")  # Default
                hashvalue_elem.text = hash_data

    def _attachment_file_to_dict(self, attachment_file: AttachmentFile) -> dict[str, Any]:
        """Convert AttachmentFile to dictionary format.

        Args:
            attachment_file: The attachment file object

        Returns:
            Dictionary representation
        """
        return {
            "FileName": attachment_file.filename,
            "MimeType": attachment_file.mime_type,
            "FileLocation": {"@href": attachment_file.file_location},
            "HashValue": {
                "@hashAlgorithm": HASH_ALGORITHM,
                "#text": attachment_file.hash_value,
            },
        }

    def process_attachment_data(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Process raw attachment data into XML-ready format.

        Args:
            input_data: Raw input data containing attachment information

        Returns:
            Processed data ready for XML generation
        """
        result = {}

        # Process single attachment fields
        single_fields = [
            ("areas_affected", "AreasAffected"),
            ("additional_congressional_districts", "AdditionalCongressionalDistricts"),
            ("debt_explanation", "DebtExplanation"),
        ]

        for input_key, xml_key in single_fields:
            if input_data.get(input_key) is not None:
                attachment_info = input_data[input_key]
                if isinstance(attachment_info, dict):
                    result[xml_key] = self._process_single_attachment(attachment_info)

        # Process multiple attachment field
        if input_data.get("additional_project_title") is not None:
            additional_title = input_data["additional_project_title"]
            if isinstance(additional_title, list):
                result["AdditionalProjectTitle"] = {
                    "AttachedFile": [
                        self._process_single_attachment(item) for item in additional_title
                    ]
                }
            elif isinstance(additional_title, dict):
                result["AdditionalProjectTitle"] = {
                    "AttachedFile": [self._process_single_attachment(additional_title)]
                }

        return result

    def _process_single_attachment(self, attachment_info: dict[str, Any]) -> dict[str, Any]:
        """Process a single attachment info dictionary.

        Args:
            attachment_info: Dictionary containing attachment information

        Returns:
            Processed attachment data
        """
        # If it's already in the correct format, return as-is
        if all(
            key in attachment_info for key in ["FileName", "MimeType", "FileLocation", "HashValue"]
        ):
            return attachment_info

        # Process file path-based attachment
        if "file_path" in attachment_info:
            try:
                attachment_file = AttachmentFile.from_file_path(
                    attachment_info["file_path"], attachment_info.get("file_location")
                )
                return self._attachment_file_to_dict(attachment_file)
            except (FileNotFoundError, Exception):
                # If file doesn't exist, create a placeholder structure
                return self._create_placeholder_attachment(attachment_info)

        # Process direct attachment data
        return self._create_attachment_from_data(attachment_info)

    def _create_placeholder_attachment(self, attachment_info: dict[str, Any]) -> dict[str, Any]:
        """Create a placeholder attachment structure.

        Args:
            attachment_info: Basic attachment information

        Returns:
            Placeholder attachment data
        """
        filename = attachment_info.get("filename", "placeholder.pdf")
        mime_type = attachment_info.get("mime_type", "application/pdf")
        file_location = attachment_info.get("file_location", f"./attachments/{filename}")

        return {
            "FileName": filename,
            "MimeType": mime_type,
            "FileLocation": {"@href": file_location},
            "HashValue": {
                "@hashAlgorithm": "SHA-1",
                "#text": "placeholder_base64_hash",  # Would be replaced with actual hash
            },
        }

    def _create_attachment_from_data(self, attachment_info: dict[str, Any]) -> dict[str, Any]:
        """Create attachment data from provided information.

        Args:
            attachment_info: Attachment information dictionary

        Returns:
            Complete attachment data
        """
        filename = attachment_info.get("filename", attachment_info.get("FileName", "document.pdf"))
        mime_type = attachment_info.get(
            "mime_type", attachment_info.get("MimeType", "application/pdf")
        )
        file_location = attachment_info.get(
            "file_location", attachment_info.get("FileLocation", f"./attachments/{filename}")
        )
        hash_value = attachment_info.get(
            "hash_value", attachment_info.get("HashValue", "placeholder_hash")
        )
        hash_algorithm = attachment_info.get("hash_algorithm", "SHA-1")

        # Handle FileLocation format
        if isinstance(file_location, str):
            file_location = {"@href": file_location}

        # Handle HashValue format
        if isinstance(hash_value, str):
            hash_value = {"@hashAlgorithm": hash_algorithm, "#text": hash_value}

        return {
            "FileName": filename,
            "MimeType": mime_type,
            "FileLocation": file_location,
            "HashValue": hash_value,
        }
