import uuid

from tests.src.db.models.factories import FormFactory


def test_form_get_200(client, api_auth_token, enable_factory_create):
    form = FormFactory.create()

    resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    assert response_form["form_id"] == str(form.form_id)
    assert response_form["form_name"] == form.form_name
    assert response_form["form_json_schema"] == form.form_json_schema
    assert response_form["form_ui_schema"] == form.form_ui_schema


def test_form_get_404_not_found(client, api_auth_token):
    form_id = uuid.uuid4()
    resp = client.get(f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Form with ID {form_id}"


def test_form_get_401_unauthorized(client, api_auth_token, enable_factory_create):
    form = FormFactory.create()

    resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-Auth": "some-other-token"})

    assert resp.status_code == 401
    assert (
        resp.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
