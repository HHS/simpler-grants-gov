"""Tests for EPA Form 4700-4 XML generation.

Ensures generated XML matches the legacy Grants.gov output for this form.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd
"""

from lxml import etree as lxml_etree

from src.form_schema.forms.epa_form_4700_4 import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

FORM_NS = "http://apply.grants.gov/forms/EPA4700_4_5_0-V5.0"


def _full_application_data() -> dict:
    return {
        "applicant_name": "MH",
        "applicant_address": {
            "address": "123 foo st",
            "city": "Foo",
            "state": "AL: Alabama",
            "zip_code": "123451234",
        },
        "sam_uei": "00000000INDV",
        "point_of_contact_name": "MH",
        "point_of_contact_phone_number": "123-123-1234",
        "point_of_contact_email": "mike.huneke@focusconsulting.io",
        "point_of_contact_title": "MH",
        "federal_financial_assistance": False,
        "civil_rights_lawsuit_question1": "asdf",
        "civil_rights_lawsuit_question2": "adsf",
        "civil_rights_lawsuit_question3": "asdf",
        "construction_federal_assistance": True,
        "construction_new_facilities": True,
        "construction_new_facilities_explanation": "adsf",
        "notice1": True,
        "notice2": True,
        "notice3": True,
        "notice4": True,
        "demographic_data": True,
        "policy": True,
        "policy_explanation": "asdf",
        "program_explanation": "asdf",
        "applicant_signature": {
            "aor_signature": "Mike  Huneke",
            "aor_title": "MH",
            "submitted_date": "2026-07-23",
        },
    }


def _generate(application_data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data,
            transform_config=FORM_XML_TRANSFORM_RULES,
        )
    )
    assert response.success is True, response.error_message
    assert response.xml_data is not None
    return response.xml_data


def test_epa_form_4700_4_xml_matches_legacy_structure():
    root = lxml_etree.fromstring(_generate(_full_application_data()).encode())

    assert lxml_etree.QName(root).localname == "EPA4700_4_5_0"
    assert root.get(f"{{{FORM_NS}}}FormVersion") == "5.0"

    # applicant_name + applicant_address are grouped under a single ApplicantInfo element
    applicant_info = root.find(f"{{{FORM_NS}}}ApplicantInfo")
    assert applicant_info.find(f"{{{FORM_NS}}}ApplicantName").text == "MH"
    address = applicant_info.find(f"{{{FORM_NS}}}ApplicantAddress")
    assert [lxml_etree.QName(c).localname for c in address] == [
        "Address",
        "City",
        "State",
        "ZipCode",
    ]

    # booleans render as the legacy "Y: Yes" / "N: No" encoding
    assert root.find(f"{{{FORM_NS}}}FederalFinancialAssistanceQuestion").text == "N: No"
    assert root.find(f"{{{FORM_NS}}}Construction").text == "Y: Yes"

    signature = root.find(f"{{{FORM_NS}}}ApplicantSignature")
    assert [lxml_etree.QName(c).localname for c in signature] == [
        "AORSignature",
        "PersonTitle",
        "SubmittedDate",
    ]


def test_epa_form_4700_4_declares_attachments_namespace():
    """The att namespace is declared to match legacy output even though the body omits it."""
    root = lxml_etree.fromstring(_generate(_full_application_data()).encode())
    assert root.nsmap.get("att") == "http://apply.grants.gov/system/Attachments-V1.0"
