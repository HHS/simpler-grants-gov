import pytest

from src.form_schema.forms.sbir_sttr_information_generated import FORM
from src.form_schema.jsonschema_validator import validate_json_schema_for_form

SBIR = {
    "agency": "HHS",
    "sbc_control_id": "001234567",
    "program_type": "SBIR",
    "application_type": "Phase I",
    "eligibility_certification": True,
    "anticipated_personnel": 2,
    "majority_venture_capital_owned": False,
    "faculty_or_student_owned": False,
    "federal_subcontracts_included": False,
    "hub_zone_located": False,
    "research_entirely_in_united_states": True,
    "equivalent_federal_work": False,
    "disclosure_permitted": False,
    "taba_funds_requested": False,
    "phase_ii_awards_received": False,
    "principal_investigator_primary_employment": False,
}


UPLOAD = "00000000-0000-4000-8000-000000000787"
STTR = {
    "appointment_and_minimum_effort_certified": True,
    "small_business_and_institution_work_shares_certified": True,
    "research_partner_uei": "EXAMPLE12345",
}


@pytest.mark.parametrize(
    ("overrides", "valid"),
    [
        ({}, True),
        ({"sbc_control_id": "A01234567"}, False),
        ({"anticipated_personnel": 0}, False),
        ({"anticipated_personnel": 1000}, False),
        ({"agency": "Other"}, False),
        ({"agency": "Other", "other_agency": "Example Agency"}, True),
        ({"agency": "DOE"}, False),
        ({"agency": "DOE", "agency_topic_subtopic": "T1"}, False),
        ({"agency": "DOE", "agency_topic_subtopic": "T1", "commercialization_plan": UPLOAD}, True),
        ({"application_type": "Phase II"}, False),
        ({"application_type": "Fast-Track"}, False),
        ({"application_type": "Phase II", "commercialization_plan": UPLOAD}, True),
        ({"research_entirely_in_united_states": False}, False),
        (
            {
                "research_entirely_in_united_states": False,
                "outside_united_states_explanation": UPLOAD,
            },
            True,
        ),
        ({"federal_subcontracts_included": True}, False),
        ({"equivalent_federal_work": True}, False),
        ({"phase_ii_awards_received": True}, False),
        ({"phase_ii_awards_received": True, "commercialization_history": UPLOAD}, True),
        ({"program_type": "Both"}, False),
        ({"program_type": "Both", **STTR}, True),
        ({"program_type": "STTR", "phase_ii_awards_received": True, **STTR}, True),
    ],
)
def test_required_answers_follow_program_agency_and_phase(overrides, valid):
    assert (validate_json_schema_for_form({**SBIR, **overrides}, FORM) == []) is valid
