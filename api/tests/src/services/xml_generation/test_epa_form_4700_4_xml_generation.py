"""Tests for EPA Form 4700-4 XML generation.

Ensures generated XML matches the legacy Grants.gov output for this form.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd

Most of the form is flat, with three exceptions worth calling out:
- applicant_name and applicant_address are wrapped together in ApplicantInfo through a
  field_grouping transform, and the address is a nested object inside that.
- applicant_signature is a nested object whose signature and date are only filled in
  by post-population on submit (see test_epa_form_4700_4.py for that pipeline).
- The nine yes/no questions go out in the legacy "Y: Yes" / "N: No" encoding.
"""

from datetime import date
from pathlib import Path
from typing import Any

import freezegun
import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.epa_form_4700_4 import FORM_XML_TRANSFORM_RULES, EPA_FORM_4700_4_v5_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.form_schema.shared import ADDRESS_SHARED_V1
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    OpportunityFactory,
)
from tests.src.form_schema.forms.conftest import setup_resolved_form

FORM_NS = "http://apply.grants.gov/forms/EPA4700_4_5_0-V5.0"
NS = {"EPA": FORM_NS}
XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD_NAME = "EPA4700_4_5_0-V5.0"
XSD_NS = {"xs": "http://www.w3.org/2001/XMLSchema"}

# Every optional field, with the XML element it's written to and the value that's
# expected there for the value used in _full_application_data()
OPTIONAL_TEXT_FIELDS = {
    "civil_rights_lawsuit_question1": "CivilRightsLawSuits1",
    "civil_rights_lawsuit_question2": "CivilRightsLawSuits2",
    "civil_rights_lawsuit_question3": "CivilRightsLawSuits3",
    "construction_new_facilities_explanation": "Construction2",
    "policy_explanation": "Policy2",
    "program_explanation": "Program",
}
YES_NO_FIELDS = {
    "federal_financial_assistance": "FederalFinancialAssistanceQuestion",
    "construction_federal_assistance": "ConstructionFederalAssistance",
    "construction_new_facilities": "Construction",
    "notice1": "Notice1",
    "notice2": "Notice2",
    "notice3": "Notice3",
    "notice4": "Notice4",
    "demographic_data": "Demographic",
    "policy": "Policy1",
}
OPTIONAL_TOP_LEVEL_FIELDS = {**YES_NO_FIELDS, **OPTIONAL_TEXT_FIELDS}

# Required top-level fields that map straight to one element
REQUIRED_SIMPLE_FIELDS = {
    "sam_uei": "SAMUEI",
    "point_of_contact_name": "POCName",
    "point_of_contact_phone_number": "Phone",
    "point_of_contact_email": "Email",
    "point_of_contact_title": "Title",
}
ADDRESS_FIELDS = {"address": "Address", "city": "City", "state": "State", "zip_code": "ZipCode"}
SIGNATURE_FIELDS = {
    "aor_signature": "AORSignature",
    "aor_title": "PersonTitle",
    "submitted_date": "SubmittedDate",
}


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


def _required_only_data() -> dict:
    """Only the fields the XSD requires, as they look after submit fills in the signature."""
    data = _full_application_data()
    for field in OPTIONAL_TOP_LEVEL_FIELDS:
        del data[field]
    return data


@pytest.fixture(scope="module")
def xsd_validator() -> XSDValidator:
    return XSDValidator(XSD_DIR.resolve())


@pytest.fixture(scope="module")
def resolved_form():
    return setup_resolved_form(EPA_FORM_4700_4_v5_0)


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


def _root(xml_data: str) -> lxml_etree._Element:
    return lxml_etree.fromstring(xml_data.encode("utf-8"))


def _local_names(element: lxml_etree._Element) -> list[str]:
    return [lxml_etree.QName(child).localname for child in element]


def _xsd_result(xsd_validator: XSDValidator, xml_data: str) -> dict:
    return xsd_validator.validate_xml_for_form(xml_data, XSD_NAME)


