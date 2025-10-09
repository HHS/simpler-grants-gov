import pytest

from src.task.forms.form_task_shared import BaseFormTask, build_form_json, get_form_url
from tests.src.db.models.factories import FormFactory


class DummyFormTask(BaseFormTask):
    def run_task(self) -> None:
        pass


@pytest.mark.parametrize(
    "environment,expected_url",
    [
        ("local", "http://localhost:8080/alpha/forms/my-example-form-id"),
        ("dev", "https://api.dev.simpler.grants.gov/alpha/forms/my-example-form-id"),
        ("staging", "https://api.staging.simpler.grants.gov/alpha/forms/my-example-form-id"),
        ("prod", "https://api.simpler.grants.gov/alpha/forms/my-example-form-id"),
    ],
)
def test_get_url(db_session, environment, expected_url):
    assert get_form_url(environment, "my-example-form-id") == expected_url


def test_build_form_json(db_session, enable_factory_create):
    form = FormFactory.create()
    form_request = build_form_json(form)

    # Check a few of the parameters are right
    assert form_request["agency_code"] == form.agency_code
    assert form_request["form_instruction_id"] == form.form_instruction_id
    assert form_request["form_rule_schema"] == form.form_rule_schema
    assert form_request["form_ui_schema"] == form.form_ui_schema
    assert form_request["form_json_schema"] == form.form_json_schema


def test_build_headers(db_session):
    dummy_form_task = DummyFormTask(db_session)

    assert dummy_form_task.build_headers() == {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Auth": "fake-auth-token",
    }
