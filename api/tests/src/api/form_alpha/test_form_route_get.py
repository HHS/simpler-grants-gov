import uuid
from unittest import mock

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.forms import SF424_v4_0


def test_form_get_200(
    client, user_api_key_id, enable_factory_create, db_session, seed_form_registry
):
    form = db_session.get(Form, SF424_v4_0.form_id)

    resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    assert response_form["form_id"] == str(form.form_id)
    assert response_form["form_name"] == form.form_name
    assert response_form["form_json_schema"] == form.form_json_schema
    assert response_form["form_ui_schema"] == form.form_ui_schema
    assert response_form["form_instruction"] is not None  # SF424 has an instruction
    assert response_form["json_to_xml_schema"] == form.json_to_xml_schema


def test_form_get_with_instructions_200(
    client, user_api_key_id, enable_factory_create, db_session, seed_form_registry
):
    # SF424 has a form instruction seeded by seed_form_registry
    form = db_session.get(Form, SF424_v4_0.form_id)

    # Mock the download_path property
    presigned_url = "https://example.com/presigned-url"
    with mock.patch(
        "src.db.models.competition_models.FormInstruction.download_path",
        new_callable=mock.PropertyMock,
        return_value=presigned_url,
    ):
        resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    # Verify the form instruction data is included in the response
    assert response_form["form_instruction"] is not None
    assert response_form["form_instruction"]["file_name"] == form.form_instruction.file_name
    assert response_form["form_instruction"]["download_path"] == presigned_url
    assert "created_at" in response_form["form_instruction"]
    assert "updated_at" in response_form["form_instruction"]


def test_form_get_with_cdn_instructions_200(
    client,
    user_api_key_id,
    enable_factory_create,
    db_session,
    seed_form_registry,
    monkeypatch_session,
):
    # Set the CDN URL environment variable
    monkeypatch_session.setenv("CDN_URL", "https://cdn.example.com")

    # SF424 has a form instruction seeded by seed_form_registry
    form = db_session.get(Form, SF424_v4_0.form_id)

    # Mock the download_path property
    cdn_url = "https://cdn.example.com/form-instructions/file.pdf"
    with mock.patch(
        "src.db.models.competition_models.FormInstruction.download_path",
        new_callable=mock.PropertyMock,
        return_value=cdn_url,
    ):
        resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    # Verify the form instruction uses a CDN URL
    assert response_form["form_instruction"] is not None
    assert response_form["form_instruction"]["file_name"] == form.form_instruction.file_name
    assert response_form["form_instruction"]["download_path"] == cdn_url
    assert response_form["form_instruction"]["download_path"].startswith("https://cdn.")


def test_form_get_404_not_found(client, user_api_key_id):
    form_id = uuid.uuid4()
    resp = client.get(f"/alpha/forms/{form_id}", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Form with ID {form_id}"


def test_form_get_401_unauthorized(client, enable_factory_create, db_session, seed_form_registry):
    form = db_session.get(Form, SF424_v4_0.form_id)

    resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-API-Key": "some-other-token"})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_form_get_with_new_fields_200(
    client, user_api_key_id, enable_factory_create, db_session, seed_form_registry
):
    """Test getting a form with form_type, sgg_version, and is_deprecated fields"""
    # SF424_v4_0 has form_type=SF424, sgg_version="1.0", is_deprecated=False
    form = db_session.get(Form, SF424_v4_0.form_id)

    resp = client.get(f"/alpha/forms/{form.form_id}", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    response_form = resp.get_json()["data"]

    assert response_form["form_id"] == str(form.form_id)
    assert response_form["form_type"] == FormType.SF424.value
    assert response_form["sgg_version"] == "1.0"
    assert response_form["is_deprecated"] is False
