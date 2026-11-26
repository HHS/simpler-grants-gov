"""Tests for the generated SF-424's XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). The hand-written form's XML tests are in test_sf424_xml_generation.py;
these check the generated form's XML against the XSD and pin it in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import sf424_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/SF424_4_0-V4.0"
_ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
_XSD = "SF424_4_0-V4.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_generated_4_0.xml"

_UPLOADS = ("debt-explanation", "areas-affected", "title-1", "title-2", "districts")

# Only the answers the form requires, plus the values SGG fills in.
_REQUIRED_ONLY = {
    "opportunity": {
        "agency_name": "Department of Community Programs",
        "number": "DEMO-2027-001",
        "title": "Community Research Demonstration",
    },
    "application": {
        "submission_type": "Application",
        "application_type": "New",
        "date_received": "2026-11-05",
        "state_review": {"status": "c. Program is not covered by E.O. 12372."},
    },
    "applicant": {
        "organization": {
            "name": "Prairie Community Research Center",
            "ein": "12-3456789",
            "uei": "PCRA12345678",
            "address": {
                "street1": "128 Oak Avenue",
                "city": "Springfield",
                "state": "IL: Illinois",
                "country": "USA: UNITED STATES",
                "zip_code": "62701-1234",
            },
        },
        "type": {
            "codes": [
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)"
            ]
        },
        "congressional_district": "IL-013",
        "delinquent_federal_debt": {"answer": False},
    },
    "project": {
        "title": "Neighborhood Heat Resilience Study",
        "congressional_district": "IL-013",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "point_of_contact": {
            "name": {"first_name": "Jordan", "last_name": "Reyes"},
            "phone": "2175550102",
            "email": "jordan.reyes@example.org",
        },
        "authorized_representative": {
            "name": {"first_name": "Morgan", "last_name": "Chen"},
            "title": "Executive Director",
            "phone": "2175550103",
            "email": "morgan.chen@example.org",
        },
    },
    "budget": {
        "funding_sources": {
            "federal": "25000.00",
            "applicant": "5000.00",
            "state": "0.00",
            "local": "0.00",
            "other": "0.00",
            "program_income": "0.00",
            "total": "30000.00",
        }
    },
    "certification": {"agree": True, "signature": "Morgan Chen", "date_signed": "2026-11-05"},
}

# Every question answered, with every attachment the form takes.
_DATA = {
    "opportunity": {
        **_REQUIRED_ONLY["opportunity"],
        "assistance_listing": {"number": "99.999", "title": "Community Research Demonstration"},
        "competition": {"number": "COMP-01", "title": "Main Competition"},
    },
    "application": {
        "submission_type": "Application",
        "application_type": "Revision",
        "revision": {"type": "E: Other (specify)", "other_specify": "Scope change"},
        "date_received": "2026-11-05",
        "applicant_id": "APP-1",
        "federal_entity_identifier": "FED-1",
        "federal_award_identifier": "AWARD-1",
        "state": {"received_date": "2026-11-06", "application_id": "STATE-1"},
        "state_review": {
            "status": (
                "a. This application was made available to the State under the Executive "
                "Order 12372 Process for review on"
            ),
            "date": "2026-10-01",
        },
    },
    "applicant": {
        "organization": {
            **_REQUIRED_ONLY["applicant"]["organization"],
            "address": {
                "street1": "128 Oak Avenue",
                "street2": "Suite 4",
                "city": "Springfield",
                "county": "Sangamon",
                "state": "IL: Illinois",
                "country": "USA: UNITED STATES",
                "zip_code": "62701-1234",
            },
            "department": "Research",
            "division": "Climate",
        },
        "type": {
            "codes": [
                "H: Public/State Controlled Institution of Higher Education",
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)",
                "X: Other (specify)",
            ],
            "other_specify": "Consortium",
        },
        "congressional_district": "IL-013",
        "delinquent_federal_debt": {"answer": True, "explanation": "debt-explanation"},
    },
    "project": {
        **_REQUIRED_ONLY["project"],
        "additional_titles": ["title-1", "title-2"],
        "areas_affected": "areas-affected",
        "additional_congressional_districts": "districts",
    },
    "contacts": {
        "point_of_contact": {
            "name": {
                "prefix": "Mx.",
                "first_name": "Jordan",
                "middle_name": "A",
                "last_name": "Reyes",
                "suffix": "Jr.",
            },
            "title": "Grants Administrator",
            "organization": {"name": "Prairie Partners"},
            "phone": "2175550102",
            "fax": "2175550109",
            "email": "jordan.reyes@example.org",
        },
        "authorized_representative": {
            **_REQUIRED_ONLY["contacts"]["authorized_representative"],
            "fax": "2175550110",
        },
    },
    "budget": _REQUIRED_ONLY["budget"],
    "certification": _REQUIRED_ONLY["certification"],
}


def _attachment(upload_id: str) -> AttachmentInfo:
    return AttachmentInfo(
        filename=f"{upload_id}.pdf",
        mime_type="application/pdf",
        file_location=f"{upload_id}.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )


_ATTACHMENTS = {upload_id: _attachment(upload_id) for upload_id in _UPLOADS}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=sf424_generated.FORM_XML_TRANSFORM_RULES,
            attachment_mapping=_ATTACHMENTS,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _texts(xml: str, path: str) -> list[str | None]:
    root = lxml_etree.fromstring(xml.encode())
    steps = [
        f"{{{_ATT_NS}}}{part[4:]}" if part.startswith("att:") else f"{{{_FORM_NS}}}{part}"
        for part in path.split("/")
    ]
    return [element.text for element in root.findall("/".join(steps))]


class TestSF424GeneratedXMLGeneration:
    def test_writes_each_applicant_type_to_its_numbered_element(self):
        xml = _generate(_DATA)
        assert _texts(xml, "ApplicantTypeCode1") == [
            "H: Public/State Controlled Institution of Higher Education"
        ]
        assert _texts(xml, "ApplicantTypeCode3") == ["X: Other (specify)"]

    def test_writes_booleans_as_yes_or_no(self):
        xml = _generate(_DATA)
        assert _texts(xml, "DelinquentFederalDebt") == ["Y: Yes"]
        assert _texts(xml, "CertificationAgree") == ["Y: Yes"]

    def test_writes_each_additional_project_title_attachment(self):
        xml = _generate(_DATA)
        assert _texts(xml, "AdditionalProjectTitle/att:AttachedFile/att:FileName") == [
            "title-1.pdf",
            "title-2.pdf",
        ]

    @pytest.mark.parametrize(
        "element", ["DebtExplanation", "AreasAffected", "AdditionalCongressionalDistricts"]
    )
    def test_writes_single_attachment_below_root(self, element):
        assert _texts(_generate(_DATA), f"{element}/att:FileName") != []

    def test_leaves_out_unanswered_revision(self):
        xml = _generate(_REQUIRED_ONLY)
        assert _texts(xml, "RevisionType") == []


class TestSF424GeneratedXSDValidation:
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


class TestSF424GeneratedSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
