"""Tests for SF-424 (SF424_4_0) XML generation.

Most SF-424 elements are optional in the XSD, so if a field has no entry in
FORM_XML_TRANSFORM_RULES the XML still validates and the value is just left out.
XSD validation alone can't catch that, so these tests also check that every field
is mapped and that the value entered is what ends up in the generated XML.
"""

from pathlib import Path
from typing import Any

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import init_form_registry
from src.form_schema.forms.sf424 import FORM_JSON_SCHEMA, FORM_XML_TRANSFORM_RULES
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1
from src.services.xml_generation.constants import NO_VALUE, YES_VALUE
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
NS = {
    "SF424": "http://apply.grants.gov/forms/SF424_4_0-V4.0",
    "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

# Minimal New application: only the fields the JSON schema requires, plus the three the
# system fills in on submission (date_received, date_signed, aor_signature).
POST_POPULATED_FIELDS = {"date_received", "date_signed", "aor_signature"}
BASE_APPLICATION = {
    "submission_type": "Application",
    "application_type": "New",
    "date_received": "2025-01-15",
    "organization_name": "Test Research University",
    "employer_taxpayer_identification_number": "123456789",
    "sam_uei": "TEST12345678",
    "applicant": {
        "street1": "123 Main St",
        "city": "Washington",
        "state": "DC: District of Columbia",
        "zip_code": "20001",
        "country": "USA: UNITED STATES",
    },
    "contact_person": {"first_name": "Jane", "last_name": "Smith"},
    "phone_number": "555-123-4567",
    "email": "contact@test.org",
    "applicant_type_code": ["A: State Government"],
    "agency_name": "Test Agency",
    "funding_opportunity_number": "TEST-FON-2025-001",
    "funding_opportunity_title": "Test Funding Opportunity",
    "project_title": "Test Project Title",
    "congressional_district_applicant": "DC-00",
    "congressional_district_program_project": "DC-00",
    "project_start_date": "2025-04-01",
    "project_end_date": "2026-03-31",
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
    "authorized_representative_title": "Director",
    "authorized_representative_phone_number": "555-111-2222",
    "authorized_representative_email": "john.doe@test.org",
    "aor_signature": "John Doe Signature",
    "date_signed": "2025-01-15",
}

ATTACHMENTS = {
    "areas_affected": "11111111-1111-1111-1111-111111111111",
    "additional_project_title": ["22222222-2222-2222-2222-222222222222"],
    "additional_congressional_districts": "33333333-3333-3333-3333-333333333333",
    "debt_explanation": "44444444-4444-4444-4444-444444444444",
}

# Every field on the form filled in (a Revision, so the revision fields apply).
# The state/province choice in the address means only one of the two can be sent.
ALL_FIELDS_APPLICATION = BASE_APPLICATION | {
    "application_type": "Revision",
    "revision_type": "E: Other (specify)",
    "revision_other_specify": "Scope change",
    "applicant_id": "APP-001",
    "federal_entity_identifier": "FEI-12345",
    "federal_award_identifier": "AWARD-2024-001",
    "state_receive_date": "2025-01-10",
    "state_application_id": "STATE-APP-99",
    "applicant": BASE_APPLICATION["applicant"]
    | {"street2": "Suite 400", "county": "District of Columbia"},
    "department_name": "Dept of Research",
    "division_name": "Life Sciences",
    "contact_person": {
        "prefix": "Dr.",
        "first_name": "Jane",
        "middle_name": "Q",
        "last_name": "Smith",
        "suffix": "PhD",
    },
    "contact_person_title": "Program Manager",
    "organization_affiliation": "Partner Institute",
    "fax": "555-123-9999",
    "applicant_type_code": ["A: State Government", "R: Small Business", "X: Other (specify)"],
    "applicant_type_other_specify": "Research consortium",
    "assistance_listing_number": "93.001",
    "assistance_listing_program_title": "Test Assistance Listing",
    "competition_identification_number": "COMP-001",
    "competition_identification_title": "Test Competition",
    "state_review": "a. This application was made available to the state under the Executive Order 12372 Process for review on",
    "state_review_available_date": "2025-01-05",
    "delinquent_federal_debt": True,
    "authorized_representative": {
        "prefix": "Mr.",
        "first_name": "John",
        "middle_name": "A",
        "last_name": "Doe",
        "suffix": "Jr.",
    },
    "authorized_representative_fax": "555-111-9999",
    **ATTACHMENTS,
}

# Fields that were being dropped from the XML: JSON path -> (XML path, value sent)
PREVIOUSLY_DROPPED_FIELDS = {
    "revision_type": ("SF424:RevisionType", "E: Other (specify)"),
    "revision_other_specify": ("SF424:RevisionOtherSpecify", "Scope change"),
    "applicant_id": ("SF424:ApplicantID", "APP-001"),
    "federal_entity_identifier": ("SF424:FederalEntityIdentifier", "FEI-12345"),
    "federal_award_identifier": ("SF424:FederalAwardIdentifier", "AWARD-2024-001"),
    "state_receive_date": ("SF424:StateReceiveDate", "2025-01-10"),
    "state_application_id": ("SF424:StateApplicationID", "STATE-APP-99"),
    "department_name": ("SF424:DepartmentName", "Dept of Research"),
    "division_name": ("SF424:DivisionName", "Life Sciences"),
    "contact_person_title": ("SF424:Title", "Program Manager"),
    "organization_affiliation": ("SF424:OrganizationAffiliation", "Partner Institute"),
    "fax": ("SF424:Fax", "555-123-9999"),
    "authorized_representative_fax": ("SF424:AuthorizedRepresentativeFax", "555-111-9999"),
    "contact_person.prefix": ("SF424:ContactPerson/globLib:PrefixName", "Dr."),
    "contact_person.middle_name": ("SF424:ContactPerson/globLib:MiddleName", "Q"),
    "contact_person.suffix": ("SF424:ContactPerson/globLib:SuffixName", "PhD"),
    "authorized_representative.prefix": (
        "SF424:AuthorizedRepresentative/globLib:PrefixName",
        "Mr.",
    ),
    "authorized_representative.middle_name": (
        "SF424:AuthorizedRepresentative/globLib:MiddleName",
        "A",
    ),
    "authorized_representative.suffix": (
        "SF424:AuthorizedRepresentative/globLib:SuffixName",
        "Jr.",
    ),
}

XSD_NS = {"xs": "http://www.w3.org/2001/XMLSchema"}
ATTACHMENT_FIELDS = set(FORM_XML_TRANSFORM_RULES["_xml_config"]["attachment_fields"])

SHARED_SCHEMAS = {
    shared.schema_uri: shared.json_schema for shared in (COMMON_SHARED_V1, ADDRESS_SHARED_V1)
}


@pytest.fixture(scope="module")
def xsd_validator() -> XSDValidator:
    init_form_registry()
    return XSDValidator(XSD_DIR)


def _generate(application_data: dict) -> str:
    attachment_mapping = {
        attachment_id: AttachmentInfo(
            filename=f"{attachment_id}.pdf",
            mime_type="application/pdf",
            file_location=f"./attachments/{attachment_id}.pdf",
            hash_value="YQ==",
            hash_algorithm="SHA-1",
        )
        for value in ATTACHMENTS.values()
        for attachment_id in (value if isinstance(value, list) else [value])
    }
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data,
            transform_config=FORM_XML_TRANSFORM_RULES,
            pretty_print=True,
            attachment_mapping=attachment_mapping,
        )
    )
    assert response.success, response.error_message
    assert response.xml_data is not None
    return response.xml_data


