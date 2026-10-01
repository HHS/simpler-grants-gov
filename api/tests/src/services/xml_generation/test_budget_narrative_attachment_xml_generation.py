"""
Tests for Budget Narrative Attachments form XML generation.

This module tests the XML generation for the Budget Narrative Attachments form,
ensuring that the generated XML matches the legacy Grants.gov XML output format
and validates against the official XSD schema.

Covers:
- Namespace declarations on the root element (xmlns:att, xmlns:glob, xmlns:globLib)
- Proper namespacing of <att:AttachedFile> elements
- Correct ordering of child elements per XSD sequence
- FormVersion attribute on root element
- XSD validation

XSD Reference:
https://apply07.grants.gov/apply/forms/schemas/BudgetNarrativeAttachments_1_2-V1.2.xsd
"""

import uuid
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.budget_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "budget_narrative_1_2.xml"

# Fixed UUIDs so snapshot output is deterministic
_SNAPSHOT_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

_SNAPSHOT_ATTACHMENT_MAPPING = {
    _SNAPSHOT_UUID: AttachmentInfo(
        filename="budget_narrative.pdf",
        mime_type="application/pdf",
        file_location="budget_narrative.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )
}

_SNAPSHOT_DATA = {"attachments": [_SNAPSHOT_UUID]}


def _generate(data: dict, attachment_mapping: dict | None = None) -> str:
    service = XMLGenerationService()
    response = service.generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping or {},
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _build_attachment(uuid_str, filename, mime, location, hash_value):
    return uuid_str, AttachmentInfo(
        filename=filename,
        mime_type=mime,
        file_location=location,
        hash_value=hash_value,
    )


class TestBudgetNarrativeAttachmentsXMLGeneration:
    """Test cases for Budget Narrative Attachments XML generation service."""

    def test_generate_budget_narrative_attachments_xml_basic_success(self):
        """Test basic XML generation with multiple attachments and proper namespaces."""
        service = XMLGenerationService()

        uuid1 = str(uuid.uuid4())
        uuid2 = str(uuid.uuid4())

        attachment_mapping = dict(
            [
                _build_attachment(
                    uuid1,
                    "budget_narrative.pdf",
                    "application/pdf",
                    "budget_narrative.pdf",
                    "aeB1+6gdFwih51ijIRn3b8QYn24=",
                ),
                _build_attachment(
                    uuid2,
                    "supplemental_budget.pdf",
                    "application/pdf",
                    "supplemental_budget.pdf",
                    "cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
                ),
            ]
        )

        request = XMLGenerationRequest(
            application_data={"attachments": [uuid1, uuid2]},
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        xml_data = response.xml_data

        # Root element and default namespace
        assert "<BudgetNarrativeAttachments_1_2:BudgetNarrativeAttachments_1_2" in xml_data
        assert (
            'xmlns:BudgetNarrativeAttachments_1_2="http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2"'
            in xml_data
        )

        # Attachment namespaces must be declared on root element (matching legacy Grants.gov output)
        assert 'xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"' in xml_data
        assert 'xmlns:glob="http://apply.grants.gov/system/Global-V1.0"' in xml_data
        assert 'xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"' in xml_data

        # FormVersion attribute required by XSD
        assert 'FormVersion="1.2"' in xml_data

        # Correct namespaced attachment elements
        assert "<att:AttachedFile>" in xml_data
        assert xml_data.count("<att:AttachedFile>") == 2

        # Verify file content
        assert "budget_narrative.pdf" in xml_data
        assert "supplemental_budget.pdf" in xml_data

    def test_generate_budget_narrative_attachments_element_order_matches_xsd(self):
        """Test that elements inside AttachedFile follow XSD sequence order.

        Per the Attachments-V1.0.xsd, the AttachedFileDataType sequence is:
        FileName -> MimeType -> FileLocation -> HashValue
        """
        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())

        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="budget.pdf",
                mime_type="application/pdf",
                file_location="budget.pdf",
                hash_value="cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
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

    def test_generate_budget_narrative_attachments_namespace_declarations_on_root(self):
        """Test that all namespace declarations appear on the root element.

        Legacy Grants.gov XML declares xmlns:att, xmlns:glob, and xmlns:globLib
        on the root element. This test ensures Simpler's output matches that behavior.
        """
        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())
        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="budget_narrative.pdf",
                mime_type="application/pdf",
                file_location="budget_narrative.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)
        assert response.success is True

        # Parse to find the root element specifically
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(response.xml_data.encode("utf-8"), parser=parser)

        # Verify root element tag
        assert (
            root.tag
            == "{http://apply.grants.gov/forms/BudgetNarrativeAttachments_1_2-V1.2}BudgetNarrativeAttachments_1_2"
        )

        # All three attachment-related namespaces must be in the root's nsmap
        assert "att" in root.nsmap
        assert root.nsmap["att"] == "http://apply.grants.gov/system/Attachments-V1.0"

        assert "glob" in root.nsmap
        assert root.nsmap["glob"] == "http://apply.grants.gov/system/Global-V1.0"

        assert "globLib" in root.nsmap
        assert root.nsmap["globLib"] == "http://apply.grants.gov/system/GlobalLibrary-V2.0"

    def test_generate_budget_narrative_attachments_snapshot(self):
        """Regression snapshot test pinning the full generated XML output.

        To regenerate after an intentional change, delete
        snapshots/budget_narrative_1_2.xml and re-run the test — it will
        create the file on first run.
        """
        xml_data = _generate(_SNAPSHOT_DATA, _SNAPSHOT_ATTACHMENT_MAPPING)

        if not _SNAPSHOT_PATH.exists():
            _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
            _SNAPSHOT_PATH.write_text(xml_data)
            pytest.skip("Snapshot created — re-run to validate")

        assert xml_data == _SNAPSHOT_PATH.read_text()


