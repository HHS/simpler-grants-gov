from pathlib import Path

import pytest
from lxml import etree

from src.form_schema.forms.sbir_sttr_information_generated import (
    FORM_JSON_SCHEMA,
    FORM_XML_TRANSFORM_RULES,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

UPLOAD = "00000000-0000-4000-8000-000000000787"


@pytest.mark.parametrize(
    ("program", "agency", "files_expected"),
    [("SBIR", "Other", True), ("STTR", "HHS", False), ("Both", "HHS", True)],
)
def test_xml_excludes_inactive_answers(program, agency, files_expected):
    answers = {
        **FORM_JSON_SCHEMA["examples"][0],
        "research_partner_uei": "EXAMPLE12345",
        "appointment_and_minimum_effort_certified": True,
        "small_business_and_institution_work_shares_certified": True,
        "program_type": program,
        "agency": agency,
        "other_agency": "Example agency",
        "phase_ii_awards_received": True,
        "commercialization_history": UPLOAD,
        "outside_united_states_explanation": UPLOAD,
        "laboratory_or_agency_names": "Former laboratory",
        "equivalent_work_agencies": "Former agency",
    }
    upload = AttachmentInfo(
        "history.pdf", "application/pdf", "history.pdf", "aeB1+6gdFwih51ijIRn3b8QYn24="
    )
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=answers,
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping={UPLOAD: upload},
        )
    )
    assert response.success, response.error_message
    root = etree.fromstring(response.xml_data.encode())
    assert root.findtext("{*}SBCControlID") == "001234567"
    assert root.findtext("{*}OtherAgency") == ("Example agency" if agency == "Other" else None)
    assert root.findtext("{*}SAMUEI") == ("EXAMPLE12345" if program != "SBIR" else None)
    assert [e.text for e in root.findall(".//{*}FileName")] == (
        ["history.pdf"] if files_expected else []
    )
    for tag in [
        "NonDomesticPerformanceExplanation",
        "SubcontractorNames",
        "EquivalentProposalRecipients",
    ]:
        assert root.find("{*}" + tag) is None
    validator = XSDValidator(Path(__file__).parents[4] / "src/services/xml_generation/xsds")
    result = validator.validate_xml(
        response.xml_data, validator.xsd_dir / "SBIR_STTR_Information_3_0-V3.0.xsd"
    )
    assert result["valid"], result["error_message"]


@pytest.mark.parametrize(
    ("value", "valid"), [("1", True), ("999", True), ("0", False), ("1000", False), ("2.5", False)]
)
def test_employee_count_against_grants_gov_xsd(value, valid):
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=FORM_JSON_SCHEMA["examples"][0],
            transform_config=FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success
    root = etree.fromstring(response.xml_data.encode())
    root.find("{*}NumberOfEmployees").text = value
    validator = XSDValidator(Path(__file__).parents[4] / "src/services/xml_generation/xsds")
    result = validator.validate_xml(
        etree.tostring(root, encoding="unicode"),
        validator.xsd_dir / "SBIR_STTR_Information_3_0-V3.0.xsd",
    )
    assert result["valid"] is valid
