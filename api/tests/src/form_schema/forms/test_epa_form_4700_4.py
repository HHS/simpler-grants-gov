import freezegun
import pytest

from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from tests.lib.data_factories import setup_application_for_form_validation
from tests.src.form_schema.forms.conftest import (
    validate_max_length,
    validate_min_length,
    validate_required,
)


@pytest.fixture
def minimal_valid_form_v5_0() -> dict:
    return {
        "applicant_name": "Joe's Research Place",
        "applicant_address": {
            "address": "123 Main St",
            "city": "Exampleburg",
            "state": "NY: New York",
            "zip_code": "12345-6789",
        },
        "sam_uei": "FAKEUEI98765",
        "point_of_contact_name": "Joe Smith",
        "point_of_contact_phone_number": "(123) 456-7890",
        "point_of_contact_email": "example@example.com",
        "point_of_contact_title": "Director",
        "applicant_signature": {"aor_title": "Director"},
    }


@pytest.fixture
def full_valid_form_v5_0() -> dict:
    return {
        "applicant_name": "Frank's Factory",
        "applicant_address": {
            "address": "567 Dream Blvd",
            "city": "Placeville",
            "state": "KY: Kentucky",
            "zip_code": "56789-0001",
        },
        "sam_uei": "FAKEUEI98765",
        "point_of_contact_name": "Frank Frankson",
        "point_of_contact_phone_number": "1234567890",
        "point_of_contact_email": "test@example.com",
        "point_of_contact_title": "Professor",
        "federal_financial_assistance": True,
        "civil_rights_lawsuit_question1": "N/A",
        "civil_rights_lawsuit_question2": "No lawsuits",
        "civil_rights_lawsuit_question3": "No lawsuits or pending reviews",
        "construction_federal_assistance": True,
        "construction_new_facilities": True,
        "construction_new_facilities_explanation": "We'll build it right",
        "notice1": True,
        "notice2": True,
        "notice3": True,
        "notice4": True,
        "demographic_data": True,
        "policy": True,
        "policy_explanation": "Yes, we follow the regulations",
        "program_explanation": "Yes, we handle grievances",
        "applicant_signature": {
            "aor_signature": "Bob Smith",
            "aor_title": "Lead Researcher",
            "submitted_date": "2025-12-01",
        },
    }


def test_epa_form_v5_0_minimal_valid_json(minimal_valid_form_v5_0, epa_form_4700_4_v5_0):
    validate_required(minimal_valid_form_v5_0, [], epa_form_4700_4_v5_0)


def test_epa_form_v5_0_full_valid_json(full_valid_form_v5_0, epa_form_4700_4_v5_0):
    validate_required(full_valid_form_v5_0, [], epa_form_4700_4_v5_0)


def test_epa_form_v5_0_empty_json(epa_form_4700_4_v5_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.applicant_name",
        "$.applicant_address",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_email",
        "$.point_of_contact_title",
        "$.applicant_signature",
    ]
    validate_required({}, EXPECTED_REQUIRED_FIELDS, epa_form_4700_4_v5_0)


def test_epa_form_v5_0_empty_nested_json(epa_form_4700_4_v5_0):
    data = {
        "applicant_address": {},
        "applicant_signature": {},
    }
    EXPECTED_REQUIRED_FIELDS = [
        "$.applicant_name",
        "$.applicant_address.address",
        "$.applicant_address.city",
        "$.applicant_address.state",
        "$.applicant_address.zip_code",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_email",
        "$.point_of_contact_title",
        "$.applicant_signature.aor_title",
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, epa_form_4700_4_v5_0)


def test_epa_form_v5_0_min_length(epa_form_4700_4_v5_0):
    data = {
        "applicant_name": "",
        "applicant_address": {"address": "", "city": "", "state": "MI: Michigan", "zip_code": ""},
        "sam_uei": "A" * 11,  # min is 12
        "point_of_contact_name": "",
        "point_of_contact_phone_number": "",
        "point_of_contact_email": "abc@example.com",
        "point_of_contact_title": "",
        "federal_financial_assistance": False,
        "civil_rights_lawsuit_question1": "",
        "civil_rights_lawsuit_question2": "",
        "civil_rights_lawsuit_question3": "",
        "construction_federal_assistance": False,
        "construction_new_facilities": False,
        "construction_new_facilities_explanation": "",
        "notice1": False,
        "notice2": False,
        "notice3": False,
        "notice4": False,
        "demographic_data": False,
        "policy": False,
        "policy_explanation": "",
        "program_explanation": "",
        "applicant_signature": {
            "aor_signature": "",
            "aor_title": "",
            "submitted_date": "2025-01-01",
        },
    }

    EXPECTED_ERROR_FIELDS = [
        "$.applicant_name",
        "$.applicant_address.address",
        "$.applicant_address.city",
        "$.applicant_address.zip_code",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_title",
        "$.civil_rights_lawsuit_question1",
        "$.civil_rights_lawsuit_question2",
        "$.civil_rights_lawsuit_question3",
        "$.construction_new_facilities_explanation",
        "$.policy_explanation",
        "$.program_explanation",
        "$.applicant_signature.aor_signature",
        "$.applicant_signature.aor_title",
    ]

    validate_min_length(data, EXPECTED_ERROR_FIELDS, epa_form_4700_4_v5_0)