def _assert_xsd_valid(xsd_validator: XSDValidator, xml_data: str) -> None:
    result = _xsd_result(xsd_validator, xml_data)
    assert result["valid"], result["error_message"]


def _json_issues(resolved_form, application_data: dict) -> list[tuple[str, str]]:
    return [
        (issue.field, issue.type)
        for issue in validate_json_schema_for_form(application_data, resolved_form)
    ]


def _xsd_sequence(xpath: str) -> list[str]:
    """Element names, in order, of the xs:sequence found at `xpath` in the form's XSD."""
    xsd = lxml_etree.parse(str(XSD_DIR / f"{XSD_NAME}.xsd"))
    return [
        element.get("name") for element in xsd.findall(f"{xpath}/xs:sequence/xs:element", XSD_NS)
    ]


def _set(data: dict, path: str, value: Any) -> None:
    *parents, leaf = path.split(".")
    target = data
    for parent in parents:
        target = target[parent]
    target[leaf] = value


###################################
# Root, structure and full payload
###################################


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


def test_root_namespaces():
    root = _root(_generate(_full_application_data()))

    assert root.tag == f"{{{FORM_NS}}}EPA4700_4_5_0"
    assert root.nsmap["EPA4700_4_5_0"] == FORM_NS
    assert root.nsmap["globLib"] == "http://apply.grants.gov/system/GlobalLibrary-V2.0"
    assert root.nsmap["glob"] == "http://apply.grants.gov/system/Global-V1.0"


def test_full_application_validates_against_xsd(xsd_validator, resolved_form):
    data = _full_application_data()
    assert _json_issues(resolved_form, data) == []

    _assert_xsd_valid(xsd_validator, _generate(data))


def test_full_application_every_value_written(xsd_validator):
    """Every field ends up in its own element with the value that was entered."""
    data = _full_application_data()
    root = _root(_generate(data))

    assert root.findtext("EPA:ApplicantInfo/EPA:ApplicantName", namespaces=NS) == "MH"
    for field, element in ADDRESS_FIELDS.items():
        assert (
            root.findtext(f"EPA:ApplicantInfo/EPA:ApplicantAddress/EPA:{element}", namespaces=NS)
            == data["applicant_address"][field]
        )
    for field, element in {**REQUIRED_SIMPLE_FIELDS, **OPTIONAL_TEXT_FIELDS}.items():
        assert root.findtext(f"EPA:{element}", namespaces=NS) == data[field]
    for field, element in YES_NO_FIELDS.items():
        expected = "Y: Yes" if data[field] else "N: No"
        assert root.findtext(f"EPA:{element}", namespaces=NS) == expected
    for field, element in SIGNATURE_FIELDS.items():
        assert (
            root.findtext(f"EPA:ApplicantSignature/EPA:{element}", namespaces=NS)
            == data["applicant_signature"][field]
        )


def test_root_element_order_matches_xsd():
    root = _root(_generate(_full_application_data()))

    assert _local_names(root) == _xsd_sequence("xs:element[@name='EPA4700_4_5_0']/xs:complexType")


def test_nested_element_order_matches_xsd():
    root = _root(_generate(_full_application_data()))
    applicant_info = root.find("EPA:ApplicantInfo", NS)

    assert _local_names(applicant_info) == _xsd_sequence(
        ".//xs:element[@name='ApplicantInfo']/xs:complexType"
    )
    assert _local_names(applicant_info.find("EPA:ApplicantAddress", NS)) == _xsd_sequence(
        "xs:complexType[@name='AddressDataType']"
    )
    assert _local_names(root.find("EPA:ApplicantSignature", NS)) == _xsd_sequence(
        ".//xs:element[@name='ApplicantSignature']/xs:complexType"
    )


###################################
# Required-only payload and optional fields
###################################


