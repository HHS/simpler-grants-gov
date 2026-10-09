"""Tests for Project Abstract v1.2 form XML generation.

Verifies the generated XML matches the structure required by the XSD

XSD reference: https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.project_abstract import (
    FORM_XML_TRANSFORM_RULES as PROJECT_ABSTRACT_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

FORM_NS = "http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2"
ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
GLOB_NS = "http://apply.grants.gov/system/Global-V1.0"

ATTACHMENT_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
ATTACHMENT_INFO = AttachmentInfo(
    filename="project_abstract.pdf",
    mime_type="application/pdf",
    file_location="project_abstract.pdf",
    hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
)


def _generate(attachment_uuid: str = ATTACHMENT_UUID, attachment_info: AttachmentInfo = ATTACHMENT_INFO):  # type: ignore[assignment]
    service = XMLGenerationService()
    request = XMLGenerationRequest(
        application_data={"attachment": attachment_uuid},
        transform_config=PROJECT_ABSTRACT_TRANSFORM_RULES,
        attachment_mapping={attachment_uuid: attachment_info},
    )
    response = service.generate_xml(request)
    assert response.success, f"XML generation failed: {response.error_message}"
    return response.xml_data


class TestProjectAbstractXMLStructure:
    """Verify the wrapper element hierarchy matches the XSD sequence."""

    def test_root_element_is_form_namespace(self):
        xml_data = _generate()
        root = lxml_etree.fromstring(xml_data.encode())
        assert root.tag == f"{{{FORM_NS}}}Project_Abstract_1_2"

    def test_form_version_attribute(self):
        xml_data = _generate()
        root = lxml_etree.fromstring(xml_data.encode())
        assert root.get(f"{{{FORM_NS}}}FormVersion") == "1.2"

    def test_project_abstract_add_attachment_wrapper_present(self):
        """XSD requires ProjectAbstractAddAttachment as direct child of root."""
        xml_data = _generate()
        root = lxml_etree.fromstring(xml_data.encode())
        wrapper = root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment")
        assert wrapper is not None, "Missing ProjectAbstractAddAttachment element"

    def test_attached_file_wrapper_present(self):
        """XSD requires AttachedFile nested inside ProjectAbstractAddAttachment."""
        xml_data = _generate()
        root = lxml_etree.fromstring(xml_data.encode())
        wrapper = root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment")
        attached_file = wrapper.find(f"{{{FORM_NS}}}AttachedFile")
        assert attached_file is not None, "Missing AttachedFile element"

    def test_attachment_content_is_not_direct_child_of_root(self):
        """att:FileName must NOT appear as a direct child of the root form element."""
        xml_data = _generate()
        root = lxml_etree.fromstring(xml_data.encode())
        # Direct child search (not recursive) must find nothing
        direct_filename = root.find(f"{{{ATT_NS}}}FileName")
        assert direct_filename is None, "att:FileName must be nested, not a direct child of root"


class TestProjectAbstractXMLContent:
    """Verify attachment field values are serialised correctly."""

    def _get_attached_file(self, xml_data: str) -> lxml_etree._Element:
        root = lxml_etree.fromstring(xml_data.encode())
        wrapper = root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment")
        return wrapper.find(f"{{{FORM_NS}}}AttachedFile")

    def test_filename_element(self):
        xml_data = _generate()
        attached_file = self._get_attached_file(xml_data)
        filename_elem = attached_file.find(f"{{{ATT_NS}}}FileName")
        assert filename_elem is not None
        assert filename_elem.text == "project_abstract.pdf"

    def test_mime_type_element(self):
        xml_data = _generate()
        attached_file = self._get_attached_file(xml_data)
        mime_elem = attached_file.find(f"{{{ATT_NS}}}MimeType")
        assert mime_elem is not None
        assert mime_elem.text == "application/pdf"

    def test_file_location_href(self):
        xml_data = _generate()
        attached_file = self._get_attached_file(xml_data)
        loc_elem = attached_file.find(f"{{{ATT_NS}}}FileLocation")
        assert loc_elem is not None
        assert loc_elem.get(f"{{{ATT_NS}}}href") == "project_abstract.pdf"

    def test_hash_value_element(self):
        xml_data = _generate()
        attached_file = self._get_attached_file(xml_data)
        hash_elem = attached_file.find(f"{{{GLOB_NS}}}HashValue")
        assert hash_elem is not None
        assert hash_elem.get(f"{{{GLOB_NS}}}hashAlgorithm") == "SHA-1"
        assert hash_elem.text == "aeB1+6gdFwih51ijIRn3b8QYn24="

    def test_different_attachment_filename(self):
        info = AttachmentInfo(
            filename="my_abstract.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_location="my_abstract.docx",
            hash_value="abc123=",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        assert attached_file.find(f"{{{ATT_NS}}}FileName").text == "my_abstract.docx"
        assert "wordprocessingml" in attached_file.find(f"{{{ATT_NS}}}MimeType").text

    def test_filename_xml_escaping(self):
        """Characters requiring XML escaping in FileName are serialised correctly."""
        info = AttachmentInfo(
            filename='project & <draft> "v1".pdf',
            mime_type="application/pdf",
            file_location="project_abstract.pdf",
            hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        # lxml returns the unescaped text value
        assert attached_file.find(f"{{{ATT_NS}}}FileName").text == 'project & <draft> "v1".pdf'
        # Raw XML bytes must contain escaped entities
        xml_bytes = xml_data.encode()
        assert b"&amp;" in xml_bytes or b"&lt;" in xml_bytes

    def test_filename_at_max_length_255(self):
        """FileName at the XSD maximum of 255 characters is accepted."""
        long_name = "a" * 251 + ".pdf"  # exactly 255 chars
        assert len(long_name) == 255
        info = AttachmentInfo(
            filename=long_name,
            mime_type="application/pdf",
            file_location=long_name,
            hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        assert attached_file.find(f"{{{ATT_NS}}}FileName").text == long_name

    def test_mime_type_at_max_length_255(self):
        """MimeType at the XSD maximum of 255 characters is accepted."""
        long_mime = "application/" + "x" * 243  # exactly 255 chars
        assert len(long_mime) == 255
        info = AttachmentInfo(
            filename="project_abstract.pdf",
            mime_type=long_mime,
            file_location="project_abstract.pdf",
            hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        assert attached_file.find(f"{{{ATT_NS}}}MimeType").text == long_mime

    def test_explicit_hash_algorithm(self):
        """A non-default hashAlgorithm value propagates into the XML attribute."""
        info = AttachmentInfo(
            filename="project_abstract.pdf",
            mime_type="application/pdf",
            file_location="project_abstract.pdf",
            hash_value="abc123=",
            hash_algorithm="SHA-256",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        hash_elem = attached_file.find(f"{{{GLOB_NS}}}HashValue")
        assert hash_elem.get(f"{{{GLOB_NS}}}hashAlgorithm") == "SHA-256"

    def test_file_location_href_independent_of_filename(self):
        """FileLocation/@href is taken from file_location, not filename — they can differ."""
        info = AttachmentInfo(
            filename="project_abstract.pdf",
            mime_type="application/pdf",
            file_location="s3://bucket/submissions/abc123/project_abstract.pdf",
            hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
        )
        xml_data = _generate(attachment_info=info)
        attached_file = self._get_attached_file(xml_data)
        filename_text = attached_file.find(f"{{{ATT_NS}}}FileName").text
        href = attached_file.find(f"{{{ATT_NS}}}FileLocation").get(f"{{{ATT_NS}}}href")
        assert filename_text == "project_abstract.pdf"
        assert href == "s3://bucket/submissions/abc123/project_abstract.pdf"
        assert filename_text != href


class TestProjectAbstractLegacyParity:
    """Verify structural parity with the legacy Grants.gov XML format.

    Legacy XML (from GrantApplication.xml downloaded from Grants.gov):

        <Project_Abstract_1_2:Project_Abstract_1_2
            xmlns:att="http://apply.grants.gov/system/Attachments-V1.0"
            xmlns:glob="http://apply.grants.gov/system/Global-V1.0"
            xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0"
            Project_Abstract_1_2:FormVersion="1.2"
            xmlns:Project_Abstract_1_2="http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2">
          <Project_Abstract_1_2:ProjectAbstractAddAttachment>
            <Project_Abstract_1_2:AttachedFile>
              <att:FileName>1234-PDF_TestPage.pdf</att:FileName>
              <att:MimeType>application/pdf</att:MimeType>
              <att:FileLocation att:href="347514.Project_Abstract_1_2_P1.mandatoryFile0"/>
              <glob:HashValue glob:hashAlgorithm="SHA-1">aeB1+6gdFwih51ijIRn3b8QYn24=</glob:HashValue>
            </Project_Abstract_1_2:AttachedFile>
          </Project_Abstract_1_2:ProjectAbstractAddAttachment>
        </Project_Abstract_1_2:Project_Abstract_1_2>

    Previously, the simpler output placed att:FileName etc. as direct children of the root
    element (missing both wrapper elements), which failed XSD validation.
    """

    def _parse(self, xml_data: str) -> lxml_etree._Element:
        return lxml_etree.fromstring(xml_data.encode())

    def test_element_hierarchy_matches_legacy(self):
        """Generated XML must have the same three-level element hierarchy as legacy output."""
        root = self._parse(_generate())

        # Level 1: root is the form element
        assert root.tag == f"{{{FORM_NS}}}Project_Abstract_1_2"

        # Level 2: ProjectAbstractAddAttachment is a direct child of root (form namespace)
        wrapper = root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment")
        assert wrapper is not None, "Missing ProjectAbstractAddAttachment (legacy level-2 wrapper)"

        # Level 3: AttachedFile is a direct child of the wrapper (form namespace)
        attached_file = wrapper.find(f"{{{FORM_NS}}}AttachedFile")
        assert attached_file is not None, "Missing AttachedFile (legacy level-3 wrapper)"

        # Content elements live inside AttachedFile, not on root
        assert attached_file.find(f"{{{ATT_NS}}}FileName") is not None
        assert attached_file.find(f"{{{ATT_NS}}}MimeType") is not None
        assert attached_file.find(f"{{{ATT_NS}}}FileLocation") is not None
        assert attached_file.find(f"{{{GLOB_NS}}}HashValue") is not None

    def test_content_not_on_root_as_in_previous_simpler_output(self):
        """Regression: previous simpler output placed att:FileName directly on root.

        The legacy Grants.gov format wraps content in ProjectAbstractAddAttachment >
        AttachedFile. Any direct child of root with the att: or glob: namespace is
        a sign of the old broken structure.
        """
        root = self._parse(_generate())

        assert (
            root.find(f"{{{ATT_NS}}}FileName") is None
        ), "att:FileName must not be a direct child of root (regression: pre-fix simpler output)"
        assert root.find(f"{{{ATT_NS}}}MimeType") is None
        assert root.find(f"{{{ATT_NS}}}FileLocation") is None
        assert root.find(f"{{{GLOB_NS}}}HashValue") is None

    def test_wrapper_elements_use_form_namespace_not_att_namespace(self):
        """Legacy uses the form namespace for wrapper elements, not att: or no namespace."""
        root = self._parse(_generate())

        # Wrappers must be in the form namespace
        assert root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment") is not None
        assert (
            root.find(f"{{{FORM_NS}}}ProjectAbstractAddAttachment").find(
                f"{{{FORM_NS}}}AttachedFile"
            )
            is not None
        )

        # Must not exist without the form namespace prefix
        assert root.find("ProjectAbstractAddAttachment") is None
        assert root.find("AttachedFile") is None


class TestProjectAbstractXSDValidation:
    """Validate generated XML against the Project_Abstract_1_2-V1.2.xsd schema."""

    @pytest.fixture
    def xsd_validator(self):
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_dir.exists():
            pytest.skip("XSD directory not found. Run 'flask task fetch-xsds' to download schemas.")
        xsd_path = xsd_dir / "Project_Abstract_1_2-V1.2.xsd"
        if not xsd_path.exists():
            pytest.skip(
                "Project_Abstract_1_2-V1.2.xsd not found. "
                "Run 'flask task fetch-xsds' to download schemas."
            )
        return XSDValidator(xsd_dir)

    def _xsd_path(self, xsd_validator: XSDValidator) -> Path:
        return xsd_validator.xsd_dir / "Project_Abstract_1_2-V1.2.xsd"

    def test_full_payload_validates_against_xsd(self, xsd_validator):
        """Standard PDF attachment output passes XSD validation."""
        xml_data = _generate()
        result = xsd_validator.validate_xml(xml_data, self._xsd_path(xsd_validator))
        assert result["valid"], f"XSD validation failed: {result['error_message']}\n{xml_data}"

    def test_minimal_payload_validates_against_xsd(self, xsd_validator):
        """Docx attachment (different mime type) also passes XSD validation."""
        info = AttachmentInfo(
            filename="abstract.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_location="abstract.docx",
            hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
        )
        xml_data = _generate(attachment_info=info)
        result = xsd_validator.validate_xml(xml_data, self._xsd_path(xsd_validator))
        assert result["valid"], f"XSD validation failed: {result['error_message']}\n{xml_data}"


class TestProjectAbstractNegativePaths:
    """Verify the generation service fails gracefully on bad inputs."""

    def test_missing_attachment_uuid_returns_error(self):
        """UUID in application_data has no entry in attachment_mapping → failure response."""
        service = XMLGenerationService()
        unknown_uuid = "ffffffff-ffff-ffff-ffff-ffffffffffff"
        request = XMLGenerationRequest(
            application_data={"attachment": unknown_uuid},
            transform_config=PROJECT_ABSTRACT_TRANSFORM_RULES,
            attachment_mapping={},
        )
        response = service.generate_xml(request)
        assert response.success is False
        assert unknown_uuid in response.error_message

    def test_missing_required_attachment_field_returns_error(self):
        """No 'attachment' key in application_data → generated XML fails XSD validation.

        The generator itself returns success=True with incomplete XML when application_data
        is empty; XSD validation is the layer that catches the missing required fields.
        """
        from src.services.xml_generation.validation.xsd_validator import XSDValidator

        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not xsd_dir.exists():
            pytest.skip("XSD directory not found.")
        xsd_path = xsd_dir / "Project_Abstract_1_2-V1.2.xsd"
        if not xsd_path.exists():
            pytest.skip("Project_Abstract_1_2-V1.2.xsd not found.")

        xsd_validator = XSDValidator(xsd_dir)

        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data={},
            transform_config=PROJECT_ABSTRACT_TRANSFORM_RULES,
            attachment_mapping={},
        )
        response = service.generate_xml(request)
        # Generator succeeds but produces incomplete XML (no AttachedFile element)
        assert response.success is True
        assert response.xml_data is not None
        # XSD validation must catch the missing required element
        result = xsd_validator.validate_xml(response.xml_data, xsd_path)
        assert (
            result["valid"] is False
        ), f"Expected XSD validation to fail for incomplete XML, but it passed.\n{response.xml_data}"
