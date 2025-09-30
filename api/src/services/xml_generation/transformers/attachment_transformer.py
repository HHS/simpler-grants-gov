"""Attachment transformer for XML generation."""

from typing import Any

from lxml import etree as lxml_etree

from ..models.attachment import HASH_ALGORITHM, AttachmentFile, AttachmentGroup


class AttachmentTransformer:
    """Transformer for handling attachment data in XML generation."""

    def __init__(
        self, attachment_namespace: str = "http://apply.grants.gov/system/Attachments-V1.0"
    ):
        """Initialize the attachment transformer.

        Args:
            attachment_namespace: The XML namespace for attachments
        """
        self.attachment_namespace = attachment_namespace

    def add_attachment_elements(
        self, parent: lxml_etree._Element, data: dict[str, Any], nsmap: dict[str, str]
    ) -> None:
        """Add attachment elements to the parent XML element.

        Args:
            parent: Parent XML element
            data: Data dictionary containing attachment information
            nsmap: Namespace map for XML generation
        """
        # Handle single attachment fields
        single_attachment_fields = [
            ("AreasAffected", "areas_affected"),
            ("AdditionalCongressionalDistricts", "additional_congressional_districts"),
            ("DebtExplanation", "debt_explanation"),
        ]

        for xml_name, data_key in single_attachment_fields:
            if data_key in data and data[data_key] is not None:
                attachment_data = data[data_key]
                if isinstance(attachment_data, dict):
                    self._add_single_attachment_element(parent, xml_name, attachment_data, nsmap)
                elif isinstance(attachment_data, AttachmentFile):
                    attachment_dict = self._attachment_file_to_dict(attachment_data)
                    self._add_single_attachment_element(parent, xml_name, attachment_dict, nsmap)

        # Handle multiple attachment field (AdditionalProjectTitle)
        if "additional_project_title" in data and data["additional_project_title"] is not None:
            additional_title_data = data["additional_project_title"]
            if isinstance(additional_title_data, dict) and "AttachedFile" in additional_title_data:
                self._add_multiple_attachment_element(
                    parent, "AdditionalProjectTitle", additional_title_data, nsmap
                )
            elif isinstance(additional_title_data, AttachmentGroup):
                attachment_dict = {
                    "AttachedFile": [
                        self._attachment_file_to_dict(file)
                        for file in additional_title_data.attached_files
                    ]
                }
                self._add_multiple_attachment_element(
                    parent, "AdditionalProjectTitle", attachment_dict, nsmap
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
            if input_key in input_data and input_data[input_key] is not None:
                attachment_info = input_data[input_key]
                if isinstance(attachment_info, dict):
                    result[xml_key] = self._process_single_attachment(attachment_info)

        # Process multiple attachment field
        if (
            "additional_project_title" in input_data
            and input_data["additional_project_title"] is not None
        ):
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