def _find_text(xml_data: str, xml_path: str) -> str | None:
    root = lxml_etree.fromstring(xml_data.encode("utf-8"))
    node = root.find(xml_path, NS)
    return None if node is None else node.text


def _assert_xsd_valid(xsd_validator: XSDValidator, xml_data: str) -> None:
    result = xsd_validator.validate_xml_for_form(xml_data, "SF424_4_0-V4.0")
    assert result["valid"], result["error_message"]


def _root_xsd_sequence() -> list[lxml_etree._Element]:
    """Child element definitions of the SF424_4_0 root, in XSD sequence order."""
    xsd = lxml_etree.parse(str(XSD_DIR / "SF424_4_0-V4.0.xsd"))
    return xsd.findall(
        "xs:element[@name='SF424_4_0']/xs:complexType/xs:sequence/xs:element", XSD_NS
    )


def _root_xsd_elements() -> tuple[list[str], list[str]]:
    """(required, optional) child elements of the SF424_4_0 root, read from the XSD."""
    elements = _root_xsd_sequence()
    required = [e.get("name") for e in elements if e.get("minOccurs") != "0"]
    optional = [e.get("name") for e in elements if e.get("minOccurs") == "0"]
    return required, optional


def _direct_mappings(
    rules: dict[str, Any], data: dict[str, Any], parent_xml_path: str = ""
) -> list[tuple[str, str, Any]]:
    """(json field, xml path, value) for every field in `data` that is copied into the
    XML as-is, i.e. without a value transform, conditional transform or attachment."""
    mappings = []
    for key, rule in rules.items():
        if key.startswith("_") or key in ATTACHMENT_FIELDS or key not in data:
            continue
        transform = rule["xml_transform"]
        namespace = transform.get("namespace", "SF424")
        xml_path = f"{parent_xml_path}{namespace}:{transform['target']}"
        if transform.get("type") == "nested_object":
            children = {k: v for k, v in rule.items() if k != "xml_transform"}
            for field, child_path, value in _direct_mappings(children, data[key], xml_path + "/"):
                mappings.append((f"{key}.{field}", child_path, value))
        elif "value_transform" not in transform and "conditional_transform" not in transform:
            mappings.append((key, xml_path, data[key]))
    return mappings


