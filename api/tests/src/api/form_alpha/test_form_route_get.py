import uuid
from unittest import mock

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
    assert response_form["form_instruction"] is None
    assert response_form["json_to_xml_schema"] == form.json_to_xml_schema


def test_form_get_with_instructions_200(client, api_auth_token, enable_factory_create):
    # Create a form with instructions
    form = FormFactory.create(with_instruction=True)

    # Mock the download_path property
    presigned_url = "https://example.com/presigned-url"
    with mock.patch(
        "src.db.models.competition_models.FormInstruction.download_path",
        new_callable=mock.PropertyMock,
        return_value=presigned_url,
    ):
        resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    # Verify the form instruction data is included in the response
    assert response_form["form_instruction"] is not None
    assert response_form["form_instruction"]["file_name"] == form.form_instruction.file_name
    assert response_form["form_instruction"]["download_path"] == presigned_url
    assert "created_at" in response_form["form_instruction"]
    assert "updated_at" in response_form["form_instruction"]


def test_form_get_with_cdn_instructions_200(
    client, api_auth_token, enable_factory_create, monkeypatch_session
):
    # Set the CDN URL environment variable
    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")

    # Create a form with instructions
    form = FormFactory.create(with_instruction=True)

    # Mock the download_path property
    cdn_url = "https://cdn.example.com/form-instructions/file.pdf"
    with mock.patch(
        "src.db.models.competition_models.FormInstruction.download_path",
        new_callable=mock.PropertyMock,
        return_value=cdn_url,
    ):
        resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    # Verify the form instruction uses a CDN URL
    assert response_form["form_instruction"] is not None
    assert response_form["form_instruction"]["file_name"] == form.form_instruction.file_name
    assert response_form["form_instruction"]["download_path"] == cdn_url
    assert response_form["form_instruction"]["download_path"].startswith("https://cdn.")


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
