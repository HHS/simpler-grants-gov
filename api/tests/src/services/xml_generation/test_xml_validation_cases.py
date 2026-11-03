"""XSD validation coverage for generated application XML."""

from pathlib import Path

import pytest

from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_map
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"


VALID_APPLICATION = {
    "submission_type": "Application",
    "application_type": "New",
    "date_received": "2024-01-01",
    "organization_name": "Test Organization",
    "employer_taxpayer_identification_number": "123456789",
    "sam_uei": "TEST12345678",
    "applicant": {
        "street1": "123 Main St",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20001",
        "country": "USA: UNITED STATES",
    },
    "phone_number": "555-123-4567",
    "email": "test@example.org",
    "applicant_type_code": ["A: State Government"],
    "agency_name": "Test Agency",
    "funding_opportunity_number": "TEST-FON-2024-001",
    "funding_opportunity_title": "Test Funding Opportunity",
    "project_title": "Test Project Title",
    "congressional_district_applicant": "DC-00",
    "congressional_district_program_project": "DC-00",
    "project_start_date": "2024-04-01",
    "project_end_date": "2025-03-31",
    "federal_estimated_funding": "100000.00",
    "applicant_estimated_funding": "0.00",
    "state_estimated_funding": "0.00",
    "local_estimated_funding": "0.00",
    "other_estimated_funding": "0.00",
    "program_income_estimated_funding": "0.00",
    "total_estimated_funding": "100000.00",
    "state_review": "c. Program is not covered by E.O. 12372.",
    "delinquent_federal_debt": False,
    "certification_agree": True,
    "authorized_representative": {"first_name": "John", "last_name": "Doe"},
    "authorized_representative_title": "CEO",
    "authorized_representative_phone_number": "555-123-4567",
    "authorized_representative_email": "john@testorg.com",
    "aor_signature": "John Doe Signature",
    "date_signed": "2025-01-15",
}


@pytest.fixture(scope="module")
def xsd_validator() -> XSDValidator:
    """Validator wired to the committed XSD directory."""
    init_form_registry()
    return XSDValidator(XSD_DIR)


def test_generated_xml_validates_against_xsd(xsd_validator: XSDValidator) -> None:
    """Generated XML validates against its committed Grants.gov XSD schema."""
    transform_config = _build_xml_form_map()["SF424_4_0"]
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            transform_config=transform_config,
            application_data=VALID_APPLICATION,
            pretty_print=True,
        )
    )

    assert response.success, response.error_message
    assert response.xml_data is not None
    result = xsd_validator.validate_xml_for_form(response.xml_data, "SF424_4_0-V4.0")

    assert result["valid"], result["error_message"]