def _nested_properties(field_schema: dict[str, Any]) -> dict[str, Any]:
    """Sub-fields of an object field, following a shared-schema $ref if it uses one."""
    if "properties" in field_schema:
        return field_schema["properties"]
    for ref in field_schema.get("allOf", []):
        schema_uri, _, name = ref.get("$ref", "").partition("#/")
        shared = SHARED_SCHEMAS.get(schema_uri, {}).get(name, {})
        if shared.get("type") == "object":
            return shared.get("properties", {})
    return {}


def _unmapped_fields(properties: dict[str, Any], rules: dict[str, Any], prefix: str = "") -> set:
    """Schema fields (including sub-fields of objects like names and addresses) that
    no transform rule reads from."""
    mapped = {key for key in rules if not key.startswith("_")}
    for rule in rules.values():
        if isinstance(rule, dict):
            conditional = rule.get("xml_transform", {}).get("conditional_transform", {})
            if source_field := conditional.get("source_field"):
                mapped.add(source_field)

    unmapped = set()
    for name, field_schema in properties.items():
        if name not in mapped:
            unmapped.add(prefix + name)
            continue
        sub_properties = _nested_properties(field_schema)
        if sub_properties:
            unmapped |= _unmapped_fields(sub_properties, rules[name], f"{prefix}{name}.")
    return unmapped


def test_all_schema_fields_have_xml_mapping():
    """Adding a field to the schema without a transform rule should fail here instead
    of the value quietly disappearing from the XML sent to Grants.gov."""
    unmapped = _unmapped_fields(FORM_JSON_SCHEMA["properties"], FORM_XML_TRANSFORM_RULES)
    assert not unmapped, (
        f"SF-424 schema fields with no XML mapping (would be dropped from the XML): "
        f"{sorted(unmapped)}"
    )


def test_no_rules_for_fields_missing_from_schema():
    """A rule keyed on a name the schema doesn't have never fires, so it looks like the
    field is covered when it isn't (this is how Fax was lost: the rule said fax_number)."""
    schema_fields = set(FORM_JSON_SCHEMA["properties"])
    stale = {
        key
        for key, rule in FORM_XML_TRANSFORM_RULES.items()
        if not key.startswith("_")
        and "conditional_transform" not in rule.get("xml_transform", {})
        and key not in schema_fields
    }
    assert not stale, f"Transform rules for fields that don't exist in the schema: {sorted(stale)}"


def test_all_fields_payload_covers_every_schema_field():
    """Keeps the all-fields test honest: a new schema field has to be added to it."""
    missing = set(FORM_JSON_SCHEMA["properties"]) - set(ALL_FIELDS_APPLICATION)
    assert not missing, f"Add these fields to ALL_FIELDS_APPLICATION: {sorted(missing)}"


def test_all_fields_xml_generation(xsd_validator):
    """With every field filled in, each previously dropped value is in the XML and the
    document still validates, which also confirms the new elements are in XSD order."""
    xml_data = _generate(ALL_FIELDS_APPLICATION)

    for json_path, (xml_path, value) in PREVIOUSLY_DROPPED_FIELDS.items():
        assert _find_text(xml_data, xml_path) == value, f"{json_path} missing from {xml_path}"
    _assert_xsd_valid(xsd_validator, xml_data)


