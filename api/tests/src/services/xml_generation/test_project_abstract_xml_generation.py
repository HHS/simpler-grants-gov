"""Tests for Project Abstract v1.2 form XML generation.

Verifies the generated XML matches the structure required by the XSD

XSD reference: https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd
"""

from lxml import etree as lxml_etree

from src.form_schema.forms.project_abstract import (
    FORM_XML_TRANSFORM_RULES as PROJECT_ABSTRACT_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo

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