def test_required_only_application_validates(xsd_validator, resolved_form):
    """With none of the optional questions answered, only the required elements are written."""
    data = _required_only_data()
    assert _json_issues(resolved_form, data) == []

    xml_data = _generate(data)

    assert _local_names(_root(xml_data)) == [
        "ApplicantInfo",
        "SAMUEI",
        "POCName",
        "Phone",
        "Email",
        "Title",
        "ApplicantSignature",
    ]
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("field,element", OPTIONAL_TOP_LEVEL_FIELDS.items())
def test_optional_field_written_when_supplied(xsd_validator, field, element):
    data = _required_only_data()
    data[field] = _full_application_data()[field]

    xml_data = _generate(data)
    root = _root(xml_data)

    assert len(root.findall(f"EPA:{element}", NS)) == 1
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("field,element", OPTIONAL_TOP_LEVEL_FIELDS.items())
def test_optional_field_omitted_when_not_supplied(xsd_validator, field, element):
    data = _full_application_data()
    del data[field]

    xml_data = _generate(data)
    root = _root(xml_data)

    assert root.find(f"EPA:{element}", NS) is None
    # Everything else is still there
    assert len(root) == len(_root(_generate(_full_application_data()))) - 1
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("field,element", YES_NO_FIELDS.items())
@pytest.mark.parametrize("value,expected", [(True, "Y: Yes"), (False, "N: No")])
def test_yes_no_questions_use_legacy_encoding(xsd_validator, field, element, value, expected):
    data = _required_only_data()
    data[field] = value

    xml_data = _generate(data)

    assert _root(xml_data).findtext(f"EPA:{element}", namespaces=NS) == expected
    _assert_xsd_valid(xsd_validator, xml_data)


###################################
# ApplicantInfo field_grouping
###################################


@pytest.mark.parametrize(
    "supplied,expected_children",
    [
        (["applicant_name", "applicant_address"], ["ApplicantName", "ApplicantAddress"]),
        (["applicant_name"], ["ApplicantName"]),
        (["applicant_address"], ["ApplicantAddress"]),
    ],
)
def test_applicant_info_groups_whatever_is_supplied(supplied, expected_children):
    """ApplicantInfo only wraps the source fields that have a value, in XSD order."""
    data = _full_application_data()
    for field in {"applicant_name", "applicant_address"} - set(supplied):
        del data[field]

    applicant_info = _root(_generate(data)).find("EPA:ApplicantInfo", NS)

    assert _local_names(applicant_info) == expected_children


def test_applicant_info_omitted_when_no_source_field_supplied():
    data = _full_application_data()
    del data["applicant_name"]
    del data["applicant_address"]

    root = _root(_generate(data))

    assert root.find("EPA:ApplicantInfo", NS) is None
    assert _local_names(root)[0] == "SAMUEI"


@pytest.mark.parametrize("missing", ["applicant_name", "applicant_address"])
def test_partial_applicant_info_is_blocked_by_json_schema(xsd_validator, resolved_form, missing):
    """The XSD needs both halves of ApplicantInfo. The JSON schema requires both, so a
    partial one can't be submitted, and the XSD would reject it if it were."""
    data = _full_application_data()
    del data[missing]

    assert _json_issues(resolved_form, data) == [(f"$.{missing}", "required")]
    assert not _xsd_result(xsd_validator, _generate(data))["valid"]


###################################
# ApplicantAddress and ApplicantSignature content
###################################


def test_address_sub_fields_written_with_their_values(xsd_validator):
    data = _full_application_data()
    data["applicant_address"] = {
        "address": "1600 Pennsylvania Ave NW",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20500-0003",
    }

    xml_data = _generate(data)
    address = _root(xml_data).find("EPA:ApplicantInfo/EPA:ApplicantAddress", NS)

    assert {lxml_etree.QName(child).localname: child.text for child in address} == {
        element: data["applicant_address"][field] for field, element in ADDRESS_FIELDS.items()
    }
    _assert_xsd_valid(xsd_validator, xml_data)


