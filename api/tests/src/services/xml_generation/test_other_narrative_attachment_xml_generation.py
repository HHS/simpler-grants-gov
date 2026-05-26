"""
Tests for Other Narrative Attachments form XML generation.

This module tests the XML generation for the Other Narrative Attachments form,
ensuring that the generated XML matches the legacy Grants.gov XML output format
and validates against the official XSD schema.

Covers:
- Namespace handling via _get_namespace helper
- Proper namespacing of <att:AttachedFile> elements
- Correct ordering of child elements per XSD sequence

XSD Reference:
https://apply07.grants.gov/apply/forms/schemas/OtherNarrativeAttachments_1_2-V1.2.xsd
"""

import uuid
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.other_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as OTHER_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator


def _build_attachment(uuid_str, filename, mime, location, hash_value):
    return uuid_str, AttachmentInfo(
        filename=filename,
        mime_type=mime,
        file_location=location,
        hash_value=hash_value,
    )


class TestOtherNarrativeAttachmentsXMLGeneration:
    """Test cases for Other Narrative Attachments XML generation service."""

    def test_generate_other_narrative_attachments_xml_basic_success(self):
        """Test basic XML generation with multiple attachments and proper namespaces."""
        service = XMLGenerationService()

        uuid1 = str(uuid.uuid4())
        uuid2 = str(uuid.uuid4())

        attachment_mapping = dict(
            [
                _build_attachment(
                    uuid1,
                    "other_attachment.pdf",
                    "application/pdf",
                    "other_attachment.pdf",
                    "aeB1+6gdFwih51ijIRn3b8QYn24=",
                ),
                _build_attachment(
                    uuid2,
                    "additional_attachment.pdf",
                    "application/pdf",
                    "additional_attachment.pdf",
                    "cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
                ),
            ]
        )

        request = XMLGenerationRequest(
            application_data={"attachments": [uuid1, uuid2]},
            transform_config=OTHER_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data

        # Root element and namespace
        assert "<OtherNarrativeAttachments_1_2:OtherNarrativeAttachments_1_2" in xml_data
        assert (
            'xmlns:OtherNarrativeAttachments_1_2="http://apply.grants.gov/forms/OtherNarrativeAttachments_1_2-V1.2"'
            in xml_data
        )

        # Attachment namespace must exist
        assert 'xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"' in xml_data

        # Ensure correct namespaced elements
        assert "<att:AttachedFile>" in xml_data
        assert xml_data.count("<att:AttachedFile>") == 2

        # Verify file content
        assert "other_attachment.pdf" in xml_data
        assert "additional_attachment.pdf" in xml_data

    def test_generate_other_narrative_attachments_element_order_matches_xsd(self):
        """Test that elements inside AttachedFile follow XSD sequence order."""
        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())

        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="file.pdf",
                mime_type="application/pdf",
                file_location="file.pdf",
                hash_value="cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=OTHER_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data

        # Order: FileName -> MimeType -> FileLocation -> HashValue
        file_name_pos = xml_data.find("FileName")
        mime_pos = xml_data.find("MimeType")
        location_pos = xml_data.find("FileLocation")
        hash_pos = xml_data.find("HashValue")

        assert file_name_pos < mime_pos < location_pos < hash_pos


class TestOtherNarrativeAttachmentsXSDValidation:
    """XSD validation tests for Other Narrative Attachments XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with schemas."""
        xsd_dir = Path(__file__).parent.parent.parent.parent.parent / "services/xml_generation/xsds"

        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")

        xsd_path = xsd_dir / "OtherNarrativeAttachments_1_2-V1.2.xsd"

        if not xsd_path.exists():
            pytest.skip("OtherNarrativeAttachments_1_2-V1.2.xsd not found.")

        return XSDValidator(xsd_dir)

    def test_other_narrative_attachments_xml_validates_against_xsd(self, xsd_validator):
        """Test that generated XML validates against official XSD schema."""
        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())

        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="other_attachment.pdf",
                mime_type="application/pdf",
                file_location="other_attachment.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=OTHER_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True

        xml_data = response.xml_data

        xsd_path = xsd_validator.xsd_dir / "OtherNarrativeAttachments_1_2-V1.2.xsd"

        validation_result = xsd_validator.validate_xml(xml_data, xsd_path)

        assert validation_result["valid"], (
            f"XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )

    def test_other_narrative_attachments_minimal_data_validates_against_xsd(self, xsd_validator):
        """Test that Other Narrative Attachments with minimal required data (one attachment) validates against XSD."""

        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())

        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="minimal_attachment.pdf",
                mime_type="application/pdf",
                file_location="minimal_attachment.pdf",
                hash_value="cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=OTHER_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        # Basic sanity
        assert response.success is True
        xml_data = response.xml_data
        assert xml_data is not None
        assert len(xml_data) > 0

        # Parse XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Ensure root exists and correct
        assert root.tag.endswith("OtherNarrativeAttachments_1_2")

        # Ensure exactly one attachment exists
        att_ns = "{http://apply.grants.gov/system/Attachments-V1.0}"
        attachments = root.findall(f".//{att_ns}AttachedFile")
        assert len(attachments) == 1

        # Validate against XSD
        xsd_path = xsd_validator.xsd_dir / "OtherNarrativeAttachments_1_2-V1.2.xsd"

        validation_result = xsd_validator.validate_xml(xml_data, xsd_path)

        assert validation_result["valid"], (
            f"Minimal Other Narrative Attachments validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )
