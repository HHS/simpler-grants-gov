from unittest import mock

import pytest

from src.task.forms.update_form_task import UpdateFormTask
from tests.src.db.models.factories import FormFactory


def test_update_form_task(db_session, enable_factory_create):
    form = FormFactory.create()
    task = UpdateFormTask(db_session, environment="local", form_id=form.form_id)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        task.run_task()
        mock_request.assert_called_once()


def test_update_form_task_non_200(db_session, enable_factory_create):
    form = FormFactory.create()
    task = UpdateFormTask(db_session, environment="local", form_id=form.form_id)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 403
    mocked_response.text = "this is the error"
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        with pytest.raises(Exception, match="this is the error"):
            task.run_task()

        mock_request.assert_called_once()
