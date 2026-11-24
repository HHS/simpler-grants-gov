import pytest

from src.form_schema.forms.research_related_personal_data_generated import FORM
from src.form_schema.jsonschema_validator import validate_json_schema_for_form

NAME = {"first_name": "Avery", "last_name": "Example"}


def test_only_director_name_required():
    assert validate_json_schema_for_form({"project_director": {"name": NAME}}, FORM) == []
    assert validate_json_schema_for_form({}, FORM)


@pytest.mark.parametrize(
    "field,values,valid",
    [
        ("race", ["Asian", "White"], True),
        ("race", ["Do Not Wish to Provide"], True),
        ("race", ["Asian", "Do Not Wish to Provide"], False),
        ("race", ["Asian", "Asian"], False),
        ("disability_status", ["None"], True),
        ("disability_status", ["None", "Other"], False),
        ("disability_status", ["Hearing", "Visual"], True),
        ("disability_status", ["Other", "Do Not Wish to Provide"], False),
    ],
)
def test_choices_follow_each_person(field, values, valid):
    answers = {
        "project_director": {"name": NAME},
        "co_project_director": [{"name": NAME, field: values}],
    }
    assert (validate_json_schema_for_form(answers, FORM) == []) is valid


@pytest.mark.parametrize("count,valid", [(4, True), (5, False)])
def test_co_director_limit(count, valid):
    answers = {"project_director": {"name": NAME}, "co_project_director": [{"name": NAME}] * count}
    assert (validate_json_schema_for_form(answers, FORM) == []) is valid
