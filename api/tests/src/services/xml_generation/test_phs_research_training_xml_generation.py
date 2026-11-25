from pathlib import Path

from lxml import etree

from src.form_schema.forms.phs_398_research_training_program_plan_generated import (
    FORM_XML_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD = XSD_DIR / "PHS398_ResearchTrainingProgramPlan_5_0-V5.0.xsd"
ATTACHMENTS = {
    "11111111-1111-4111-8111-111111111111": "primary.pdf",
    "22222222-2222-4222-8222-222222222222": "appendix-a.pdf",
    "33333333-3333-4333-8333-333333333333": "appendix-b.pdf",
}


def test_attachment_sections_and_order():
    primary_id, *appendix_ids = ATTACHMENTS
    result = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data={
                "program_plan": primary_id,
                "appendix": appendix_ids,
            },
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping={
                key: AttachmentInfo(
                    filename=filename,
                    mime_type="application/pdf",
                    file_location=filename,
                    hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
                )
                for key, filename in ATTACHMENTS.items()
            },
        )
    )
    assert result.success, result.error_message
    outcome = XSDValidator(XSD_DIR).validate_xml(result.xml_data, XSD)
    assert outcome["valid"], outcome["error_message"]
    filename = "phs_398_research_training_program_plan_5_0.xml"
    assert result.xml_data == (Path(__file__).parent / "snapshots" / filename).read_text()
    root = etree.fromstring(result.xml_data.encode())
    assert root.findtext(".//{*}ProgramPlan//{*}FileName") == "primary.pdf"
    assert [node.text for node in root.findall(".//{*}Appendix//{*}FileName")] == [
        "appendix-a.pdf",
        "appendix-b.pdf",
    ]