def test_every_field_value_reaches_xml():
    """Every field (required and optional, including name and address parts) that is
    copied as-is lands in its XML element with the exact value entered."""
    xml_data = _generate(ALL_FIELDS_APPLICATION)

    mappings = _direct_mappings(FORM_XML_TRANSFORM_RULES, ALL_FIELDS_APPLICATION)
    assert len(mappings) > 50, "expected most SF-424 fields to be direct mappings"
    for json_path, xml_path, value in mappings:
        assert _find_text(xml_data, xml_path) == value, f"{json_path} -> {xml_path}"


def test_transformed_field_values_reach_xml():
    """Fields whose value is converted on the way to XML come out in the XSD's format."""
    xml_data = _generate(ALL_FIELDS_APPLICATION)

    assert _find_text(xml_data, "SF424:ApplicantTypeCode1") == "A: State Government"
    assert _find_text(xml_data, "SF424:ApplicantTypeCode2") == "R: Small Business"
    assert _find_text(xml_data, "SF424:ApplicantTypeCode3") == "X: Other (specify)"
    assert _find_text(xml_data, "SF424:FederalEstimatedFunding") == "100000.00"
    assert _find_text(xml_data, "SF424:TotalEstimatedFunding") == "100000.00"
    assert _find_text(xml_data, "SF424:DelinquentFederalDebt") == YES_VALUE
    assert _find_text(xml_data, "SF424:CertificationAgree") == YES_VALUE
    # The form stores "state" in lowercase; the XSD enum capitalizes it
    assert _find_text(xml_data, "SF424:StateReview") == (
        "a. This application was made available to the State under the "
        "Executive Order 12372 Process for review on"
    )


def test_required_elements_present_in_minimal_application(xsd_validator):
    """An application with only the required fields filled in still produces every
    element the XSD requires."""
    xml_data = _generate(BASE_APPLICATION)

    required, _ = _root_xsd_elements()
    missing = [name for name in required if _find_text(xml_data, f"SF424:{name}") is None]
    # Elements that hold child elements (e.g. Applicant) have no text of their own
    root = lxml_etree.fromstring(xml_data.encode("utf-8"))
    missing = [name for name in missing if root.find(f"SF424:{name}", NS) is None]
    assert not missing, f"Required XSD elements missing from the XML: {missing}"
    _assert_xsd_valid(xsd_validator, xml_data)


def test_optional_fields_omitted_when_not_provided(xsd_validator):
    """Leaving optional fields empty doesn't produce empty elements for them."""
    xml_data = _generate(BASE_APPLICATION)

    _, optional = _root_xsd_elements()
    # ContactPerson is optional in the XSD but required by the JSON schema, so the
    # minimal payload always has it.
    optional = [name for name in optional if name != "ContactPerson"]
    root = lxml_etree.fromstring(xml_data.encode("utf-8"))
    present = [name for name in optional if root.find(f"SF424:{name}", NS) is not None]
    assert not present, f"Optional elements emitted without a value: {present}"
    for xml_path, _ in PREVIOUSLY_DROPPED_FIELDS.values():
        assert _find_text(xml_data, xml_path) is None, f"{xml_path} should be omitted"
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize(
    "revision_fields",
    [
        {"revision_type": "A: Increase Award"},
        {"revision_type": "E: Other (specify)", "revision_other_specify": "Scope change"},
    ],
    ids=["revision_a", "revision_e_other"],
)
def test_revision_path_includes_revision_fields(xsd_validator, revision_fields):
    """The form requires these fields for a Revision, so a schema-valid document that
    leaves them out is still wrong; check the values are actually in the XML."""
    application_data = BASE_APPLICATION | {
        "application_type": "Revision",
        "federal_award_identifier": "AWARD-2024-001",
        **revision_fields,
    }

    xml_data = _generate(application_data)

    assert _find_text(xml_data, "SF424:ApplicationType") == "Revision"
    assert _find_text(xml_data, "SF424:RevisionType") == revision_fields["revision_type"]
    assert _find_text(xml_data, "SF424:RevisionOtherSpecify") == revision_fields.get(
        "revision_other_specify"
    )
    assert _find_text(xml_data, "SF424:FederalAwardIdentifier") == "AWARD-2024-001"
    _assert_xsd_valid(xsd_validator, xml_data)


