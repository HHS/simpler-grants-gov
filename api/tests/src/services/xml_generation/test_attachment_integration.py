"""Integration tests for attachment handling in XML generation."""

from uuid import UUID

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.transformers.attachment_transformer import AttachmentTransformer
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo


@pytest.mark.xml_validation
class TestAttachmentIntegration:
    """Integration tests for complete attachment workflows using UUID-based approach."""

    def setup_method(self):
        """Set up test fixtures."""
        # Sample UUIDs for testing
        self.uuid_areas = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        self.uuid_districts = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        self.uuid_debt = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
        self.uuid_project1 = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
        self.uuid_project2 = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

        # Create attachment mapping (simulates what create_attachment_mapping() would return)
        # Use string keys as the mapping now uses string UUIDs instead of UUID objects
        self.attachment_mapping = {
            str(self.uuid_areas): AttachmentInfo(
                filename="geographic_areas.pdf",
                mime_type="application/pdf",
                file_location="./attachments/geographic_areas.pdf",
                hash_value="aGVsbG8gd29ybGQ=",
            ),
            str(self.uuid_districts): AttachmentInfo(
                filename="districts.txt",
                mime_type="text/plain",
                file_location="./attachments/districts.txt",
                hash_value="ZGlzdHJpY3RzaGFzaA==",
            ),
            str(self.uuid_debt): AttachmentInfo(
                filename="debt.docx",
                mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                file_location="./attachments/debt.docx",
                hash_value="ZGVidGhhc2g=",
            ),
            str(self.uuid_project1): AttachmentInfo(
                filename="project1.pdf",
                mime_type="application/pdf",
                file_location="./attachments/project1.pdf",
                hash_value="cHJvamVjdDFoYXNo",
            ),
            str(self.uuid_project2): AttachmentInfo(
                filename="project2.xlsx",
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file_location="./attachments/project2.xlsx",
                hash_value="cHJvamVjdDJoYXNo",
            ),
        }

        # Attachment field configuration
        self.attachment_config = {
            "areas_affected": {"xml_element": "AreasAffected", "type": "single"},
            "additional_congressional_districts": {
                "xml_element": "AdditionalCongressionalDistricts",
                "type": "single",
            },
            "debt_explanation": {"xml_element": "DebtExplanation", "type": "single"},
            "additional_project_title": {
                "xml_element": "AdditionalProjectTitle",
                "type": "multiple",
            },
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

    def test_add_attachment_elements_with_single_attachment(self):
        """Test add_attachment_elements with single UUID attachment."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        # Data contains UUID reference
        data = {"areas_affected": str(self.uuid_areas)}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify single attachment was added
        assert "<AreasAffected>" in xml_string
        assert "<FileName>geographic_areas.pdf</FileName>" in xml_string
        assert "<MimeType>application/pdf</MimeType>" in xml_string
        assert 'href="./attachments/geographic_areas.pdf"' in xml_string
        assert "<HashValue" in xml_string
        assert "aGVsbG8gd29ybGQ=" in xml_string

    def test_add_attachment_elements_with_multiple_attachments(self):
        """Test add_attachment_elements with multiple UUID attachments."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        # Data contains list of UUID references
        data = {"additional_project_title": [str(self.uuid_project1), str(self.uuid_project2)]}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify multiple attachments were added
        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 2
        assert "<FileName>project1.pdf</FileName>" in xml_string
        assert "<FileName>project2.xlsx</FileName>" in xml_string

    def test_add_attachment_elements_all_fields(self):
        """Test add_attachment_elements with all four attachment types."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        # Data with all attachment field UUIDs
        data = {
            "areas_affected": str(self.uuid_areas),
            "additional_congressional_districts": str(self.uuid_districts),
            "debt_explanation": str(self.uuid_debt),
            "additional_project_title": [str(self.uuid_project1)],
        }

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify all four attachment types are present
        assert "<AreasAffected>" in xml_string
        assert "<AdditionalCongressionalDistricts>" in xml_string
        assert "<DebtExplanation>" in xml_string
        assert "<AdditionalProjectTitle>" in xml_string

        # Verify filenames
        assert "geographic_areas.pdf" in xml_string
        assert "districts.txt" in xml_string
        assert "debt.docx" in xml_string
        assert "project1.pdf" in xml_string

    def test_add_attachment_elements_empty_data(self):
        """Test add_attachment_elements with no attachments."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        data = {}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Should have no attachment elements
        assert "<AreasAffected>" not in xml_string
        assert "<DebtExplanation>" not in xml_string
        assert "<AdditionalProjectTitle>" not in xml_string

    def test_uuid_not_in_mapping_raises_error(self):
        """Test that using a UUID not in mapping raises helpful error."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        unknown_uuid = "99999999-9999-9999-9999-999999999999"
        data = {"debt_explanation": unknown_uuid}

        with pytest.raises(ValueError) as exc_info:
            self.transformer.add_attachment_elements(root, data, self.nsmap)

        assert "not found in attachment mapping" in str(exc_info.value)
        assert unknown_uuid in str(exc_info.value)

    def test_invalid_uuid_format_raises_error(self):
        """Test that invalid/unknown UUID raises helpful error."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        data = {"debt_explanation": "not-a-valid-uuid"}

        with pytest.raises(ValueError) as exc_info:
            self.transformer.add_attachment_elements(root, data, self.nsmap)

        # With string-based mapping, invalid UUIDs are treated as not found
        assert "not found in attachment mapping" in str(exc_info.value)
        assert "not-a-valid-uuid" in str(exc_info.value)

    def test_mixed_single_and_multiple_uuids(self):
        """Test handling both single and multiple UUID attachments together."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        data = {
            "areas_affected": str(self.uuid_areas),
            "debt_explanation": str(self.uuid_debt),
            "additional_project_title": [str(self.uuid_project1), str(self.uuid_project2)],
        }

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify single attachments
        assert "<AreasAffected>" in xml_string
        assert "geographic_areas.pdf" in xml_string
        assert "<DebtExplanation>" in xml_string
        assert "debt.docx" in xml_string

        # Verify multiple attachments
        assert "<AdditionalProjectTitle>" in xml_string
        assert xml_string.count("<AttachedFile>") == 2
        assert "project1.pdf" in xml_string
        assert "project2.xlsx" in xml_string

    def test_uuid_objects_instead_of_strings(self):
        """Test that UUID objects (not just strings) work correctly."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        # Use UUID objects directly instead of strings
        data = {
            "areas_affected": self.uuid_areas,
            "additional_project_title": [self.uuid_project1, self.uuid_project2],
        }

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        assert "<AreasAffected>" in xml_string
        assert "geographic_areas.pdf" in xml_string
        assert "<AdditionalProjectTitle>" in xml_string
        assert "project1.pdf" in xml_string
        assert "project2.xlsx" in xml_string
