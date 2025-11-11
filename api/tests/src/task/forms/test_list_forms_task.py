import uuid

import pytest
import requests_mock

from src.api.form_alpha.form_schema import FormAlphaSchema
from src.task.forms.form_task_shared import build_form_json
from src.task.forms.list_forms_task import ListFormsTask, diff_form, get_update_cmd
from tests.src.db.models.factories import FormFactory


@pytest.fixture
def list_forms_task():
    return ListFormsTask("local", False, print_output=False)


def test_list_forms_task(list_forms_task, enable_factory_create, monkeypatch):
    unchanged_form = FormFactory.create(form_name="Unchanged Form", with_instruction=True)
    new_form = FormFactory.create(form_name="New Form")
    modified_form = FormFactory.create(form_name="Modified Form")
    modified_form_with_instruction = FormFactory.create(
        form_name="Modified Form with Instruction", with_instruction=True
    )

    forms = [unchanged_form, new_form, modified_form, modified_form_with_instruction]
    monkeypatch.setattr(list_forms_task, "get_forms", lambda: forms)

    unchanged_form_response = build_form_json(unchanged_form)
    unchanged_form_response["updated_at"] = "2025-09-19T19:53:02.220955+00:00"
    unchanged_form_response["form_instruction"] = {
        "form_instruction_id": str(unchanged_form.form_instruction_id)
    }

    modified_form_response = build_form_json(modified_form)
    modified_form_response["updated_at"] = "2025-07-25T23:15:45.123456+00:00"
    modified_form_response["form_version"] = "1000.12345"
    modified_form_response["omb_number"] = "1234-5678"
    modified_form_response["agency_code"] = "XYZ-ABC-123-456-789"

    modified_form_with_instruction_response = build_form_json(modified_form_with_instruction)
    modified_form_with_instruction_response["updated_at"] = "2025-06-24T10:01:23.222222+00:00"
    modified_form_with_instruction_response["form_version"] = "1234.56789"
    modified_form_with_instruction_response["form_instruction"] = {
        "form_instruction_id": str(uuid.uuid4())
    }

    with requests_mock.Mocker() as req_mock:
        # By default return a 404
        req_mock.get(requests_mock.ANY, status_code=404)
        req_mock.get(
            f"http://localhost:8080/alpha/forms/{unchanged_form.form_id}",
            status_code=200,
            json={"data": unchanged_form_response},
        )
        req_mock.get(
            f"http://localhost:8080/alpha/forms/{modified_form.form_id}",
            status_code=200,
            json={"data": modified_form_response},
        )
        req_mock.get(
            f"http://localhost:8080/alpha/forms/{modified_form_with_instruction.form_id}",
            status_code=200,
            json={"data": modified_form_with_instruction_response},
        )

        list_forms_task.run()

    # Verify the table we processed has all of the forms
    # Note that we might have more forms because we don't cleanup the DB
    assert list_forms_task.output_table.rowcount >= 4
    output_table_str = list_forms_task.output_table.get_string()
    assert modified_form.form_name in output_table_str
    assert new_form.form_name in output_table_str
    assert unchanged_form.form_name in output_table_str

    out_of_date_form_output = list_forms_task.out_of_date_forms
    # We expect the modified form to be in the output generated
    assert any(str(modified_form.form_id) in r for r in out_of_date_form_output)
    # We expect the new form to be in the output
    assert any(str(new_form.form_id) in r for r in out_of_date_form_output)
    # The unmodified form should not be mentioned
    assert not any(str(unchanged_form.form_id) in r for r in out_of_date_form_output)


@pytest.mark.parametrize(
    "environment, form_id, expected_result",
    [
        (
            "staging",
            "my-form-id",
            'make cmd args="task update-form --environment=staging --form-id=my-form-id"',
        ),
        (
            "dev",
            "my-other-form-id",
            'make cmd args="task update-form --environment=dev --form-id=my-other-form-id"',
        ),
    ],
)
def test_get_update_cmd(environment, form_id, expected_result):
    assert get_update_cmd(environment, form_id) == expected_result


def test_do_diff_no_changes(enable_factory_create):
    form = FormFactory.create()
    planned_request = build_form_json(form)

    schema = FormAlphaSchema()
    endpoint_response = schema.dump(form)

    assert len(diff_form(planned_request, endpoint_response)) == 0


def test_do_diff_no_changes_with_instruction(enable_factory_create):
    form = FormFactory.create(with_instruction=True)
    planned_request = build_form_json(form)

    schema = FormAlphaSchema()
    endpoint_response = schema.dump(form)

    assert len(diff_form(planned_request, endpoint_response)) == 0


def test_do_diff_with_diff(enable_factory_create):
    form = FormFactory.create(with_instruction=True)

    new_uuid = str(uuid.uuid4())
    planned_request = build_form_json(form)
    planned_request["form_instruction_id"] = new_uuid
    planned_request["agency_code"] = "XYZ-123j142"
    planned_request["form_json_schema"] = {}
    planned_request["form_rule_schema"] = {}
    planned_request["omb_number"] = "1234-567823"
    planned_request["json_to_xml_schema"] = {"new": "schema"}

    schema = FormAlphaSchema()
    endpoint_response = schema.dump(form)

    diff = diff_form(planned_request, endpoint_response)

    assert diff == {
        "form_instruction_id": {
            "existing_value": str(form.form_instruction_id),
            "planned_value": new_uuid,
        },
        "agency_code": {"existing_value": form.agency_code, "planned_value": "XYZ-123j142"},
        "form_json_schema": {"existing_value": form.form_json_schema, "planned_value": {}},
        "form_rule_schema": {"existing_value": form.form_rule_schema, "planned_value": {}},
        "omb_number": {"existing_value": form.omb_number, "planned_value": "1234-567823"},
        "json_to_xml_schema": {
            "existing_value": form.json_to_xml_schema,
            "planned_value": {"new": "schema"},
        },
    }
