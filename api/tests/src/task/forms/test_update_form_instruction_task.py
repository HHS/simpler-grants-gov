import os
import tempfile
from unittest import mock

import pytest

from src.task.forms.update_form_instruction_task import UpdateFormInstructionTask


@pytest.fixture
def temp_instruction_file():
    """Create a temporary file for testing file uploads."""
    with tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False) as temp_file:
        temp_file.write(b"test instruction content")
        temp_file_path = temp_file.name
    yield temp_file_path
    # Cleanup
    if os.path.exists(temp_file_path):
        os.unlink(temp_file_path)


def test_update_form_instruction_task(temp_instruction_file):
    task = UpdateFormInstructionTask(
        environment="local",
        form_id="test-form-id",
        form_instruction_id="test-instruction-id",
        file_path=temp_instruction_file,
    )

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    mocked_response.json.return_value = {"message": "Success"}

    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        task.run_task()
        mock_request.assert_called_once()

        # Verify the request was made with the right URL
        call_args = mock_request.call_args
        assert (
            "http://localhost:8080/alpha/forms/test-form-id/form_instructions/test-instruction-id"
            == call_args[0][0]
        )

        # Verify headers were set correctly
        headers = call_args[1]["headers"]
        assert "X-API-Key" in headers
        assert "Accept" in headers
        assert headers["Accept"] == "application/json"

        # Verify file was sent
        files = call_args[1]["files"]
        assert "file" in files


def test_update_form_instruction_task_non_200(temp_instruction_file):
    task = UpdateFormInstructionTask(
        environment="local",
        form_id="test-form-id",
        form_instruction_id="test-instruction-id",
        file_path=temp_instruction_file,
    )

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 403
    mocked_response.text = "this is the error"

    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        with pytest.raises(Exception, match="this is the error"):
            task.run_task()

        mock_request.assert_called_once()


def test_update_form_instruction_task_file_not_found():
    task = UpdateFormInstructionTask(
        environment="local",
        form_id="test-form-id",
        form_instruction_id="test-instruction-id",
        file_path="/nonexistent/path/to/file.pdf",
    )

    with pytest.raises(Exception, match="File not found"):
        task.run_task()


def test_update_form_instruction_task_dev_environment(temp_instruction_file):
    task = UpdateFormInstructionTask(
        environment="dev",
        form_id="test-form-id",
        form_instruction_id="test-instruction-id",
        file_path=temp_instruction_file,
    )

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    mocked_response.json.return_value = {"message": "Success"}

    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        task.run_task()
        mock_request.assert_called_once()

        # Verify the request was made with the right URL for dev
        call_args = mock_request.call_args
        assert (
            "https://api.dev.simpler.grants.gov/alpha/forms/test-form-id/form_instructions/test-instruction-id"
            == call_args[0][0]
        )