def test_epa_form_v5_0_max_length(epa_form_4700_4_v5_0):
    data = {
        "applicant_name": "A" * 61,
        "applicant_address": {
            "address": "B" * 111,
            "city": "C" * 36,
            "state": "MI: Michigan",
            "zip_code": "D" * 31,
        },
        "sam_uei": "E" * 13,
        "point_of_contact_name": "F" * 101,
        "point_of_contact_phone_number": "G" * 26,
        "point_of_contact_email": "H" * 52 + "@fake.com",  # 61 total
        "point_of_contact_title": "I" * 46,
        "federal_financial_assistance": False,
        "civil_rights_lawsuit_question1": "J" * 4001,
        "civil_rights_lawsuit_question2": "K" * 4001,
        "civil_rights_lawsuit_question3": "L" * 4001,
        "construction_federal_assistance": False,
        "construction_new_facilities": False,
        "construction_new_facilities_explanation": "M" * 501,
        "notice1": False,
        "notice2": False,
        "notice3": False,
        "notice4": False,
        "demographic_data": False,
        "policy": False,
        "policy_explanation": "N" * 1001,
        "program_explanation": "O" * 1001,
        "applicant_signature": {
            "aor_signature": "P" * 145,
            "aor_title": "Q" * 46,
            "submitted_date": "2025-01-01",
        },
    }

    EXPECTED_ERROR_FIELDS = [
        "$.applicant_name",
        "$.applicant_address.address",
        "$.applicant_address.city",
        "$.applicant_address.zip_code",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_email",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_title",
        "$.civil_rights_lawsuit_question1",
        "$.civil_rights_lawsuit_question2",
        "$.civil_rights_lawsuit_question3",
        "$.construction_new_facilities_explanation",
        "$.policy_explanation",
        "$.program_explanation",
        "$.applicant_signature.aor_signature",
        "$.applicant_signature.aor_title",
    ]

    validate_max_length(data, EXPECTED_ERROR_FIELDS, epa_form_4700_4_v5_0)


def test_epa_form_v5_0_email_format(minimal_valid_form_v5_0, epa_form_4700_4_v5_0):
    data = minimal_valid_form_v5_0
    data["point_of_contact_email"] = "not-an-email"

    validation_issues = validate_json_schema_for_form(data, epa_form_4700_4_v5_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"
    assert validation_issues[0].message == "'not-an-email' is not a 'email'"


def test_epa_form_v5_0_pre_population_with_org(
    enable_factory_create, minimal_valid_form_v5_0, epa_form_4700_4_v5_0
):
    application_form = setup_application_for_form_validation(
        minimal_valid_form_v5_0,
        json_schema=epa_form_4700_4_v5_0.form_json_schema,
        rule_schema=epa_form_4700_4_v5_0.form_rule_schema,
        has_organization=True,
        uei="TESTUEI33330",
    )

    validation_issues = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert len(validation_issues) == 0
    assert application_form.application_response["sam_uei"] == "TESTUEI33330"


def test_epa_form_v5_0_pre_population_no_org(
    enable_factory_create, minimal_valid_form_v5_0, epa_form_4700_4_v5_0
):
    application_form = setup_application_for_form_validation(
        minimal_valid_form_v5_0,
        json_schema=epa_form_4700_4_v5_0.form_json_schema,
        rule_schema=epa_form_4700_4_v5_0.form_rule_schema,
        has_organization=False,
    )

    validation_issues = validate_application_form(application_form, ApplicationAction.MODIFY)
    assert len(validation_issues) == 0
    assert application_form.application_response["sam_uei"] == "00000000INDV"


@freezegun.freeze_time("2024-04-03 12:00:00", tz_offset=0)
def test_epa_form_v5_0_post_population(
    enable_factory_create, minimal_valid_form_v5_0, epa_form_4700_4_v5_0
):
    application_form = setup_application_for_form_validation(
        minimal_valid_form_v5_0,
        json_schema=epa_form_4700_4_v5_0.form_json_schema,
        rule_schema=epa_form_4700_4_v5_0.form_rule_schema,
        user_email="my-fake-email@mail.com",
    )

    validation_issues = validate_application_form(application_form, ApplicationAction.SUBMIT)
    assert len(validation_issues) == 0
    assert (
        application_form.application_response["applicant_signature"]["aor_signature"]
        == "my-fake-email@mail.com"
    )
    assert (
        application_form.application_response["applicant_signature"]["submitted_date"]
        == "2024-04-03"
    )
