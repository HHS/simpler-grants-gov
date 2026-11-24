"""Tests for Application for Federal Domestic Assistance - Individual XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). There's no hand-written form to compare it with, so the XML is checked
against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424_Individual_2_0-V2.0.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import sf424_individual_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/SF424_Individual_2_0-V2.0"
_GLOB_LIB_NS = "http://apply.grants.gov/system/GlobalLibrary-V2.0"
_XSD = "SF424_Individual_2_0-V2.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_individual_2_0.xml"

# Every question answered, by an applicant who isn't a U.S. citizen.
_DATA = {
    "opportunity": {
        "agency_name": "National Endowment for the Humanities",
        "number": "NEH-FEL-2027",
        "title": "Fellowships",
        "assistance_listing": {"number": "45.160", "title": "Fellowships and Stipends"},
    },
    "application": {"date_received": "2026-11-02"},
    "applicant": {
        "person": {
            "citizenship": {
                "is_us_citizen": False,
                "country": "URY: URUGUAY",
                "alien_registration_number": "A123456789",
                "residency_start_date": "2025-01-15",
            }
        },
        "congressional_district": "MD-007",
    },
    "project": {
        "title": "Community Archives Research",
        "description": "Study and document community archives.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {
                "prefix": "Dr.",
                "first_name": "Alicia",
                "middle_name": "Marie",
                "last_name": "Reyes",
                "suffix": "PhD",
            },
            "address": {
                "street1": "100 Grant Avenue",
                "street2": "Unit 400",
                "city": "Baltimore",
                "county": "Baltimore City",
                "state": "MD: Maryland",
                "zip_code": "21218-1234",
                "country": "USA: UNITED STATES",
            },
            "phone": "4105550100",
            "evening_phone": "4105550101",
            "fax": "4105550199",
            "email": "alicia.reyes@example.org",
        }
    },
    "certification": {
        "agree": True,
        "signature": "Alicia Reyes",
        "date_signed": "2026-11-02",
    },
}

# Only the answers the form requires, plus the values Grants.gov fills in on submission.
_REQUIRED_ONLY = {
    "opportunity": {
        "agency_name": "National Endowment for the Humanities",
        "number": "NEH-FEL-2027",
        "title": "Fellowships",
    },
    "application": {"date_received": "2026-11-02"},
    "applicant": {
        "person": {"citizenship": {"is_us_citizen": True}},
        "congressional_district": "00-000",
    },
    "project": {
        "title": "Community Archives Research",
        "description": "Study and document community archives.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {"first_name": "Tom", "last_name": "Okafor"},
            "address": {"street1": "456 Rio", "city": "Montevideo", "country": "URY: URUGUAY"},
            "phone": "1234567890",
            "email": "tom.okafor@example.org",
        }
    },
    "certification": {"agree": True, "signature": "Tom Okafor", "date_signed": "2026-11-02"},
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=sf424_individual_generated.FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _text(xml: str, path: str) -> str | None:
    root = lxml_etree.fromstring(xml.encode())
    parts = [
        (
            f"{{{_GLOB_LIB_NS}}}{part[len('globLib:') :]}"
            if part.startswith("globLib:")
            else f"{{{_FORM_NS}}}{part}"
        )
        for part in path.split("/")
    ]
    element = root.find("/".join(parts))
    return None if element is None else element.text


class TestSF424IndividualXMLGeneration:
    @pytest.mark.parametrize(
        ("data", "expected"),
        [(_DATA, "N: No"), (_REQUIRED_ONLY, "Y: Yes")],
        ids=["non_citizen", "us_citizen"],
    )
    def test_writes_citizenship_as_yes_or_no(self, data, expected):
        assert _text(_generate(data), "citizenship") == expected

    def test_writes_certification_as_yes(self):
        assert _text(_generate(_DATA), "ApplicationCertification") == "Y: Yes"

    def test_writes_point_of_contact_as_authorized_representative(self):
        xml = _generate(_DATA)
        assert _text(xml, "AuthorizedRepresentativeName/globLib:FirstName") == "Alicia"
        assert _text(xml, "AuthorizedRepresentativeEmail") == "alicia.reyes@example.org"

    @pytest.mark.parametrize(
        "element", ["AlienRegistrationNumber", "CountryofOrigin", "VisitDate", "EveningPhone"]
    )
    def test_leaves_out_unanswered_optional_element(self, element):
        assert _text(_generate(_REQUIRED_ONLY), element) is None


class TestSF424IndividualXSDValidation:
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


class TestSF424IndividualSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
