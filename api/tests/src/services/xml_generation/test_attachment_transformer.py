"""Tests for attachment transformer."""

from uuid import UUID

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.transformers.attachment_transformer import AttachmentTransformer
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo


@pytest.mark.xml_validation
class TestAttachmentTransformer:
    """Test cases for AttachmentTransformer."""

    def setup_method(self):
        """Set up test fixtures."""
        # Sample UUIDs for testing
        self.uuid1 = UUID("11111111-1111-1111-1111-111111111111")
        self.uuid2 = UUID("22222222-2222-2222-2222-222222222222")
        self.uuid3 = UUID("33333333-3333-3333-3333-333333333333")

        # Sample attachment field configuration
        self.attachment_config = {
            "areas_affected": {"xml_element": "AreasAffected", "type": "single"},
            "debt_explanation": {"xml_element": "DebtExplanation", "type": "single"},
            "additional_congressional_districts": {
                "xml_element": "AdditionalCongressionalDistricts",
                "type": "single",
            },
            "additional_project_title": {
                "xml_element": "AdditionalProjectTitle",
                "type": "multiple",
            },
        }

        # Sample attachment mapping
        # Use string keys as the mapping now uses string UUIDs instead of UUID objects
        self.attachment_mapping = {
            str(self.uuid1): AttachmentInfo(
                filename="test_document.pdf",
                mime_type="application/pdf",
                file_location="./attachments/test_document.pdf",
                hash_value="aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=",
            ),
            str(self.uuid2): AttachmentInfo(
                filename="document1.pdf",
                mime_type="application/pdf",
                file_location="./attachments/document1.pdf",
                hash_value="ZG9jdW1lbnQxaGFzaA==",
            ),
            str(self.uuid3): AttachmentInfo(
                filename="document2.xlsx",
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file_location="./attachments/document2.xlsx",
                hash_value="ZG9jdW1lbnQyaGFzaA==",
            ),
        }

        self.transformer = AttachmentTransformer(
            attachment_mapping=self.attachment_mapping,
            attachment_field_config=self.attachment_config,
        )

        self.nsmap = {
            None: "http://apply.grants.gov/forms/SF424_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        }

    def test_transformer_initialization(self):
        """Test AttachmentTransformer initialization."""
        transformer = AttachmentTransformer()
        assert transformer.attachment_namespace == "http://apply.grants.gov/system/Attachments-V1.0"

        # Test custom namespace
        custom_transformer = AttachmentTransformer("http://custom.namespace")
        assert custom_transformer.attachment_namespace == "http://custom.namespace"

    def test_add_single_attachment_element(self):
        """Test adding a single attachment element."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        attachment_data = {
            "FileName": "test_document.pdf",
            "MimeType": "application/pdf",
            "FileLocation": {"@href": "./attachments/test_document.pdf"},
            "HashValue": {
                "@hashAlgorithm": "SHA-1",
                "#text": "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=",
            },
        }

        self.transformer._add_single_attachment_element(
            root, "AreasAffected", attachment_data, self.nsmap
        )

        # Verify XML structure
        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AreasAffected>" in xml_string
        assert "<FileName>test_document.pdf</FileName>" in xml_string
        assert "<MimeType>application/pdf</MimeType>" in xml_string
        assert 'href="./attachments/test_document.pdf"' in xml_string
        assert 'hashAlgorithm="SHA-1"' in xml_string
        assert "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=" in xml_string

    def test_add_multiple_attachment_element(self):
        """Test adding a multiple attachment element."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        attachment_data = {
            "AttachedFile": [
                {
                    "FileName": "document1.pdf",
                    "MimeType": "application/pdf",
                    "FileLocation": {"@href": "./attachments/document1.pdf"},
                    "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "ZG9jdW1lbnQxaGFzaA=="},
                },
                {
                    "FileName": "document2.xlsx",
                    "MimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "FileLocation": {"@href": "./attachments/document2.xlsx"},
                    "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "ZG9jdW1lbnQyaGFzaA=="},
                },
            ]
        }

        self.transformer._add_multiple_attachment_element(
            root, "AdditionalProjectTitle", attachment_data, self.nsmap
        )

        # Verify XML structure
        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 2
        assert "<FileName>document1.pdf</FileName>" in xml_string
        assert "<FileName>document2.xlsx</FileName>" in xml_string
        assert "spreadsheetml.sheet" in xml_string

    def test_add_multiple_attachment_element_single_file(self):
        """Test adding multiple attachment element with single file."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        attachment_data = {
            "AttachedFile": {
                "FileName": "single_document.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/single_document.pdf"},
                "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "c2luZ2xlZG9jdW1lbnRoYXNo"},
            }
        }

        self.transformer._add_multiple_attachment_element(
            root, "AdditionalProjectTitle", attachment_data, self.nsmap
        )

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 1
        assert "<FileName>single_document.pdf</FileName>" in xml_string

    def test_add_multiple_attachment_element_direct_list(self):
        """Test adding multiple attachment element with direct list."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        attachment_data = [
            {
                "FileName": "list_document1.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/list_document1.pdf"},
                "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "bGlzdGRvY3VtZW50MWhhc2g="},
            },
            {
                "FileName": "list_document2.docx",
                "MimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "FileLocation": {"@href": "./attachments/list_document2.docx"},
                "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "bGlzdGRvY3VtZW50Mmhhc2g="},
            },
        ]

        self.transformer._add_multiple_attachment_element(
            root, "AdditionalProjectTitle", attachment_data, self.nsmap
        )

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert xml_string.count("<AttachedFile>") == 2
        assert "<FileName>list_document1.pdf</FileName>" in xml_string
        assert "<FileName>list_document2.docx</FileName>" in xml_string

    def test_populate_attachment_content_complete(self):
        """Test populating complete attachment content."""
        root = lxml_etree.Element("TestAttachment", nsmap=self.nsmap)

        attachment_data = {
            "FileName": "complete_test.pdf",
            "MimeType": "application/pdf",
            "FileLocation": {"@href": "./attachments/complete_test.pdf"},
            "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "Y29tcGxldGV0ZXN0aGFzaA=="},
        }

        self.transformer._populate_attachment_content(root, attachment_data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify all elements are present
        assert "<FileName>complete_test.pdf</FileName>" in xml_string
        assert "<MimeType>application/pdf</MimeType>" in xml_string
        assert (
            "<FileLocation" in xml_string and 'href="./attachments/complete_test.pdf"' in xml_string
        )
        assert "<HashValue" in xml_string and 'hashAlgorithm="SHA-1"' in xml_string
        assert "Y29tcGxldGV0ZXN0aGFzaA==" in xml_string

    def test_populate_attachment_content_string_file_location(self):
        """Test populating attachment content with string file location."""
        root = lxml_etree.Element("TestAttachment", nsmap=self.nsmap)

        attachment_data = {
            "FileName": "string_location.pdf",
            "MimeType": "application/pdf",
            "FileLocation": "./attachments/string_location.pdf",  # String instead of dict
            "HashValue": "c3RyaW5nbG9jYXRpb25oYXNo",  # String instead of dict
        }

        self.transformer._populate_attachment_content(root, attachment_data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert 'href="./attachments/string_location.pdf"' in xml_string
        assert 'hashAlgorithm="SHA-1"' in xml_string  # Default algorithm
        assert "c3RyaW5nbG9jYXRpb25oYXNo" in xml_string

    def test_populate_attachment_content_partial(self):
        """Test populating attachment content with missing fields."""
        root = lxml_etree.Element("TestAttachment", nsmap=self.nsmap)

        attachment_data = {
            "FileName": "partial_test.pdf",
            # MimeType missing
            "FileLocation": {"@href": "./attachments/partial_test.pdf"},
            # HashValue missing
        }

        self.transformer._populate_attachment_content(root, attachment_data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Should only contain provided fields
        assert "<FileName>partial_test.pdf</FileName>" in xml_string
        assert "<MimeType>" not in xml_string
        assert 'href="./attachments/partial_test.pdf"' in xml_string
        assert "<HashValue>" not in xml_string

    def test_populate_attachment_content_invalid_data(self):
        """Test populating attachment content with invalid data."""
        root = lxml_etree.Element("TestAttachment", nsmap=self.nsmap)

        # Non-dictionary data should be handled gracefully
        self.transformer._populate_attachment_content(root, "invalid_data", self.nsmap)
        self.transformer._populate_attachment_content(root, None, self.nsmap)
        self.transformer._populate_attachment_content(root, 123, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Should result in empty element
        # Should handle invalid data gracefully - just check that no content was added
        assert "FileName" not in xml_string
        assert "MimeType" not in xml_string

    def test_uuid_based_single_attachment(self):
        """Test adding single attachment using UUID."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        # Data with UUID reference
        data = {"areas_affected": str(self.uuid1)}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AreasAffected>" in xml_string
        assert "<FileName>test_document.pdf</FileName>" in xml_string
        assert "<MimeType>application/pdf</MimeType>" in xml_string
        assert 'href="./attachments/test_document.pdf"' in xml_string
        assert 'hashAlgorithm="SHA-1"' in xml_string
        assert "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=" in xml_string

    def test_uuid_based_multiple_attachments(self):
        """Test adding multiple attachments using UUIDs."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        # Data with UUID references
        data = {"additional_project_title": [str(self.uuid2), str(self.uuid3)]}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 2
        assert "<FileName>document1.pdf</FileName>" in xml_string
        assert "<FileName>document2.xlsx</FileName>" in xml_string
        assert "spreadsheetml.sheet" in xml_string

    def test_uuid_not_found_error(self):
        """Test error when UUID not found in mapping."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        # UUID that doesn't exist in mapping
        unknown_uuid = "99999999-9999-9999-9999-999999999999"
        data = {"debt_explanation": unknown_uuid}

        with pytest.raises(ValueError) as exc_info:
            self.transformer.add_attachment_elements(root, data, self.nsmap)

        assert "not found in attachment mapping" in str(exc_info.value)
        assert unknown_uuid in str(exc_info.value)

    def test_invalid_uuid_format_error(self):
        """Test error when UUID is invalid/unknown."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        # Invalid UUID string
        data = {"debt_explanation": "not-a-valid-uuid"}

        with pytest.raises(ValueError) as exc_info:
            self.transformer.add_attachment_elements(root, data, self.nsmap)

        # With string-based mapping, invalid UUIDs are treated as not found
        assert "not found in attachment mapping" in str(exc_info.value)
        assert "not-a-valid-uuid" in str(exc_info.value)

    def test_mixed_single_and_multiple_attachments(self):
        """Test adding both single and multiple attachments together."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        data = {
            "debt_explanation": str(self.uuid1),
            "additional_project_title": [str(self.uuid2), str(self.uuid3)],
        }

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Check single attachment
        assert "<DebtExplanation>" in xml_string
        assert "<FileName>test_document.pdf</FileName>" in xml_string

        # Check multiple attachments
        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 2
        assert "<FileName>document1.pdf</FileName>" in xml_string
        assert "<FileName>document2.xlsx</FileName>" in xml_string

    def test_no_attachments_in_data(self):
        """Test handling when no attachments are in the data."""
        root = lxml_etree.Element("TestRoot", nsmap=self.nsmap)

        data = {"some_other_field": "value"}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Should not add any attachment elements
        assert "AreasAffected" not in xml_string
        assert "DebtExplanation" not in xml_string
        assert "AdditionalProjectTitle" not in xml_string