def test_every_state_in_the_schema_is_accepted_by_the_xsd(xsd_validator):
    """The schema's state list is shared with other forms; this form's XSD uses
    StateCodeDataTypeV3, so every value the UI offers has to be valid there."""
    states = ADDRESS_SHARED_V1.json_schema["state_code"]["enum"]
    data = _required_only_data()

    invalid = []
    for state in states:
        data["applicant_address"]["state"] = state
        if not _xsd_result(xsd_validator, _generate(data))["valid"]:
            invalid.append(state)

    assert states  # make sure there are states to check
    assert invalid == []


@pytest.mark.parametrize("missing", ["aor_signature", "submitted_date"])
def test_signature_before_submit_is_not_xsd_valid(xsd_validator, resolved_form, missing):
    """Signature and date are optional in the JSON schema because they're only filled in on
    submit. Without them ApplicantSignature is incomplete, which is why post-population has
    to run first (covered end to end in test_epa_form_4700_4.py)."""
    data = _full_application_data()
    del data["applicant_signature"][missing]

    assert _json_issues(resolved_form, data) == []
    xml_data = _generate(data)

    assert _local_names(_root(xml_data).find("EPA:ApplicantSignature", NS)) == [
        element for field, element in SIGNATURE_FIELDS.items() if field != missing
    ]
    assert not _xsd_result(xsd_validator, xml_data)["valid"]


###################################
# Negative paths
###################################


@pytest.mark.parametrize(
    "field",
    [
        "sam_uei",
        "point_of_contact_name",
        "point_of_contact_phone_number",
        "point_of_contact_email",
        "point_of_contact_title",
        "applicant_signature",
    ],
)
def test_missing_required_field_is_caught(xsd_validator, resolved_form, field):
    """Both the JSON schema and the XSD report a required field that's missing."""
    data = _full_application_data()
    del data[field]

    assert _json_issues(resolved_form, data) == [(f"$.{field}", "required")]
    result = _xsd_result(xsd_validator, _generate(data))
    assert not result["valid"]
    assert result["error_message"]


###################################
# Robustness
###################################

MAX_LENGTHS = {
    "applicant_name": 60,
    "applicant_address.address": 110,
    "applicant_address.city": 35,
    "applicant_address.zip_code": 30,
    "point_of_contact_name": 100,
    "point_of_contact_phone_number": 25,
    "point_of_contact_title": 45,
    "civil_rights_lawsuit_question1": 4000,
    "civil_rights_lawsuit_question2": 4000,
    "civil_rights_lawsuit_question3": 4000,
    "construction_new_facilities_explanation": 500,
    "policy_explanation": 1000,
    "program_explanation": 1000,
    "applicant_signature.aor_signature": 144,
    "applicant_signature.aor_title": 45,
}


@pytest.mark.parametrize("path,max_length", MAX_LENGTHS.items())
def test_fields_at_max_length_validate(xsd_validator, resolved_form, path, max_length):
    """The schema's max lengths line up with the XSD for every text field."""
    data = _full_application_data()
    _set(data, path, "A" * max_length)

    assert _json_issues(resolved_form, data) == []
    _assert_xsd_valid(xsd_validator, _generate(data))


@pytest.mark.parametrize("path,max_length", MAX_LENGTHS.items())
def test_fields_over_max_length_are_rejected(xsd_validator, resolved_form, path, max_length):
    data = _full_application_data()
    _set(data, path, "A" * (max_length + 1))

    assert (f"$.{path}", "maxLength") in _json_issues(resolved_form, data)
    assert not _xsd_result(xsd_validator, _generate(data))["valid"]


def test_email_at_max_length_validates(xsd_validator, resolved_form):
    data = _full_application_data()
    data["point_of_contact_email"] = "a" * 48 + "@example.com"
    assert len(data["point_of_contact_email"]) == 60

    assert _json_issues(resolved_form, data) == []
    _assert_xsd_valid(xsd_validator, _generate(data))


