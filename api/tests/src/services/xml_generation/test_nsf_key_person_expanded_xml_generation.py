"""Tests for NSF Senior/Key Person Profile (Expanded) XML generation.

The form is generated from forms/specs and writes its XML from a mapping shaped like the XML
(xml_mapping.json). There's no hand-written form to compare it with, so the XML is checked
against the XSD and pinned in a snapshot.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/NSF_KeyPersonExpanded_3_3-V3.3.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import nsf_key_person_expanded_generated
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_FORM_NS = "http://apply.grants.gov/forms/NSF_KeyPersonExpanded_3_3-V3.3"
_XSD = "NSF_KeyPersonExpanded_3_3-V3.3.xsd"
_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "nsf_key_person_expanded_3_3.xml"


_DOCUMENTS = (
    "biographical_sketch",
    "current_pending_support",
    "collaborators",
    "synergistic_activities",
)


def _profile(name: str, role: str, uploads: str, organization: dict) -> dict:
    """A profile with all four of its documents, each uploaded as `<uploads>-<document>`."""
    first, last = name.split()
    return {
        "name": {"prefix": "Dr.", "first_name": first, "last_name": last},
        "title": "Researcher",
        **organization,
        "department": "Department of Biology",
        "address": {
            "street1": "1200 University Avenue",
            "city": "Madison",
            "state": "WI: Wisconsin",
            "zip_code": "53706-1380",
            "country": "USA: UNITED STATES",
        },
        "phone": "6085550100",
        "email": f"{first.lower()}@example.edu",
        "project_role": role,
        "nsf_id": "000123456",
        **{document: f"{uploads}-{document}" for document in _DOCUMENTS},
    }


_ADDITIONAL = {
    "additional_profiles": "more-profiles",
    "additional_biographical_sketches": "more-sketches",
    "additional_current_pending_support": "more-support",
    "additional_collaborators": "more-collaborators",
    "additional_synergistic_activities": "more-activities",
}

# The answers a profile requires; the XSD leaves out each optional element.
_REQUIRED = ("name", "address", "phone", "email", "project_role", *_DOCUMENTS)


def _without_optional_answers(profile: dict) -> dict:
    """`profile` with only the answers it requires, and a name and address to match."""
    kept = {field: value for field, value in profile.items() if field in _REQUIRED}
    kept["name"] = {
        "first_name": profile["name"]["first_name"],
        "last_name": profile["name"]["last_name"],
    }
    kept["address"] = {
        field: profile["address"][field]
        for field in ("street1", "city", "state", "zip_code", "country")
    }
    return kept


# Two senior/key persons, and every attachment the form takes.
_DATA = {
    "principal_investigator": _profile(
        "Maria Chen", "PD/PI", "pi", {"organization_name": "University of Wisconsin-Madison"}
    ),
    "senior_key_persons": [
        _profile("Tom Okafor", "Co-PD/PI", "kp1", {"organization_uei": "ABCDEFGH1234"}),
        _profile("Ana Ruiz", "Other Senior Personnel", "kp2", {"organization_uei": "ZYXWVUTS9876"}),
    ],
    **_ADDITIONAL,
}


def _attachment(upload_id: str) -> AttachmentInfo:
    return AttachmentInfo(
        filename=f"{upload_id}.pdf",
        mime_type="application/pdf",
        file_location=f"{upload_id}.pdf",
        hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
    )


_ATTACHMENTS = {
    upload_id: _attachment(upload_id)
    for upload_id in [
        *(f"{person}-{document}" for person in ("pi", "kp1", "kp2") for document in _DOCUMENTS),
        *_ADDITIONAL.values(),
    ]
}


def _generate(data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=nsf_key_person_expanded_generated.FORM_XML_TRANSFORM_RULES,
            attachment_mapping=_ATTACHMENTS,
        )
    )
    assert response.success, response.error_message
    return response.xml_data


class TestNSFKeyPersonExpandedXMLGeneration:
    def test_writes_each_person_in_a_profile(self):
        root = lxml_etree.fromstring(_generate(_DATA).encode())

        profiles = root.findall(f"{{{_FORM_NS}}}KeyPerson/{{{_FORM_NS}}}Profile")
        assert len(profiles) == 2
        assert root.find(f"{{{_FORM_NS}}}PDPI/{{{_FORM_NS}}}Profile") is not None

    def test_writes_each_persons_attachments_inside_their_profile(self):
        root = lxml_etree.fromstring(_generate(_DATA).encode())

        att = "{http://apply.grants.gov/system/Attachments-V1.0}"
        sketches = root.findall(
            f"{{{_FORM_NS}}}KeyPerson/{{{_FORM_NS}}}Profile/{{{_FORM_NS}}}BioSketchsAttached/"
            f"{{{_FORM_NS}}}BioSketchAttached/{att}FileName"
        )
        assert [sketch.text for sketch in sketches] == [
            "kp1-biographical_sketch.pdf",
            "kp2-biographical_sketch.pdf",
        ]

    def test_rejects_an_upload_the_application_does_not_have(self):
        data = {**_DATA, "additional_profiles": "unknown"}
        response = XMLGenerationService().generate_xml(
            XMLGenerationRequest(
                application_data=data,
                transform_config=nsf_key_person_expanded_generated.FORM_XML_TRANSFORM_RULES,
                attachment_mapping=_ATTACHMENTS,
            )
        )
        assert not response.success
        assert "not found in attachment mapping" in (response.error_message or "")


class TestNSFKeyPersonExpandedXSDValidation:
    @pytest.fixture
    def xsd_validator(self):
        xsd_dir = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
        if not (xsd_dir / _XSD).exists():
            pytest.skip(f"{_XSD} not found. Run 'flask task fetch-xsds'.")
        return XSDValidator(xsd_dir)

    def test_full_form_is_valid(self, xsd_validator):
        result = xsd_validator.validate_xml(_generate(_DATA), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]

    def test_principal_investigator_alone_is_valid(self, xsd_validator):
        data = {"principal_investigator": _DATA["principal_investigator"]}
        result = xsd_validator.validate_xml(_generate(data), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]

    def test_profile_without_optional_answers_is_valid(self, xsd_validator):
        data = {
            "principal_investigator": _without_optional_answers(_DATA["principal_investigator"]),
            "senior_key_persons": [_without_optional_answers(_DATA["senior_key_persons"][0])],
        }
        result = xsd_validator.validate_xml(_generate(data), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]

    def test_person_outside_us_is_valid(self, xsd_validator):
        person = {
            **_DATA["senior_key_persons"][0],
            "address": {
                "street1": "25 King's Parade",
                "city": "Cambridge",
                "province": "Cambridgeshire",
                "zip_code": "CB2 1ST",
                "country": "GBR: UNITED KINGDOM",
            },
        }
        data = {**_DATA, "senior_key_persons": [person]}
        result = xsd_validator.validate_xml(_generate(data), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]

    def test_most_senior_key_persons_allowed_is_valid(self, xsd_validator):
        data = {**_DATA, "senior_key_persons": [_DATA["senior_key_persons"][0]] * 99}
        result = xsd_validator.validate_xml(_generate(data), xsd_validator.xsd_dir / _XSD)
        assert result["valid"], result["error_message"]


class TestNSFKeyPersonExpandedSnapshot:
    """Regression snapshot pinning the full generated XML.

    To regenerate after an intentional change, write `_generate(_DATA)` to the snapshot file.
    """

    def test_full_xml_matches_snapshot(self):
        assert _generate(_DATA) == _SNAPSHOT_PATH.read_text()