def test_continuation_path_includes_federal_award_identifier(xsd_validator):
    """A Continuation must carry the existing award number."""
    application_data = BASE_APPLICATION | {
        "application_type": "Continuation",
        "federal_award_identifier": "AWARD-2024-002",
    }

    xml_data = _generate(application_data)

    assert _find_text(xml_data, "SF424:ApplicationType") == "Continuation"
    assert _find_text(xml_data, "SF424:FederalAwardIdentifier") == "AWARD-2024-002"
    assert _find_text(xml_data, "SF424:RevisionType") is None
    _assert_xsd_valid(xsd_validator, xml_data)


def test_base_application_is_the_json_schema_minimum():
    """BASE_APPLICATION stays a true minimal payload: exactly the JSON-schema-required
    fields plus the post-populated ones, nothing optional."""
    expected = set(FORM_JSON_SCHEMA["required"]) | POST_POPULATED_FIELDS
    assert set(BASE_APPLICATION) == expected


def test_nested_optional_fields_omitted_when_not_provided():
    """Optional address and name parts that aren't entered don't show up as empty tags."""
    xml_data = _generate(BASE_APPLICATION)

    for xml_path in (
        "SF424:Applicant/globLib:Street2",
        "SF424:Applicant/globLib:County",
        "SF424:Applicant/globLib:Province",
        "SF424:ContactPerson/globLib:PrefixName",
        "SF424:ContactPerson/globLib:MiddleName",
        "SF424:ContactPerson/globLib:SuffixName",
        "SF424:AuthorizedRepresentative/globLib:PrefixName",
        "SF424:AuthorizedRepresentative/globLib:MiddleName",
        "SF424:AuthorizedRepresentative/globLib:SuffixName",
    ):
        root = lxml_etree.fromstring(xml_data.encode("utf-8"))
        assert root.find(xml_path, NS) is None, f"{xml_path} should be omitted"


def test_element_order_matches_xsd_sequence():
    """With every field present, the root's children come out in the XSD's order."""
    root = lxml_etree.fromstring(_generate(ALL_FIELDS_APPLICATION).encode("utf-8"))
    xsd_order = [element.get("name") for element in _root_xsd_sequence()]

    emitted = [
        lxml_etree.QName(child).localname
        for child in root
        if lxml_etree.QName(child).namespace == NS["SF424"]
    ]
    assert emitted == [name for name in xsd_order if name in emitted]


def test_root_namespaces():
    root = lxml_etree.fromstring(_generate(BASE_APPLICATION).encode("utf-8"))

    assert lxml_etree.QName(root).namespace == NS["SF424"]
    assert lxml_etree.QName(root).localname == "SF424_4_0"
    assert NS["globLib"] in root.nsmap.values()


@pytest.mark.parametrize(
    "state_review",
    [
        "a. This application was made available to the state under the Executive Order 12372 Process for review on",
        "b. Program is subject to E.O. 12372 but has not been selected by the state for review.",
        "c. Program is not covered by E.O. 12372.",
    ],
    ids=["option_a", "option_b", "option_c"],
)
def test_state_review_every_option(xsd_validator, state_review):
    """Options a and b are stored with a lowercase "state"; the XSD enum capitalizes it.
    Option c has no "state" in it and passes through unchanged."""
    extra = {"state_review_available_date": "2025-01-05"} if state_review.startswith("a.") else {}
    xml_data = _generate(BASE_APPLICATION | {"state_review": state_review, **extra})

    assert _find_text(xml_data, "SF424:StateReview") == state_review.replace(
        "the state", "the State"
    )
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("value,expected", [(True, YES_VALUE), (False, NO_VALUE)])
def test_yes_no_fields_every_output(value, expected):
    application_data = BASE_APPLICATION | {
        "delinquent_federal_debt": value,
        "certification_agree": value,
    }
    if value:
        application_data["debt_explanation"] = ATTACHMENTS["debt_explanation"]

    xml_data = _generate(application_data)

    assert _find_text(xml_data, "SF424:DelinquentFederalDebt") == expected
    assert _find_text(xml_data, "SF424:CertificationAgree") == expected


def test_applicant_type_h_casing_is_normalized(xsd_validator):
    """Option H is stored with a lowercase "state"; the XSD enum needs "State"."""
    xml_data = _generate(
        BASE_APPLICATION
        | {"applicant_type_code": ["H: Public/state Controlled Institution of Higher Education"]}
    )

    assert _find_text(xml_data, "SF424:ApplicantTypeCode1") == (
        "H: Public/State Controlled Institution of Higher Education"
    )
    _assert_xsd_valid(xsd_validator, xml_data)


