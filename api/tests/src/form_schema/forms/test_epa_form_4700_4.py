import pytest

from tests.src.form_schema.forms.conftest import validate_required, validate_min_length, validate_max_length


@pytest.fixture
def minimal_valid_form_v5_0() -> dict:
    return {
        "applicant_name": "Joe's Research Place",
        "applicant_address": {
            "address": "123 Main St",
            "city": "Exampleburg",
            "state": "NY: New York",
            "zip_code": "12345-6789"
        },
        "sam_uei": "FAKEUEI98765",
        "point_of_contact_name": "Joe Smith",
        "point_of_contact_phone_number": "(123) 456-7890",
        "point_of_contact_email": "example@example.com",
        "point_of_contact_title": "Director",
        "applicant_signature": {
            "aor_title": "Director"
        }
    }


@pytest.fixture
def full_valid_form_v5_0() -> dict:
    return {
        "applicant_name": "Frank's Factory",
        "applicant_address": {
            "address": "567 Dream Blvd",
            "city": "Placeville",
            "state": "KY: Kentucky",
            "zip_code": "56789-0001"
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
        }
    }

def test_gg_lobbying_form_v1_1_minimal_valid_json(
    minimal_valid_form_v5_0, epa_form_4700_4_v5_0
):
    validate_required(minimal_valid_form_v5_0, [], epa_form_4700_4_v5_0)

def test_gg_lobbying_form_v1_1_full_valid_json(
    full_valid_form_v5_0, epa_form_4700_4_v5_0
):
    validate_required(full_valid_form_v5_0, [], epa_form_4700_4_v5_0)

def test_gg_lobbying_form_v1_1_empty_json(epa_form_4700_4_v5_0):
    EXPECTED_REQUIRED_FIELDS = [
        "$.applicant_name",
        "$.applicant_address",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_email",
        "$.point_of_contact_title",
        "$.applicant_signature"
    ]
    validate_required({}, EXPECTED_REQUIRED_FIELDS, epa_form_4700_4_v5_0)

def test_gg_lobbying_form_v1_1_empty_nested_json(epa_form_4700_4_v5_0):
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
        "$.applicant_signature.aor_title"
    ]
    validate_required(data, EXPECTED_REQUIRED_FIELDS, epa_form_4700_4_v5_0)

def test_gg_lobbying_form_v1_1_min_length(epa_form_4700_4_v5_0):
    data = {
        "applicant_name": "",
        "applicant_address": {
            "address": "",
            "city": "",
            "state": "MI: Michigan",
            "zip_code": ""
        },
        "sam_uei": "12345678901", # min is 12
        "point_of_contact_name": "",
        "point_of_contact_phone_number": "",
        "point_of_contact_email": "",
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
            "submitted_date": "",
        }
    }

    EXPECTED_ERROR_FIELDS = [
        "$.applicant_name",
        "$.applicant_address.address",
        "$.applicant_address.city",
        "$.applicant_address.zip_code",
        "$.sam_uei",
        "$.point_of_contact_name",
        "$.point_of_contact_phone_number",
        "$.point_of_contact_email",
        "$.point_of_contact_title",
        "$.applicant_signature.aor_title"
    ]

    validate_min_length(data, EXPECTED_ERROR_FIELDS, epa_form_4700_4_v5_0)

# TODO
# Min length
# Max Length
# Pre pop
# Post pop
# Types (booleans?)
# Field values for state field
# TODO - will we have any conditional validation?
