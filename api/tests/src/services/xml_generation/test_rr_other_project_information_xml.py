from pathlib import Path
from lxml import etree
from src.form_schema.forms.research_and_related_other_project_information_generated import (
    FORM_XML_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator


def test_exempt_project_preserves_each_code_and_omits_previous_approval_date():
    answers = {
        "human_subjects_involved": True,
        "exempt_from_federal_regulations": True,
        "exemption_numbers": ["E1", "E4"],
        "irb_review_pending": False,
        "irb_approval_date": "2026-01-12",
        "vertebrate_animals_used": False,
        "proprietary_information_included": False,
        "environmental_impact": False,
        "historic_site_designated_or_eligible": False,
        "international_activities_involved": False,
    }
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(application_data=answers, transform_config=FORM_XML_TRANSFORM_RULES)
    )
    assert response.success, response.error_message
    root = etree.fromstring(response.xml_data.encode())
    assert [n.text for n in root.findall(".//{*}ExemptionNumber")] == ["E1", "E4"]
    assert root.find(".//{*}HumanSubjectIRBReviewDate") is None
    validator = XSDValidator(Path(__file__).parents[4] / "src/services/xml_generation/xsds")
    result = validator.validate_xml(
        response.xml_data, validator.xsd_dir / "RR_OtherProjectInfo_1_4-V1.4.xsd"
    )
    assert result["valid"], result["error_message"]