def test_special_characters_are_escaped(xsd_validator):
    """Free-text answers often contain characters that need escaping in XML."""
    data = _full_application_data()
    text = 'Smith & Sons v. EPA <2024> "pending" - it\'s ongoing'
    data["civil_rights_lawsuit_question1"] = text
    data["applicant_name"] = "R&D <Labs>"

    xml_data = _generate(data)
    root = _root(xml_data)

    assert "&amp;" in xml_data and "&lt;" in xml_data
    assert root.findtext("EPA:CivilRightsLawSuits1", namespaces=NS) == text
    assert root.findtext("EPA:ApplicantInfo/EPA:ApplicantName", namespaces=NS) == "R&D <Labs>"
    _assert_xsd_valid(xsd_validator, xml_data)


class TestEPAForm4700_4XSDValidation:
    """End to end: the form XML inside a real submission, and the save/submit pipeline that
    fills in UEI, signature and date, validated against the EPA Form 4700-4 XSD."""

    def _form_xml_from_submission(self, data: dict) -> str:
        competition = CompetitionFactory.create(
            opportunity=OpportunityFactory.create(), competition_forms=[]
        )
        application = ApplicationFactory.create(competition=competition)
        ApplicationFormFactory.create(
            application=application,
            competition_form=CompetitionFormFactory.create(
                competition=competition, form=EPA_FORM_4700_4_v5_0
            ),
            application_response=data,
        )
        submission = ApplicationSubmissionFactory.create(
            application=application, legacy_tracking_number=47004700
        )

        xml_string = SubmissionXMLAssembler(
            application, submission
        ).generate_complete_submission_xml()

        forms = lxml_etree.fromstring(xml_string.encode("utf-8")).find(
            ".//{http://apply.grants.gov/system/MetaGrantApplication}Forms"
        )
        form_elements = forms.findall(f"{{{FORM_NS}}}EPA4700_4_5_0")
        assert len(form_elements) == 1
        return lxml_etree.tostring(form_elements[0], encoding="unicode")

    @pytest.mark.parametrize("build_data", [_full_application_data, _required_only_data])
    def test_submission_xml_validates_against_xsd(
        self, enable_factory_create, seed_form_registry, xsd_validator, build_data
    ):
        form_xml = self._form_xml_from_submission(build_data())

        _assert_xsd_valid(xsd_validator, form_xml)

    @freezegun.freeze_time("2026-03-15 12:00:00", tz_offset=0)
    @pytest.mark.parametrize(
        "has_organization,expected_uei",
        [
            (True, "ORGUEI123456"),
            # An individual applicant gets the same placeholder UEI legacy uses
            (False, "00000000INDV"),
        ],
    )
    def test_saved_and_submitted_minimal_form_validates_against_xsd(
        self, enable_factory_create, xsd_validator, has_organization, expected_uei
    ):
        """Starts from only what the user has to type in. Saving fills in the UEI from the
        organization, and submitting fills in the signature and date, which the XSD requires."""
        data = _required_only_data()
        del data["sam_uei"]
        data["applicant_signature"] = {"aor_title": "Director"}

        application_form = setup_application_for_form_validation(
            data,
            json_schema=EPA_FORM_4700_4_v5_0.form_json_schema,
            rule_schema=EPA_FORM_4700_4_v5_0.form_rule_schema,
            has_organization=has_organization,
            uei="ORGUEI123456" if has_organization else None,
            user_email="signer@example.com",
        )
        assert validate_application_form(application_form, ApplicationAction.MODIFY) == []
        assert validate_application_form(application_form, ApplicationAction.SUBMIT) == []

        xml_data = _generate(application_form.application_response)
        root = _root(xml_data)

        assert root.findtext("EPA:SAMUEI", namespaces=NS) == expected_uei
        signature = root.find("EPA:ApplicantSignature", NS)
        assert _local_names(signature) == list(SIGNATURE_FIELDS.values())
        assert signature.findtext("EPA:AORSignature", namespaces=NS) == "signer@example.com"
        assert signature.findtext("EPA:PersonTitle", namespaces=NS) == "Director"
        assert (
            signature.findtext("EPA:SubmittedDate", namespaces=NS) == date(2026, 3, 15).isoformat()
        )
        _assert_xsd_valid(xsd_validator, xml_data)
