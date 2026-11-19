from pathlib import Path

from lxml import etree

from src.form_schema.forms.ed_abstract_form_generated import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD = XSD_DIR / "ED_Abstract-V1.1.xsd"
ATTACHMENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


def test_ed_abstract_xml_matches_xsd_and_attachment():
    data = AttachmentInfo(
        filename="abstract.pdf",
        mime_type="application/pdf",
        file_location="abstract.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )
    result = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data={"attachment": ATTACHMENT_ID},
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping={ATTACHMENT_ID: data},
        )
    )
    assert result.success, result.error_message
    outcome = XSDValidator(XSD_DIR).validate_xml(result.xml_data, XSD)
    assert outcome["valid"], outcome["error_message"]
    root = etree.fromstring(result.xml_data.encode())
    assert root.tag == "{http://apply.grants.gov/forms/ED_Abstract-V1.1}AbstractAttachments"
    assert (
        root.findtext(".//{http://apply.grants.gov/system/Attachments-V1.0}FileName")
        == "abstract.pdf"
    )


def test_ed_abstract_xml_rejects_unknown_attachment():
    result = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data={"attachment": ATTACHMENT_ID},
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping={},
        )
    )
    assert not result.success
    assert ATTACHMENT_ID in result.error_message
