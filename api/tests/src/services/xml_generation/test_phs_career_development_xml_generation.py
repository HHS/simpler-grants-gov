from pathlib import Path

import pytest
from lxml import etree

from src.form_schema.forms.phs_398_career_development_award_supplemental_form_generated import (
    FORM_XML_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD = XSD_DIR / "PHS398_CareerDevelopmentAwardSup_6_0-V6.0.xsd"
ATTACHMENTS = {
    "11111111-1111-4111-8111-111111111111": "primary.pdf",
    "22222222-2222-4222-8222-222222222222": "appendix-a.pdf",
    "33333333-3333-4333-8333-333333333333": "appendix-b.pdf",
}


@pytest.mark.parametrize("citizen", [True, False])
def test_citizenship_and_attachment_sections(citizen):
    primary_id, *appendix_ids = ATTACHMENTS
    result = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data={
                "research_strategy": primary_id,
                "appendix": appendix_ids,
                "is_us_citizen_or_national": citizen,
                "non_us_citizenship_status": "Temporary U.S. Visa",
                "permanent_resident_by_award": True,
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
    root = etree.fromstring(result.xml_data.encode())
    assert root.findtext(".//{*}ResearchStrategy//{*}FileName") == "primary.pdf"
    assert [node.text for node in root.findall(".//{*}Appendix//{*}FileName")] == [
        "appendix-a.pdf",
        "appendix-b.pdf",
    ]
    assert root.findtext(".//{*}CitizenshipIndicator") == ("Y: Yes" if citizen else "N: No")
    assert root.findtext(".//{*}isNonUSCitizenship") == (None if citizen else "Temporary U.S. Visa")
    assert root.findtext(".//{*}PermanentResidentByAwardIndicator") == (
        None if citizen else "Y: Yes"
    )
