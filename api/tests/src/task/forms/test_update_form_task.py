from unittest import mock

import pytest

from src.task.forms.update_form_task import UpdateFormTask
from tests.src.db.models.factories import FormFactory


def test_update_form_task(enable_factory_create, monkeypatch):
    form = FormFactory.create()
    task = UpdateFormTask(environment="local", form_id=str(form.form_id))

    forms = [form, FormFactory.create(), FormFactory.create()]
    monkeypatch.setattr(task, "get_forms", lambda: forms)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        task.run_task()
        mock_request.assert_called_once()


def test_update_form_task_non_200(enable_factory_create, monkeypatch):
    form = FormFactory.create()
    task = UpdateFormTask(environment="local", form_id=str(form.form_id))

    forms = [form, FormFactory.create(), FormFactory.create()]
    monkeypatch.setattr(task, "get_forms", lambda: forms)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 403
    mocked_response.text = "this is the error"
    with mock.patch("requests.put", return_value=mocked_response) as mock_request:
        with pytest.raises(Exception, match="this is the error"):
            task.run_task()

        mock_request.assert_called_once()


def test_update_form_task_form_id_not_found(enable_factory_create, monkeypatch):
    form = FormFactory.create()
    task = UpdateFormTask(environment="local", form_id=str(form.form_id))

    # get_forms will only return other forms
    forms = [FormFactory.create(), FormFactory.create()]
    monkeypatch.setattr(task, "get_forms", lambda: forms)

    with pytest.raises(Exception, match="No form found with ID"):
        task.run_task()
