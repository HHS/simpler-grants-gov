"""Tests for NASA - PI and AOR Supplemental Data Sheet XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). There's no hand-written form to compare it with, so the XML is checked
against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/Nasa_PIandAORSupplementalDataSheet-V1.0.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import nasa_pi_and_aor_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/Nasa_PIandAORSupplementalDataSheet-V1.0"
_XSD = "Nasa_PIandAORSupplementalDataSheet-V1.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "nasa_pi_and_aor_1_0.xml"

# Every question answered.
_DATA = {
    "authorized_representative": {
        "name": {
            "prefix": "Ms.",
            "first_name": "Alicia",
            "middle_name": "M",
            "last_name": "Reyes",
            "suffix": "Jr.",
        },
        "nspires_username": "areyes",
    },
    "principal_investigator": {
        "name": {"prefix": "Dr.", "first_name": "Maria", "last_name": "Chen"},
        "us_government_participation": True,
        "federal_agency": "141: National Oceanic and Atmospheric Administration (NOAA)",
        "federal_agency_dollar": "125000.00",
        "international_participation": False,
    },
}

# Only the answers the form requires.
_REQUIRED_ONLY = {
    "authorized_representative": {"name": {"first_name": "Alicia", "last_name": "Reyes"}},
    "principal_investigator": {
        "name": {"first_name": "Maria", "last_name": "Chen"},
        "us_government_participation": False,
        "international_participation": True,
    },
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=nasa_pi_and_aor_generated.FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _text(xml: str, path: str) -> str | None:
    root = lxml_etree.fromstring(xml.encode())
    element = root.find("/".join(f"{{{_FORM_NS}}}{part}" for part in path.split("/")))
    return None if element is None else element.text


class TestNasaPIAndAORXMLGeneration:
    def test_writes_participation_as_yes_or_no(self):
        xml = _generate(_DATA)
        assert _text(xml, "PrincipalInvestigatorName/USGovernmentParticipation") == "Y: Yes"
        assert _text(xml, "PrincipalInvestigatorName/InternationalParticipation") == "N: No"

    def test_writes_dollar_amount_with_cents(self):
        xml = _generate(_DATA)
        assert _text(xml, "PrincipalInvestigatorName/FederalAgencyDollar") == "125000.00"

    def test_leaves_out_unanswered_agency(self):
        xml = _generate(_REQUIRED_ONLY)
        assert _text(xml, "PrincipalInvestigatorName/FederalAgency") is None


class TestNasaPIAndAORXSDValidation:
    @pytest.fixture
    def xsd_validator(self):
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not (xsd_dir / _XSD).exists():
            pytest.skip(f"{_XSD} not found. Run 'flask task fetch-xsds'.")
        return XSDValidator(xsd_dir)

    def test_full_form_is_valid(self, xsd_validator):
        result = xsd_validator.validate_xml(_generate(_DATA), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]

    def test_form_without_optional_answers_is_valid(self, xsd_validator):
        result = xsd_validator.validate_xml(_generate(_REQUIRED_ONLY), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]


class TestNasaPIAndAORSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
