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
