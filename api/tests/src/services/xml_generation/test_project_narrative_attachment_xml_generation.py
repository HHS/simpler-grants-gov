"""
Tests for Project Narrative Attachments form XML generation.

This module tests the XML generation for the Project Narrative Attachments form,
ensuring that the generated XML matches the legacy Grants.gov XML output format
and validates against the official XSD schema.

Covers:
- Namespace declarations on the root element (xmlns:att, xmlns:glob, xmlns:globLib)
- Proper namespacing of <att:AttachedFile> elements
- Per-file FileName, MimeType, FileLocation, and HashValue output
- Correct ordering of child elements per XSD sequence
- FormVersion attribute on root element
- The 100 attachment maximum (AttachmentGroupMin1Max100DataType)
- Failure when an attachment UUID is missing from the attachment mapping
- XSD validation

XSD Reference:
https://apply07.grants.gov/apply/forms/schemas/ProjectNarrativeAttachments_1_2-V1.2.xsd
"""

import base64
import hashlib
import uuid
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.project_narrative_attachment import (
    FORM_XML_TRANSFORM_RULES as PROJECT_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "project_narrative_1_2.xml"

FORM_NS = "http://apply.grants.gov/forms/ProjectNarrativeAttachments_1_2-V1.2"
ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
GLOB_NS = "http://apply.grants.gov/system/Global-V1.0"
GLOB_LIB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"

XSD_FILE_NAME = "ProjectNarrativeAttachments_1_2-V1.2.xsd"

# Fixed UUIDs so snapshot output is deterministic
_SNAPSHOT_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

_SNAPSHOT_ATTACHMENT_MAPPING = {
    _SNAPSHOT_UUID: AttachmentInfo(
        filename="project_narrative.pdf",
        mime_type="application/pdf",
        file_location="project_narrative.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )
}

_SNAPSHOT_DATA = {"attachments": [_SNAPSHOT_UUID]}


def _generate_response(data: dict, attachment_mapping: dict | None = None):
    service = XMLGenerationService()
    return service.generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=PROJECT_NARRATIVE_ATTACHMENTS_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping or {},
        )
    )


def _generate(data: dict, attachment_mapping: dict | None = None) -> str:
    response = _generate_response(data, attachment_mapping)
    assert response.success, response.error_message
    return response.xml_data


def _parse(xml_data: str):
    parser = lxml_etree.XMLParser(remove_blank_text=True)
    return lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)


def _build_attachment_mapping(count: int) -> dict[str, AttachmentInfo]:
    return {
        str(uuid.uuid4()): AttachmentInfo(
            filename=f"narrative_{i}.pdf",
            mime_type="application/pdf",
            file_location=f"narrative_{i}.pdf",
            hash_value=base64.b64encode(hashlib.sha1(str(i).encode()).digest()).decode(),
        )
        for i in range(count)
    }


