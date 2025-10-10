"""Integration tests for attachment handling in XML generation."""

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.models.attachment import AttachmentFile, AttachmentGroup
from src.services.xml_generation.transformers.attachment_transformer import AttachmentTransformer


@pytest.mark.xml_validation
class TestAttachmentIntegration:
    """Integration tests for complete attachment workflows."""

    def setup_method(self):
        """Set up test fixtures."""
        self.transformer = AttachmentTransformer()
        self.nsmap = {
            None: "http://apply.grants.gov/forms/SF424_4_0-V4.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        }

    def test_add_attachment_elements_with_single_attachment_file(self):
        """Test add_attachment_elements with AttachmentFile object."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        areas_file = AttachmentFile(
            filename="geographic_areas.pdf",
            mime_type="application/pdf",
            file_location="./attachments/geographic_areas.pdf",
            hash_value="aGVsbG8gd29ybGQ=",
        )

        data = {"areas_affected": areas_file}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify single attachment was added
        assert "<AreasAffected>" in xml_string
        assert "<FileName>geographic_areas.pdf</FileName>" in xml_string
        assert "<MimeType>application/pdf</MimeType>" in xml_string
        assert 'href="./attachments/geographic_areas.pdf"' in xml_string
        assert "<HashValue" in xml_string
        assert "aGVsbG8gd29ybGQ=" in xml_string

    def test_add_attachment_elements_with_attachment_group(self):
        """Test add_attachment_elements with AttachmentGroup object."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        group = AttachmentGroup()
        file1 = AttachmentFile(
            filename="project1.pdf",
            mime_type="application/pdf",
            file_location="./attachments/project1.pdf",
            hash_value="cHJvamVjdDFoYXNo",
        )
        file2 = AttachmentFile(
            filename="project2.xlsx",
            mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            file_location="./attachments/project2.xlsx",
            hash_value="cHJvamVjdDJoYXNo",
        )
        group.add_file(file1)
        group.add_file(file2)

        data = {"additional_project_title": group}

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

        # Create all attachment types
        areas_file = AttachmentFile(
            filename="areas.pdf",
            mime_type="application/pdf",
            file_location="./areas.pdf",
            hash_value="areashash",
        )

        districts_file = AttachmentFile(
            filename="districts.txt",
            mime_type="text/plain",
            file_location="./districts.txt",
            hash_value="districtshash",
        )

        debt_file = AttachmentFile(
            filename="debt.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_location="./debt.docx",
            hash_value="debthash",
        )

        project_group = AttachmentGroup()
        project_file = AttachmentFile(
            filename="project.pdf",
            mime_type="application/pdf",
            file_location="./project.pdf",
            hash_value="projecthash",
        )
        project_group.add_file(project_file)

        data = {
            "areas_affected": areas_file,
            "additional_congressional_districts": districts_file,
            "debt_explanation": debt_file,
            "additional_project_title": project_group,
        }

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Verify all four attachment types are present
        assert "<AreasAffected>" in xml_string
        assert "<AdditionalCongressionalDistricts>" in xml_string
        assert "<DebtExplanation>" in xml_string
        assert "<AdditionalProjectTitle>" in xml_string

        # Verify filenames
        assert "areas.pdf" in xml_string
        assert "districts.txt" in xml_string
        assert "debt.docx" in xml_string
        assert "project.pdf" in xml_string

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

    def test_add_attachment_elements_mixed_dict_and_objects(self):
        """Test add_attachment_elements with both dict and object formats."""
        root = lxml_etree.Element("Application", nsmap=self.nsmap)

        # Mix AttachmentFile object and dict
        areas_file = AttachmentFile(
            filename="areas.pdf",
            mime_type="application/pdf",
            file_location="./areas.pdf",
            hash_value="areashash",
        )

        debt_dict = {
            "FileName": "debt.docx",
            "MimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "FileLocation": {"@href": "./debt.docx"},
            "HashValue": {"@hashAlgorithm": "SHA-1", "#text": "debthash"},
        }

        data = {"areas_affected": areas_file, "debt_explanation": debt_dict}

        self.transformer.add_attachment_elements(root, data, self.nsmap)

        xml_string = lxml_etree.tostring(root, encoding="unicode", pretty_print=True)

        # Both should be present
        assert "<AreasAffected>" in xml_string
        assert "areas.pdf" in xml_string
        assert "<DebtExplanation>" in xml_string
        assert "debt.docx" in xml_string
