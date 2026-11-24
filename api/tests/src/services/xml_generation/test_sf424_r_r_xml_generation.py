"""Tests for Application for Federal Assistance (SF 424 R&R) XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). There's no hand-written form to compare it with, so the XML is checked
against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/RR_SF424_5_0-V5.0.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import sf424_r_r_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/RR_SF424_5_0-V5.0"
_ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
_XSD = "RR_SF424_5_0-V5.0.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "sf424_r_r_5_0.xml"


def _address(street: str) -> dict:
    return {
        "street1": street,
        "city": "Boston",
        "state": "MA: Massachusetts",
        "zip_code": "02108-1234",
        "country": "USA: UNITED STATES",
    }


def _contact(first: str, last: str, email: str) -> dict:
    return {
        "name": {"first_name": first, "last_name": last},
        "organization": {"name": "Willow Research Institute"},
        "address": _address("24 Orchard Street"),
        "phone": "6175550101",
        "email": email,
    }


# Only the answers the form requires, plus the values Grants.gov fills in before and after
# the applicant answers, which the XSD requires.
_REQUIRED_ONLY = {
    "opportunity": {"agency_name": "Example Research Agency", "assistance_listing": {}},
    "application": {
        "submission_type": "Application",
        "application_type": "New",
        "other_agencies": {"submitted": False},
        "state_review": {"status": "Program is not covered by E.O. 12372"},
    },
    "applicant": {
        "organization": {
            "name": "Willow Research Institute",
            "uei": "A1B2C3D4E5F6",
            "ein": "12-3456789",
            "address": _address("10 Orchard Street"),
        },
        "type": {
            "code": (
                "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)"
            )
        },
        "congressional_district": "MA-007",
    },
    "project": {
        "title": "Measuring the Effects of Urban Tree Canopy",
        "timeline": {"start_date": "2027-01-01", "end_date": "2027-12-31"},
    },
    "contacts": {
        "authorized_representative": {
            **_contact("Jordan", "Santos", "jordan.santos@example.org"),
            "title": "Director of Sponsored Programs",
        },
        "project_director": _contact("Avery", "Tran", "avery.tran@example.org"),
        "point_of_contact": {
            "name": {"first_name": "Quinn", "last_name": "Bennett"},
            "address": _address("15 Orchard Street"),
            "phone": "6175550100",
        },
    },
    "budget": {
        "funding_sources": {
            "federal": "100000.29",
            "non_federal": "1.15",
            "total": "100001.44",
            "program_income": "0.00",
        }
    },
    "certification": {
        "agree": True,
        "signature": "Jordan Santos",
        "date_signed": "2026-11-05",
    },
    "attachments": {},
}

# Every question answered, and every attachment the form takes.
_DATA = {
    **_REQUIRED_ONLY,
    "opportunity": {
        "agency_name": "Example Research Agency",
        "assistance_listing": {"number": "93.123", "title": "Community Research"},
    },
    "application": {
        "submission_type": "Change/Corrected Application",
        "date_submitted": "2026-11-05",
        "applicant_id": "APP-123",
        "state": {"received_date": "2026-11-03", "application_id": "MA-2026-01"},
        "federal_identifier": "R01EX123456",
        "agency_routing_number": "ROUTE-1",
        "previous_tracking_id": "GRANT12345678",
        "application_type": "Revision",
        "revision": {"type": "E", "other_specify": "Change of scope"},
        "other_agencies": {"submitted": True, "explanation": "Example Foundation"},
        "state_review": {"status": "Y: Yes", "date": "2026-11-02"},
    },
    "applicant": {
        **_REQUIRED_ONLY["applicant"],
        "organization": {
            **_REQUIRED_ONLY["applicant"]["organization"],
            "department": "Sponsored Research",
            "division": "Research Operations",
        },
        "type": {
            "code": "R: Small Business",
            "small_business": {"women_owned": True, "socially_disadvantaged": False},
        },
    },
    "contacts": {
        "authorized_representative": {
            **_REQUIRED_ONLY["contacts"]["authorized_representative"],
            "name": {
                "prefix": "Ms.",
                "first_name": "Jordan",
                "middle_name": "A",
                "last_name": "Santos",
                "suffix": "Jr.",
            },
            "fax": "6175550199",
        },
        "project_director": {
            **_REQUIRED_ONLY["contacts"]["project_director"],
            "title": "Principal Investigator",
            "organization": {
                "name": "Willow Research Institute",
                "department": "Urban Ecology",
                "division": "Research",
            },
        },
        "point_of_contact": {
            **_REQUIRED_ONLY["contacts"]["point_of_contact"],
            "title": "Grants Manager",
            "fax": "6175550198",
            "email": "quinn.bennett@example.org",
        },
    },
    "attachments": {
        "cover_letter": "cover-letter",
        "pre_application": "pre-application",
        "lobbying_disclosure": "sflll",
    },
}


def _attachment(upload_id: str) -> AttachmentInfo:
    return AttachmentInfo(
        filename=f"{upload_id}.pdf",
        mime_type="application/pdf",
        file_location=f"{upload_id}.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )


_ATTACHMENTS = {
    upload_id: _attachment(upload_id) for upload_id in ["cover-letter", "pre-application", "sflll"]
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=sf424_r_r_generated.FORM_XML_TRANSFORM_RULES,
            attachment_mapping=_ATTACHMENTS,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


def _text(xml: str, path: str) -> str | None:
    root = lxml_etree.fromstring(xml.encode())
    element = root.find("/".join(f"{{{_FORM_NS}}}{part}" for part in path.split("/")))
    return None if element is None else element.text


class TestSF424RRXMLGeneration:
    @pytest.mark.parametrize(
        "path,expected",
        [
            ("TrustAgree", "Y: Yes"),
            ("ApplicationType/isOtherAgencySubmission", "Y: Yes"),
            ("ApplicantType/SmallBusinessOrganizationType/isWomenOwned", "Y: Yes"),
            (
                "ApplicantType/SmallBusinessOrganizationType/isSociallyEconomicallyDisadvantaged",
                "N: No",
            ),
        ],
    )
    def test_writes_yes_no_answer_as_code(self, path, expected):
        assert _text(_generate(_DATA), path) == expected

    def test_writes_funding_amount_with_cents(self):
        xml = _generate(_DATA)
        assert _text(xml, "EstimatedProjectFunding/TotalfedNonfedrequested") == "100001.44"

    def test_writes_employer_id_at_root(self):
        assert _text(_generate(_DATA), "EmployerID") == "12-3456789"

    @pytest.mark.parametrize(
        "element,filename",
        [
            ("SFLLLAttachment", "sflll.pdf"),
            ("PreApplicationAttachment", "pre-application.pdf"),
            ("CoverLetterAttachment", "cover-letter.pdf"),
        ],
    )
    def test_writes_attachment_file_name(self, element, filename):
        root = lxml_etree.fromstring(_generate(_DATA).encode())
        name = root.find(f"{{{_FORM_NS}}}{element}/{{{_ATT_NS}}}FileName")
        assert name is not None
        assert name.text == filename

    def test_leaves_out_small_business_type_for_other_applicant_type(self):
        # A small business answer saved before the applicant type changed isn't written.
        data = {
            **_DATA,
            "applicant": {
                **_DATA["applicant"],
                "type": {**_DATA["applicant"]["type"], "code": "A: State Government"},
            },
        }
        assert _text(_generate(data), "ApplicantType/SmallBusinessOrganizationType") is None

    def test_leaves_out_unanswered_attachments(self):
        xml = _generate(_REQUIRED_ONLY)
        assert _text(xml, "CoverLetterAttachment") is None

    def test_rejects_upload_application_does_not_have(self):
        data = {**_DATA, "attachments": {"cover_letter": "unknown"}}
        response = XMLGenerationService().generate_xml(
            XMLGenerationRequest(
                application_data=data,
                transform_config=sf424_r_r_generated.FORM_XML_TRANSFORM_RULES,
                attachment_mapping=_ATTACHMENTS,
            )
        )
        assert not response.success
        assert "not found in attachment mapping" in (response.error_message or "")


class TestSF424RRXSDValidation:
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


class TestSF424RRSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