class TestProjectNarrativeAttachmentsXMLGeneration:
    """Test cases for Project Narrative Attachments XML generation service."""

    def test_generate_project_narrative_attachments_xml_basic_success(self):
        """Test basic XML generation with multiple attachments and proper namespaces."""
        uuid1 = str(uuid.uuid4())
        uuid2 = str(uuid.uuid4())

        attachment_mapping = {
            uuid1: AttachmentInfo(
                filename="project_narrative.pdf",
                mime_type="application/pdf",
                file_location="project_narrative.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            ),
            uuid2: AttachmentInfo(
                filename="narrative_appendix.docx",
                mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                file_location="narrative_appendix.docx",
                hash_value="cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
            ),
        }

        response = _generate_response({"attachments": [uuid1, uuid2]}, attachment_mapping)

        assert response.success is True
        assert response.xml_data is not None
        assert response.error_message is None

        root = _parse(response.xml_data)

        # Root element, namespaces, and FormVersion attribute required by XSD
        assert root.tag == f"{{{FORM_NS}}}ProjectNarrativeAttachments_1_2"
        assert root.nsmap["ProjectNarrativeAttachments_1_2"] == FORM_NS
        assert root.get(f"{{{FORM_NS}}}FormVersion") == "1.2"

        attachments = root.find(f"{{{FORM_NS}}}Attachments")
        assert attachments is not None

        attached_files = attachments.findall(f"{{{ATT_NS}}}AttachedFile")
        assert len(attached_files) == 2

        # Every field of every file is populated from its attachment mapping, in order
        for attached_file, attachment_uuid in zip(attached_files, [uuid1, uuid2], strict=True):
            expected = attachment_mapping[attachment_uuid]

            assert attached_file.findtext(f"{{{ATT_NS}}}FileName") == expected.filename
            assert attached_file.findtext(f"{{{ATT_NS}}}MimeType") == expected.mime_type

            file_location = attached_file.find(f"{{{ATT_NS}}}FileLocation")
            assert file_location is not None
            assert file_location.get(f"{{{ATT_NS}}}href") == expected.file_location

            hash_value = attached_file.find(f"{{{GLOB_NS}}}HashValue")
            assert hash_value is not None
            assert hash_value.text == expected.hash_value
            assert hash_value.get(f"{{{GLOB_NS}}}hashAlgorithm") == "SHA-1"

    def test_generate_project_narrative_attachments_element_order_matches_xsd(self):
        """Test that elements inside AttachedFile follow XSD sequence order.

        Per the Attachments-V1.0.xsd, the AttachedFileDataType sequence is:
        FileName -> MimeType -> FileLocation -> HashValue
        """
        xml_data = _generate(_SNAPSHOT_DATA, _SNAPSHOT_ATTACHMENT_MAPPING)

        attached_file = _parse(xml_data).find(f".//{{{ATT_NS}}}AttachedFile")
        assert attached_file is not None

        assert [child.tag for child in attached_file] == [
            f"{{{ATT_NS}}}FileName",
            f"{{{ATT_NS}}}MimeType",
            f"{{{ATT_NS}}}FileLocation",
            f"{{{GLOB_NS}}}HashValue",
        ]

    def test_generate_project_narrative_attachments_namespace_declarations_on_root(self):
        """Test that all namespace declarations appear on the root element.

        Legacy Grants.gov XML declares xmlns:att, xmlns:glob, and xmlns:globLib
        on the root element. This test ensures Simpler's output matches that behavior.
        """
        xml_data = _generate(_SNAPSHOT_DATA, _SNAPSHOT_ATTACHMENT_MAPPING)

        root = _parse(xml_data)

        assert root.nsmap["att"] == ATT_NS
        assert root.nsmap["glob"] == GLOB_NS
        assert root.nsmap["globLib"] == GLOB_LIB_NS

    def test_generate_project_narrative_attachments_max_items(self):
        """Test that the form's maximum of 100 attachments all appear in the XML."""
        attachment_mapping = _build_attachment_mapping(100)

        xml_data = _generate({"attachments": list(attachment_mapping)}, attachment_mapping)

        attached_files = _parse(xml_data).findall(f".//{{{ATT_NS}}}AttachedFile")
        assert len(attached_files) == 100
        assert [f.findtext(f"{{{ATT_NS}}}FileName") for f in attached_files] == [
            info.filename for info in attachment_mapping.values()
        ]

    def test_generate_project_narrative_attachments_missing_uuid_in_mapping(self):
        """Test that an attachment UUID absent from the attachment mapping fails generation."""
        known_uuid = str(uuid.uuid4())
        missing_uuid = str(uuid.uuid4())

        attachment_mapping = {
            known_uuid: AttachmentInfo(
                filename="project_narrative.pdf",
                mime_type="application/pdf",
                file_location="project_narrative.pdf",
                hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
            )
        }

        response = _generate_response(
            {"attachments": [known_uuid, missing_uuid]}, attachment_mapping
        )

        assert response.success is False
        assert response.xml_data is None
        assert f"Attachment UUID {missing_uuid}" in response.error_message
        assert "not found in attachment mapping" in response.error_message

    def test_generate_project_narrative_attachments_snapshot(self):
        """Regression snapshot test pinning the full generated XML output.

        To regenerate after an intentional change, delete
        snapshots/project_narrative_1_2.xml and re-run the test — it will
        create the file on first run.
        """
        xml_data = _generate(_SNAPSHOT_DATA, _SNAPSHOT_ATTACHMENT_MAPPING)

        if not _SNAPSHOT_PATH.exists():
            _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
            _SNAPSHOT_PATH.write_text(xml_data)
            pytest.skip("Snapshot created — re-run to validate")

        assert xml_data == _SNAPSHOT_PATH.read_text()


class TestProjectNarrativeAttachmentsXSDValidation:
    """XSD validation tests for Project Narrative Attachments XML."""

    @pytest.fixture
    def xsd_validator(self):
        """Create XSD validator with schemas."""
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"

        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds'.")

        xsd_path = xsd_dir / XSD_FILE_NAME

        if not xsd_path.exists():
            pytest.skip(f"{XSD_FILE_NAME} not found.")

        return XSDValidator(xsd_dir)

    def _validate(self, xsd_validator, xml_data: str) -> dict:
        return xsd_validator.validate_xml(xml_data, xsd_validator.xsd_dir / XSD_FILE_NAME)

    @pytest.mark.parametrize("attachment_count", [1, 2, 100])
    def test_project_narrative_attachments_xml_validates_against_xsd(
        self, xsd_validator, attachment_count
    ):
        """Test that generated XML validates against the official XSD schema."""
        attachment_mapping = _build_attachment_mapping(attachment_count)

        xml_data = _generate({"attachments": list(attachment_mapping)}, attachment_mapping)

        attached_files = _parse(xml_data).findall(f".//{{{ATT_NS}}}AttachedFile")
        assert len(attached_files) == attachment_count

        validation_result = self._validate(xsd_validator, xml_data)

        assert validation_result["valid"], (
            f"XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )

    def test_project_narrative_attachments_over_max_items_fails_xsd(self, xsd_validator):
        """Test that more than 100 attachments is rejected by the XSD.

        The JSON schema's maxItems: 100 mirrors AttachmentGroupMin1Max100DataType,
        so this guards against the two limits drifting apart.
        """
        attachment_mapping = _build_attachment_mapping(101)

        xml_data = _generate({"attachments": list(attachment_mapping)}, attachment_mapping)

        validation_result = self._validate(xsd_validator, xml_data)

        assert validation_result["valid"] is False
        assert "Unexpected child with tag 'att:AttachedFile' at position 101" in (
            validation_result["error_message"]
        )
