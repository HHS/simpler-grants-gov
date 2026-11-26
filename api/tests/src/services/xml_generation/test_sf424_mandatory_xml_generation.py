"""Tests for SF424 Mandatory Form XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). There's no hand-written form to compare it with, so the XML is checked
against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424_Mandatory_3_0-V3.0.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import sf424_mandatory_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/SF424_Mandatory_3_0-V3.0"
_ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
_XSD = "SF424_Mandatory_3_0-V3.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_mandatory_3_0.xml"

# Every question answered, with every attachment the form takes.
_DATA = {
    "opportunity": {
        "agency_name": "Department of Education",
        "assistance_listing": {"number": "84.027", "title": "Synthetic Education Program"},
    },
    "application": {
        "submission_type": "Other",
        "submission_type_other": "Formula grant request",
        "frequency": {"code": "Other", "other": "Semiannual"},
        "consolidated_request": {
            "answer": True,
            "explanation": "Consolidated submission for two community programs.",
        },
        "version": "Initial",
        "date_received": "2026-11-03",
        "applicant_id": "APPLICANT-01",
        "federal_entity_identifier": "ENTITY-01",
        "federal_award_identifier": "AWARD-01",
        "state": {"received_date": "2026-10-29", "application_id": "STATE-01"},
        "state_review": {"status": "StateReviewAvailable", "date": "2026-10-28"},
    },
    "applicant": {
        "organization": {
            "name": "Example Community Organization",
            "uei": "AAAAAAAAAAAA",
            "ein": "12-3456789",
            "address": {
                "street1": "100 Grant Avenue",
                "street2": "Suite 400",
                "city": "Baltimore",
                "county": "Baltimore City",
                "state": "MD: Maryland",
                "country": "USA: UNITED STATES",
                "zip_code": "21218-1234",
            },
            "department": "Community Programs",
            "division": "Education",
        },
        "type": {
            "code": "X: Other (specify)",
            "other_specify": "Community partnership",
            "additional_description": "Educational community organization",
        },
        "congressional_district": "MD-007",
        "delinquent_federal_debt": {"answer": True, "explanation": "Payment plan in place."},
    },
    "project": {
        "title": "Community Learning Program",
        "areas_affected": "Baltimore City",
        "congressional_district": "MD-007",
        "additional_congressional_districts": "districts",
    },
    "contacts": {
        "authorized_representative": {
            "name": {
                "prefix": "Ms.",
                "first_name": "Priya",
                "middle_name": "K",
                "last_name": "Patel",
                "suffix": "Jr.",
            },
            "title": "Executive Director",
            "organization": {"name": "Example Community Organization"},
            "phone": "4105550101",
            "fax": "4105550198",
            "email": "priya.patel@example.org",
        },
        "point_of_contact": {
            "name": {"prefix": "Dr.", "first_name": "Alicia", "last_name": "Reyes"},
            "title": "Program Director",
            "organization": {"name": "Example Community Organization"},
            "phone": "4105550100",
            "fax": "4105550199",
            "email": "alicia.reyes@example.org",
        },
    },
    "budget": {
        "funding_sources": {"federal": "12345.67", "match": "0"},
        "funding_period": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "certification": {
        "agree": True,
        "signature": "Priya Patel",
        "date_signed": "2026-11-03",
    },
    "attachments": {"additional": ["support-1", "support-2"]},
}

# Only the answers the form requires, plus the dates and signature SGG fills in on submit.
_REQUIRED_ONLY = {
    "opportunity": {"agency_name": "Department of Education"},
    "application": {
        "submission_type": "Application",
        "frequency": {"code": "Annual"},
        "version": "Initial",
        "date_received": "2026-11-03",
        "state_review": {"status": "StateReviewNotNeeded"},
    },
    "applicant": {
        "organization": {
            "name": "Example Community Organization",
            "uei": "AAAAAAAAAAAA",
            "ein": "12-3456789",
            "address": {
                "street1": "100 Grant Avenue",
                "city": "Baltimore",
                "state": "MD: Maryland",
                "country": "USA: UNITED STATES",
                "zip_code": "21218-1234",
            },
        },
        "type": {"code": "A: State Government"},
        "congressional_district": "MD-007",
        "delinquent_federal_debt": {"answer": False},
    },
    "project": {"title": "Community Learning Program"},
    "contacts": {
        "authorized_representative": {
            "name": {"first_name": "Priya", "last_name": "Patel"},
            "title": "Executive Director",
            "phone": "4105550101",
            "email": "priya.patel@example.org",
        },
        "point_of_contact": {
            "name": {"first_name": "Alicia", "last_name": "Reyes"},
            "phone": "4105550100",
            "email": "alicia.reyes@example.org",
        },
    },
    "budget": {
        "funding_sources": {"federal": "0"},
        "funding_period": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "certification": {"agree": True, "signature": "Priya Patel", "date_signed": "2026-11-03"},
}


def _attachment(upload_id: str) -> AttachmentInfo:
    return AttachmentInfo(
        filename=f"{upload_id}.pdf",
        mime_type="application/pdf",
        file_location=f"{upload_id}.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )


_ATTACHMENTS = {
    upload_id: _attachment(upload_id) for upload_id in ["districts", "support-1", "support-2"]
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=sf424_mandatory_generated.FORM_XML_TRANSFORM_RULES,
            attachment_mapping=_ATTACHMENTS,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _text(xml: str, path: str) -> str | None:
    root = lxml_etree.fromstring(xml.encode())
    element = root.find("/".join(f"{{{_FORM_NS}}}{part}" for part in path.split("/")))
    return None if element is None else element.text


class TestSF424MandatoryXMLGeneration:
    @pytest.mark.parametrize(
        "element,expected",
        [
            ("ConsolidatedRequest", "Y: Yes"),
            ("DelinquentOnFederalDebt", "Y: Yes"),
            ("ApplicationCertification", "Y: Yes"),
        ],
    )
    def test_writes_yes_no_answers_as_codes(self, element, expected):
        assert _text(_generate(_DATA), element) == expected

    def test_writes_funding_amounts_with_cents(self):
        xml = _generate(_DATA)
        assert _text(xml, "EstimatedFundingFederal") == "12345.67"
        assert _text(xml, "EstimatedFundingMatch") == "0.00"

    def test_writes_additional_districts_file_inside_its_element(self):
        root = lxml_etree.fromstring(_generate(_DATA).encode())
        name = root.find(f"{{{_FORM_NS}}}AdditionalCongressionalDistricts/{{{_ATT_NS}}}FileName")
        assert name is not None and name.text == "districts.pdf"

    def test_writes_each_supporting_document(self):
        root = lxml_etree.fromstring(_generate(_DATA).encode())
        names = root.findall(
            f"{{{_FORM_NS}}}attachments/{{{_ATT_NS}}}AttachedFile/{{{_ATT_NS}}}FileName"
        )
        assert [name.text for name in names] == ["support-1.pdf", "support-2.pdf"]

    def test_leaves_out_unanswered_follow_ups(self):
        xml = _generate(_REQUIRED_ONLY)
        assert _text(xml, "TypeOfSubmissionOtherDescription") is None
        assert _text(xml, "DelinquentFederalDebtExplanation") is None


class TestSF424MandatoryXSDValidation:
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


class TestSF424MandatorySnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