def test_authorized_representative_partial_name_has_no_placeholder():
    """Only the name parts actually entered are written; nothing is invented to fill the
    gap (the JSON schema requires first and last name, so this can't reach submission)."""
    xml_data = _generate(BASE_APPLICATION | {"authorized_representative": {"first_name": "Amy"}})

    assert _find_text(xml_data, "SF424:AuthorizedRepresentative/globLib:FirstName") == "Amy"
    assert _find_text(xml_data, "SF424:AuthorizedRepresentative/globLib:LastName") is None


def test_address_province_branch(xsd_validator):
    """The XSD allows State or Province (xs:choice); a non-US address uses Province."""
    applicant = {
        "street1": "1 King St",
        "city": "Toronto",
        "province": "Ontario",
        "zip_code": "M5H 1A1",
        "country": "CAN: CANADA",
    }
    xml_data = _generate(BASE_APPLICATION | {"applicant": applicant})

    assert _find_text(xml_data, "SF424:Applicant/globLib:Province") == "Ontario"
    assert _find_text(xml_data, "SF424:Applicant/globLib:State") is None
    _assert_xsd_valid(xsd_validator, xml_data)


def test_address_with_both_state_and_province_fails_xsd(xsd_validator):
    """The shared address schema doesn't stop both from being entered, and the XML then
    fails the XSD's State/Province choice. Kept as a test so the behavior is explicit."""
    applicant = BASE_APPLICATION["applicant"] | {"province": "Ontario"}
    xml_data = _generate(BASE_APPLICATION | {"applicant": applicant})

    result = xsd_validator.validate_xml_for_form(xml_data, "SF424_4_0-V4.0")
    assert not result["valid"]


def test_fields_at_max_length_still_validate(xsd_validator):
    """Values at the schema's max length are accepted by the XSD too."""
    xml_data = _generate(
        BASE_APPLICATION
        | {
            "application_type": "Revision",
            "revision_type": "E: Other (specify)",
            "revision_other_specify": "x" * 21,
            "federal_award_identifier": "x" * 25,
            "division_name": "x" * 30,
            "department_name": "x" * 30,
            "organization_affiliation": "x" * 60,
            "authorized_representative_email": "a" * 51 + "@test.org",
            "state_application_id": "x" * 30,
        }
    )

    assert _find_text(xml_data, "SF424:DivisionName") == "x" * 30
    assert _find_text(xml_data, "SF424:StateApplicationID") == "x" * 30
    _assert_xsd_valid(xsd_validator, xml_data)


def test_special_characters_are_escaped(xsd_validator):
    """Free text with XML special characters round-trips and keeps the XML valid."""
    value = 'R&D <Labs> "West"'
    xml_data = _generate(BASE_APPLICATION | {"organization_affiliation": value})

    assert _find_text(xml_data, "SF424:OrganizationAffiliation") == value
    _assert_xsd_valid(xsd_validator, xml_data)


def test_additional_project_title_at_max_attachments(xsd_validator):
    """AdditionalProjectTitle allows up to 100 files."""
    attachment_ids = [f"00000000-0000-4000-8000-{index:012d}" for index in range(100)]
    attachment_mapping = {
        attachment_id: AttachmentInfo(
            filename=f"title_{index}.pdf",
            mime_type="application/pdf",
            file_location=f"./attachments/title_{index}.pdf",
            hash_value="YQ==",
            hash_algorithm="SHA-1",
        )
        for index, attachment_id in enumerate(attachment_ids)
    }
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=BASE_APPLICATION | {"additional_project_title": attachment_ids},
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping=attachment_mapping,
        )
    )
    assert response.success, response.error_message

    root = lxml_etree.fromstring(response.xml_data.encode("utf-8"))
    title_group = root.find("SF424:AdditionalProjectTitle", NS)
    assert title_group is not None
    assert len(title_group) == 100
    _assert_xsd_valid(xsd_validator, response.xml_data)


def test_missing_required_field_fails_xsd(xsd_validator):
    """Generation itself doesn't enforce required fields (the JSON schema does that), but
    the XSD check catches an application that reaches it without one."""
    application_data = {k: v for k, v in BASE_APPLICATION.items() if k != "organization_name"}
    xml_data = _generate(application_data)

    assert _find_text(xml_data, "SF424:OrganizationName") is None
    result = xsd_validator.validate_xml_for_form(xml_data, "SF424_4_0-V4.0")
    assert not result["valid"]
