from unittest import mock

import pytest

from src.task.forms.update_form_task import UpdateFormContainer, UpdateFormTask
from tests.src.db.models.factories import FormFactory


@pytest.fixture(autouse=True)
def non_local_api_auth_token(monkeypatch_module):
    monkeypatch_module.setenv("NON_LOCAL_API_AUTH_TOKEN", "fake-auth-token")


def test_update_form_task(db_session, enable_factory_create):
    form = FormFactory.create()
    update_form_container = UpdateFormContainer(
        environment="local", form_id=form.form_id, form_instruction_id="", is_dry_run=False
    )
    task = UpdateFormTask(db_session, update_form_container)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        task.run_task()
        mock_request.assert_called_once()


def test_update_form_task_non_200(db_session, enable_factory_create):
    form = FormFactory.create()
    update_form_container = UpdateFormContainer(
        environment="local", form_id=form.form_id, form_instruction_id="", is_dry_run=False
    )
    task = UpdateFormTask(db_session, update_form_container)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 403
    mocked_response.text = "this is the error"
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        with pytest.raises(Exception, match="this is the error"):
            task.run_task()

        mock_request.assert_called_once()


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
    form_id = "my-example-form-id"
    update_form_container = UpdateFormContainer(
        environment=environment, form_id=form_id, form_instruction_id="", is_dry_run=True
    )

    task = UpdateFormTask(db_session, update_form_container)
    assert task.get_url() == expected_url


def test_build_request(db_session, enable_factory_create):
    form = FormFactory.create()
    update_form_container = UpdateFormContainer(
        environment="local",
        form_id=str(form.form_id),
        form_instruction_id="my-form-instruction-id",
        is_dry_run=True,
    )

    task = UpdateFormTask(db_session, update_form_container)
    form_request = task.build_request(form)

    # Check a few of the parameters are right
    assert form_request["agency_code"] == form.agency_code
    assert form_request["form_instruction_id"] == "my-form-instruction-id"
    assert form_request["form_rule_schema"] == form.form_rule_schema
    assert form_request["form_ui_schema"] == form.form_ui_schema
    assert form_request["form_json_schema"] == form.form_json_schema


def test_build_headers(db_session):
    update_form_container = UpdateFormContainer(
        environment="local", form_id="", form_instruction_id="", is_dry_run=True
    )
    task = UpdateFormTask(db_session, update_form_container)

    assert task.build_headers() == {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Auth": "fake-auth-token",
    }


# TODO
# * Verify request built correctly
# * Verify response handled correctly
# * Mock the API call
# * Setup forms
# * Write docs
