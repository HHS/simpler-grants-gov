import pytest
from src.form_schema.forms.research_and_related_other_project_information_generated import FORM
from src.form_schema.jsonschema_validator import validate_json_schema_for_form

REQUIRED = {
    "human_subjects_involved": False,
    "vertebrate_animals_used": False,
    "proprietary_information_included": False,
    "environmental_impact": False,
    "historic_site_designated_or_eligible": False,
    "international_activities_involved": False,
}


def test_six_negative_answers_are_valid():
    assert validate_json_schema_for_form(REQUIRED, FORM) == []
    for field in REQUIRED:
        assert validate_json_schema_for_form(
            {k: v for k, v in REQUIRED.items() if k != field}, FORM
        )


@pytest.mark.parametrize("codes,valid", [(["E1", "E4"], True), ([], False), (["E9"], False)])
def test_check_the_selected_exemption_codes(codes, valid):
    answers = {
        **REQUIRED,
        "human_subjects_involved": True,
        "exempt_from_federal_regulations": True,
        "exemption_numbers": codes,
    }
    assert (validate_json_schema_for_form(answers, FORM) == []) is valid


@pytest.mark.parametrize("count,valid", [(100, True), (101, False)])
def test_other_attachment_limit(count, valid):
    files = [f"00000000-0000-4000-8000-{index:012d}" for index in range(count)]
    answers = {**REQUIRED, "other_attachments": files}
    assert (validate_json_schema_for_form(answers, FORM) == []) is valid


@pytest.mark.parametrize(
    "inactive,active,required_fields",
    [
        (
            {"human_subjects_involved": False, "exempt_from_federal_regulations": True},
            {"human_subjects_involved": True},
            {"exemption_numbers"},
        ),
        (
            {
                "human_subjects_involved": True,
                "exempt_from_federal_regulations": True,
                "exemption_numbers": ["E1"],
                "irb_review_pending": False,
            },
            {"exempt_from_federal_regulations": False},
            {"irb_approval_date"},
        ),
        (
            {"vertebrate_animals_used": False, "iacuc_review_pending": False},
            {"vertebrate_animals_used": True},
            {"iacuc_approval_date", "animal_welfare_assurance_number"},
        ),
        (
            {"environmental_impact": False, "assessment_or_exemption_performed": True},
            {"environmental_impact": True, "environmental_impact_explanation": "Field sampling"},
            {"assessment_or_exemption_explanation"},
        ),
    ],
)
def test_a_follow_up_is_required_only_in_its_active_branch(inactive, active, required_fields):
    answers = {**REQUIRED, **inactive}
    assert validate_json_schema_for_form(answers, FORM) == []

    errors = validate_json_schema_for_form({**answers, **active}, FORM)
    assert {error.field for error in errors} == {f"$.{field}" for field in required_fields}