class TestBudgetNarrativeAttachmentsXSDValidation:
    """XSD validation tests for Budget Narrative Attachments XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with schemas."""
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"

        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")

        xsd_path = xsd_dir / "BudgetNarrativeAttachments_1_2-V1.2.xsd"

        if not xsd_path.exists():
            pytest.skip("BudgetNarrativeAttachments_1_2-V1.2.xsd not found.")

        return XSDValidator(xsd_dir)

    def test_budget_narrative_attachments_xml_validates_against_xsd(self, xsd_validator):
        """Test that generated XML validates against official XSD schema."""
        service = XMLGenerationService()

        attachment_uuid = str(uuid.uuid4())

        attachment_mapping = {
            attachment_uuid: AttachmentInfo(
                filename="budget_narrative.pdf",
                mime_type="application/pdf",
                file_location="budget_narrative.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            )
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [attachment_uuid]},
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True

        xml_data = response.xml_data

        xsd_path = xsd_validator.xsd_dir / "BudgetNarrativeAttachments_1_2-V1.2.xsd"

        validation_result = xsd_validator.validate_xml(xml_data, xsd_path)

        assert validation_result["valid"], (
            f"XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )

    def test_budget_narrative_attachments_multiple_files_validates_against_xsd(self, xsd_validator):
        """Test that Budget Narrative Attachments with multiple files validates against XSD."""
        service = XMLGenerationService()

        uuid1 = str(uuid.uuid4())
        uuid2 = str(uuid.uuid4())

        attachment_mapping = {
            uuid1: AttachmentInfo(
                filename="budget_narrative.pdf",
                mime_type="application/pdf",
                file_location="budget_narrative.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            ),
            uuid2: AttachmentInfo(
                filename="supplemental_budget.pdf",
                mime_type="application/pdf",
                file_location="supplemental_budget.pdf",
                hash_value="cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
            ),
        }

        request = XMLGenerationRequest(
            application_data={"attachments": [uuid1, uuid2]},
            transform_config=BUDGET_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )

        response = service.generate_xml(request)

        assert response.success is True
        xml_data = response.xml_data
        assert xml_data is not None
        assert len(xml_data) > 0

        # Parse XML
        parser = lxml_etree.XMLParser(remove_blank_text=True)
        root = lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)

        # Ensure root exists and correct
        assert root.tag.endswith("BudgetNarrativeAttachments_1_2")

        # Ensure exactly two attachments exist
        att_ns = "{http://apply.grants.gov/system/Attachments-V1.0}"
        attachments = root.findall(f".//{att_ns}AttachedFile")
        assert len(attachments) == 2

        # Validate against XSD
        xsd_path = xsd_validator.xsd_dir / "BudgetNarrativeAttachments_1_2-V1.2.xsd"

        validation_result = xsd_validator.validate_xml(xml_data, xsd_path)

        assert validation_result["valid"], (
            f"Multi-file Budget Narrative Attachments validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )
