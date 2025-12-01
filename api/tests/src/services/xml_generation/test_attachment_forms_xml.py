"""Tests for attachment forms XML generation."""

from lxml import etree as lxml_etree

from src.form_schema.forms.budget_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as BUDGET_NARRATIVE_RULES,
)
from src.form_schema.forms.project_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as PROJECT_NARRATIVE_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo


class TestProjectNarrativeAttachmentXML:
    """Test cases for Project Narrative Attachment XML generation."""

    def test_generate_xml_with_single_attachment(self):
        """Test XML generation with a single attachment."""
        service = XMLGenerationService()

        # Create attachment mapping
        attachment_uuid = "12345678-1234-5678-1234-567812345678"
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="project_narrative.pdf",
                mime_type="application/pdf",
                file_location="project_narrative.pdf",
                hash_value="abc123def456",
            )
        }

        application_data = {"attachments": [attachment_uuid]}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_NARRATIVE_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify response success
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify basic XML structure
        xml_data = response.xml_data
        assert "ProjectNarrativeAttachments_1_2" in xml_data
        assert "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2" in xml_data
        
        # Parse XML to verify root element
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)
        
        # Verify root element matches expected namespace
        assert root.tag == "{http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2}ProjectNarrativeAttachments_1_2"

    def test_generate_xml_with_multiple_attachments(self):
        """Test XML generation with multiple attachments."""
        service = XMLGenerationService()

        # Create attachment mapping for multiple files
        attachment_uuid_1 = "12345678-1234-5678-1234-567812345678"
        attachment_uuid_2 = "87654321-4321-8765-4321-876543218765"

        attachment_mapping = {
            attachment_uuid_1: AttachmentInfo(
                filename="narrative_part1.pdf",
                mime_type="application/pdf",
                file_location="narrative_part1.pdf",
                hash_value="hash1",
            ),
            attachment_uuid_2: AttachmentInfo(
                filename="narrative_part2.pdf",
                mime_type="application/pdf",
                file_location="narrative_part2.pdf",
                hash_value="hash2",
            ),
        }

        application_data = {"attachments": [attachment_uuid_1, attachment_uuid_2]}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=PROJECT_NARRATIVE_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify response success
        assert response.success is True
        assert response.xml_data is not None
        
        # Verify XML contains the form structure
        xml_data = response.xml_data
        assert "ProjectNarrativeAttachments_1_2" in xml_data
        assert "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2" in xml_data


class TestBudgetNarrativeAttachmentXML:
    """Test cases for Budget Narrative Attachment XML generation."""

    def test_generate_xml_with_single_attachment(self):
        """Test XML generation with a single attachment."""
        service = XMLGenerationService()

        # Create attachment mapping
        attachment_uuid = "abcdef12-3456-7890-abcd-ef1234567890"
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="budget_narrative.pdf",
                mime_type="application/pdf",
                file_location="budget_narrative.pdf",
                hash_value="xyz789abc012",
            )
        }

        application_data = {"attachments": [attachment_uuid]}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=BUDGET_NARRATIVE_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify response success
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify basic XML structure
        xml_data = response.xml_data
        assert "BudgetNarrativeAttachments_1_2" in xml_data
        assert "http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2" in xml_data
        
        # Parse XML to verify root element
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)
        
        # Verify root element matches expected namespace
        assert root.tag == "{http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2}BudgetNarrativeAttachments_1_2"

    def test_generate_xml_structure_matches_xsd(self):
        """Test that generated XML structure matches the XSD schema requirements."""
        service = XMLGenerationService()

        attachment_uuid = "test-uuid-1234"
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="test.pdf",
                mime_type="application/pdf",
                file_location="test.pdf",
                hash_value="testhash",
            )
        }

        application_data = {"attachments": [attachment_uuid]}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=BUDGET_NARRATIVE_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify basic XML generation success
        assert response.success is True
        assert response.xml_data is not None

        xml_data = response.xml_data
        assert "http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2" in xml_data
        assert 'FormVersion="1.2"' in xml_data
        assert "BudgetNarrativeAttachments_1_2" in xml_data

