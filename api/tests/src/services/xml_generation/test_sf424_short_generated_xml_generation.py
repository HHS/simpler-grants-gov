"""Tests for the generated SF-424 Short Organizational's XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json), so the XML is checked against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd
"""

import json
from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import sf424_short_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/SF424_Short_3_0-V3.0"
_XSD = "SF424_Short_3_0-V3.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_short_generated_3_0.xml"

_ADDRESS = {
    "street1": "128 Oak Avenue",
    "street2": "Suite 200",
    "city": "Springfield",
    "county": "Sangamon",
    "state": "IL: Illinois",
    "country": "USA: UNITED STATES",
    "zip_code": "62701-1234",
}

# Every question answered.
_DATA = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "assistance_listing": {"number": "99.999", "title": "Community Research Demonstration"},
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "application": {"date_received": "2027-01-02"},
    "applicant": {
        "organization": {
            "name": "Prairie Community Research Center",
            "uei": "PCRA12345678",
            "ein": "12-3456789",
            "address": _ADDRESS,
            "web_address": "https://prairie.example.org",
        },
        "type": {
            "codes": [
                "H: Public/State Controlled Institution of Higher Education",
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
                "X: Other (specify)",
            ],
            "other_specify": "Community research partnership",
        },
        "congressional_district": "IL-013",
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "description": "Survey residents and map shaded gathering spaces.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            "name": {
                "prefix": "Ms.",
                "first_name": "Morgan",
                "middle_name": "A",
                "last_name": "Chen",
                "suffix": "Jr.",
            },
            "title": "Executive Director",
            "phone": "217-555-0103",
            "fax": "217-555-0198",
            "email": "morgan.chen@example.org",
        },
        "project_director": {
            "name": {"prefix": "Dr.", "first_name": "Avery", "last_name": "Patel"},
            "title": "Research Director",
            "address": _ADDRESS,
            "phone": "217-555-0101",
            "fax": "217-555-0199",
            "email": "avery.patel@example.org",
        },
        "point_of_contact": {
            "same_as_project_director": True,
            "name": {"prefix": "Dr.", "first_name": "Avery", "last_name": "Patel"},
            "title": "Research Director",
            "address": _ADDRESS,
            "phone": "217-555-0101",
            "fax": "217-555-0199",
            "email": "avery.patel@example.org",
        },
    },
    "certification": {"agree": True, "signature": "Morgan Chen", "date_signed": "2027-01-02"},
}

_FOREIGN_ADDRESS = {"street1": "240 Maple Street", "city": "Ottawa", "country": "CAN: CANADA"}

# Only the answers the form requires, plus what Grants.gov fills on submission, which the
# XSD requires.
_REQUIRED_ONLY = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "application": {"date_received": "2027-01-02"},
    "applicant": {
        "organization": {
            "name": "Maple Community Research Centre",
            "uei": "MCRC12345678",
            "ein": "44-4444444",
            "address": _FOREIGN_ADDRESS,
        },
        "type": {"codes": ["W: Non-domestic (non-US) Entity"]},
        "congressional_district": "00-000",
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "description": "Survey residents and map shaded gathering spaces.",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            "name": {"first_name": "Morgan", "last_name": "Chen"},
            "title": "Executive Director",
            "phone": "613-555-0103",
            "email": "morgan.chen@example.org",
        },
        "project_director": {
            "name": {"first_name": "Avery", "last_name": "Patel"},
            "title": "Research Director",
            "address": _FOREIGN_ADDRESS,
            "phone": "613-555-0101",
            "email": "avery.patel@example.org",
        },
        "point_of_contact": {
            "name": {"first_name": "Jordan", "last_name": "Reyes"},
            "title": "Grants Administrator",
            "address": _FOREIGN_ADDRESS,
            "phone": "613-555-0102",
            "email": "jordan.reyes@example.org",
        },
    },
    "certification": {"agree": True, "signature": "Morgan Chen", "date_signed": "2027-01-02"},
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            # Round-trip through JSON so each address is its own copy.
            application_data=json.loads(json.dumps(data)),
            transform_config=sf424_short_generated.FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _text(xml: str, path: str) -> str | None:
    root = lxml_etree.fromstring(xml.encode())
    element = root.find("/".join(f"{{{_FORM_NS}}}{part}" for part in path.split("/")))
    return None if element is None else element.text


class TestSF424ShortGeneratedXMLGeneration:
    @pytest.mark.parametrize(
        "element,expected",
        [
            ("ApplicantTypeCode1", "H: Public/State Controlled Institution of Higher Education"),
            (
                "ApplicantTypeCode2",
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
            ),
            ("ApplicantTypeCode3", "X: Other (specify)"),
        ],
    )
    def test_writes_each_applicant_type_to_its_numbered_element(self, element, expected):
        assert _text(_generate(_DATA), element) == expected

    @pytest.mark.parametrize("element", ["ApplicantTypeCode2", "ApplicantTypeCode3"])
    def test_leaves_out_unanswered_applicant_types(self, element):
        assert _text(_generate(_REQUIRED_ONLY), element) is None

    @pytest.mark.parametrize(
        "element,expected",
        [("SameAsProjectDirector", "Y: Yes"), ("ApplicationCertification", "Y: Yes")],
    )
    def test_writes_booleans_as_yes_or_no(self, element, expected):
        assert _text(_generate(_DATA), element) == expected

    def test_leaves_out_unanswered_same_as_project_director(self):
        assert _text(_generate(_REQUIRED_ONLY), "SameAsProjectDirector") is None


class TestSF424ShortGeneratedXSDValidation:
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


class TestSF424ShortGeneratedSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
