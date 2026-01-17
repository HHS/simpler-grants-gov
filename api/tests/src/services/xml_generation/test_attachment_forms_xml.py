"""Tests for attachment forms XML generation."""

from lxml import etree as lxml_etree

from src.form_schema.forms.attachment_form import FORM_XML_TRANSFORM_RULES as ATTACHMENT_FORM_RULES
from src.form_schema.forms.budget_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as BUDGET_NARRATIVE_RULES,
)
from src.form_schema.forms.project_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as PROJECT_NARRATIVE_RULES,
)
from src.form_schema.forms.attachment_form import (
    FORM_XML_TRANSFORM_RULES as ATTACHMENT_FORM_RULES,
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
        assert (
            root.tag
            == "{http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2}ProjectNarrativeAttachments_1_2"
        )

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
        assert (
            root.tag
            == "{http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2}BudgetNarrativeAttachments_1_2"
        )

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


class TestAttachmentFormXML:
    """Test cases for Attachment Form XML generation."""

    def test_generate_xml_with_single_attachment(self):
        """Test XML generation with a single attachment field."""
        service = XMLGenerationService()

        # Create attachment mapping
        attachment_uuid = "11111111-2222-3333-4444-555555555555"
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="document1.pdf",
                mime_type="application/pdf",
                file_location="document1.pdf",
                hash_value="hash123",
            )
        }

        application_data = {"att1": attachment_uuid}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=ATTACHMENT_FORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify response success
        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        # Verify basic XML structure
        xml_data = response.xml_data
        assert "AttachmentForm_1_2" in xml_data
        assert "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2" in xml_data

        # Parse XML to verify root element
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Verify root element matches expected namespace
        assert (
            root.tag == "{http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2}AttachmentForm_1_2"
        )

        # Define namespaces
        namespaces = {
            "af": "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        # Verify ATT1 attachment exists and has correct structure
        att1_elem = root.find(".//af:ATT1", namespaces)
        assert att1_elem is not None, "ATT1 element not found in XML"

        # Verify ATT1File wrapper exists
        att1_file_elem = att1_elem.find(".//af:ATT1File", namespaces)
        assert att1_file_elem is not None, "ATT1File element not found in XML"

        # Verify attachment metadata
        filename = att1_file_elem.find(".//att:FileName", namespaces)
        assert filename is not None, "FileName element not found"
        assert filename.text == "document1.pdf"

        mimetype = att1_file_elem.find(".//att:MimeType", namespaces)
        assert mimetype is not None, "MimeType element not found"
        assert mimetype.text == "application/pdf"

        file_location = att1_file_elem.find(".//att:FileLocation", namespaces)
        assert file_location is not None, "FileLocation element not found"
        href_attr = file_location.get(f"{{{namespaces['att']}}}href")
        assert href_attr == "document1.pdf"

        hash_value = att1_file_elem.find(".//glob:HashValue", namespaces)
        assert hash_value is not None, "HashValue element not found"
        assert hash_value.text == "hash123"

    def test_generate_xml_with_multiple_attachments(self):
        """Test XML generation with multiple attachment fields."""
        from src.form_schema.forms.attachment_form import (
            FORM_XML_TRANSFORM_RULES as ATTACHMENT_FORM_RULES,
        )

        service = XMLGenerationService()

        # Create attachment mapping for multiple fields
        attachment_uuid_1 = "11111111-2222-3333-4444-555555555555"
        attachment_uuid_5 = "55555555-6666-7777-8888-999999999999"
        attachment_uuid_15 = "ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb"

        attachment_mapping = {
            attachment_uuid_1: AttachmentInfo(
                filename="doc1.pdf",
                mime_type="application/pdf",
                file_location="doc1.pdf",
                hash_value="hash1",
            ),
            attachment_uuid_5: AttachmentInfo(
                filename="doc5.pdf",
                mime_type="application/pdf",
                file_location="doc5.pdf",
                hash_value="hash5",
            ),
            attachment_uuid_15: AttachmentInfo(
                filename="doc15.pdf",
                mime_type="application/pdf",
                file_location="doc15.pdf",
                hash_value="hash15",
            ),
        }

        application_data = {
            "att1": attachment_uuid_1,
            "att5": attachment_uuid_5,
            "att15": attachment_uuid_15,
        }

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=ATTACHMENT_FORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify response success
        assert response.success is True
        assert response.xml_data is not None

        # Verify XML contains the form structure
        xml_data = response.xml_data
        assert "AttachmentForm_1_2" in xml_data
        assert "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2" in xml_data

        # Parse XML and verify attachment elements exist
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Define namespaces
        namespaces = {
            "af": "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        # Verify ATT1 attachment exists and has correct structure
        att1_elem = root.find(".//af:ATT1", namespaces)
        assert att1_elem is not None, "ATT1 element not found in XML"

        # Verify ATT1File wrapper exists
        att1_file_elem = att1_elem.find(".//af:ATT1File", namespaces)
        assert att1_file_elem is not None, "ATT1File element not found in XML"

        # Verify attachment metadata
        filename = att1_file_elem.find(".//att:FileName", namespaces)
        assert filename is not None, "FileName element not found"
        assert filename.text == "doc1.pdf"

        mimetype = att1_file_elem.find(".//att:MimeType", namespaces)
        assert mimetype is not None, "MimeType element not found"
        assert mimetype.text == "application/pdf"

        file_location = att1_file_elem.find(".//att:FileLocation", namespaces)
        assert file_location is not None, "FileLocation element not found"
        href_attr = file_location.get(f"{{{namespaces['att']}}}href")
        assert href_attr == "doc1.pdf"

        hash_value = att1_file_elem.find(".//glob:HashValue", namespaces)
        assert hash_value is not None, "HashValue element not found"
        assert hash_value.text == "hash1"

        # Verify ATT5 attachment exists
        att5_elem = root.find(".//af:ATT5", namespaces)
        assert att5_elem is not None, "ATT5 element not found in XML"
        att5_file_elem = att5_elem.find(".//af:ATT5File", namespaces)
        assert att5_file_elem is not None, "ATT5File element not found in XML"
        
        att5_filename = att5_file_elem.find(".//att:FileName", namespaces)
        assert att5_filename is not None
        assert att5_filename.text == "doc5.pdf"
        
        att5_hash = att5_file_elem.find(".//glob:HashValue", namespaces)
        assert att5_hash is not None
        assert att5_hash.text == "hash5"

        # Verify ATT15 attachment exists
        att15_elem = root.find(".//af:ATT15", namespaces)
        assert att15_elem is not None, "ATT15 element not found in XML"
        att15_file_elem = att15_elem.find(".//af:ATT15File", namespaces)
        assert att15_file_elem is not None, "ATT15File element not found in XML"
        
        att15_filename = att15_file_elem.find(".//att:FileName", namespaces)
        assert att15_filename is not None
        assert att15_filename.text == "doc15.pdf"
        
        att15_hash = att15_file_elem.find(".//glob:HashValue", namespaces)
        assert att15_hash is not None
        assert att15_hash.text == "hash15"

    def test_generate_xml_structure_matches_xsd(self):
        """Test that generated XML structure matches the XSD schema requirements."""
        service = XMLGenerationService()

        attachment_uuid = "test-uuid-abcd"
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="test.pdf",
                mime_type="application/pdf",
                file_location="test.pdf",
                hash_value="testhash",
            )
        }

        application_data = {"att3": attachment_uuid}

        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=ATTACHMENT_FORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Verify basic XML generation success
        assert response.success is True
        assert response.xml_data is not None

        xml_data = response.xml_data
        assert "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2" in xml_data
        assert 'FormVersion="1.2"' in xml_data
        assert "AttachmentForm_1_2" in xml_data

        # Parse XML and verify attachment elements exist
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Define namespaces
        namespaces = {
            "af": "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        # Verify ATT3 attachment exists and has correct structure
        att3_elem = root.find(".//af:ATT3", namespaces)
        assert att3_elem is not None, "ATT3 element not found in XML"

        # Verify ATT3File wrapper exists
        att3_file_elem = att3_elem.find(".//af:ATT3File", namespaces)
        assert att3_file_elem is not None, "ATT3File element not found in XML"

        # Verify attachment metadata exists
        filename = att3_file_elem.find(".//att:FileName", namespaces)
        assert filename is not None, "FileName element not found"
        assert filename.text == "test.pdf"

        mimetype = att3_file_elem.find(".//att:MimeType", namespaces)
        assert mimetype is not None, "MimeType element not found"
        assert mimetype.text == "application/pdf"

        file_location = att3_file_elem.find(".//att:FileLocation", namespaces)
        assert file_location is not None, "FileLocation element not found"

        hash_value = att3_file_elem.find(".//glob:HashValue", namespaces)
        assert hash_value is not None, "HashValue element not found"
