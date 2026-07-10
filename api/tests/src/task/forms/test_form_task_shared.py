import pytest

from src.task.forms.form_task_shared import BaseFormTask, get_form_instruction_url


class DummyFormTask(BaseFormTask):
    def run_task(self) -> None:
        pass


def test_build_headers():
    dummy_form_task = DummyFormTask()

    assert dummy_form_task.build_headers() == {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": "fake-x-api-key",
    }


def test_build_file_upload_headers():
    dummy_form_task = DummyFormTask()

    # The form instruction endpoint uses X-API-Key authentication
    assert dummy_form_task.build_file_upload_headers() == {
        "Accept": "application/json",
        "X-API-Key": "fake-x-api-key",
    }


@pytest.mark.parametrize(
    "environment,expected_url",
    [
        (
            "local",
            "http://localhost:8080/alpha/forms/my-form-id/form_instructions/my-instruction-id",
        ),
        (
            "dev",
            "https://api.dev.simpler.grants.gov/alpha/forms/my-form-id/form_instructions/my-instruction-id",
        ),
        (
            "staging",
            "https://api.staging.simpler.grants.gov/alpha/forms/my-form-id/form_instructions/my-instruction-id",
        ),
        (
            "training",
            "https://api.training.simpler.grants.gov/alpha/forms/my-form-id/form_instructions/my-instruction-id",
        ),
        (
            "prod",
            "https://api.simpler.grants.gov/alpha/forms/my-form-id/form_instructions/my-instruction-id",
        ),
    ],
)
def test_get_form_instruction_url(environment, expected_url):
    assert get_form_instruction_url(environment, "my-form-id", "my-instruction-id") == expected_url
