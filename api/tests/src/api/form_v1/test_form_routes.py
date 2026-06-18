from src.form_schema.forms import _ALL_FORMS, SF424_v4_0
from src.form_schema.registry.form_template_registry import FormTemplateKey, form_template_registry


def test_form_list_returns_all_registry_forms(
    client, user_api_key_id, enable_factory_create, seed_form_registry
):
    """Response count and IDs match the full FormTemplateRegistry."""
    resp = client.get("/v1/forms/", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    data = resp.get_json()["data"]

    assert len(data) == len(_ALL_FORMS)

    returned_ids = {f["form_id"] for f in data}
    assert returned_ids == {str(f.form_id) for f in _ALL_FORMS}


def test_form_list_one_entry_per_form_id(
    client, user_api_key_id, enable_factory_create, seed_form_registry
):
    """Only the highest major version is returned when multiple versions are registered."""
    key_v2 = FormTemplateKey(SF424_v4_0.form_id, 2)
    form_template_registry._registry[key_v2] = SF424_v4_0

    try:
        resp = client.get("/v1/forms/", headers={"X-API-Key": user_api_key_id})

        assert resp.status_code == 200
        data = resp.get_json()["data"]

        sf424_entries = [f for f in data if f["form_id"] == str(SF424_v4_0.form_id)]
        assert len(sf424_entries) == 1
        assert sf424_entries[0]["current_version"]["major_version"] == 2
    finally:
        del form_template_registry._registry[key_v2]


def test_form_list_200_api_key(client, user_api_key_id, enable_factory_create, seed_form_registry):
    """Returns 200 with valid API key and well-formed response."""
    resp = client.get("/v1/forms/", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0

    form = data[0]
    assert "form_id" in form
    assert "name" in form
    assert "short_name" in form
    assert "current_version" in form
    assert "major_version" in form["current_version"]
    assert "minor_version" in form["current_version"]
    assert "legacy_form_version" in form["current_version"]


def test_form_list_version_shape(
    client, user_api_key_id, enable_factory_create, seed_form_registry
):
    """current_version has integer major/minor and optional legacy_form_version."""
    resp = client.get("/v1/forms/", headers={"X-API-Key": user_api_key_id})

    assert resp.status_code == 200
    for form in resp.get_json()["data"]:
        version = form["current_version"]
        assert isinstance(version["major_version"], int)
        assert isinstance(version["minor_version"], int)
        assert "legacy_form_version" in version


def test_form_list_401_no_auth(client):
    """Returns 401 when no auth header is provided."""
    resp = client.get("/v1/forms/")

    assert resp.status_code == 401


def test_form_list_401_invalid_api_key(client):
    """Returns 401 with unrecognized API key."""
    resp = client.get("/v1/forms/", headers={"X-API-Key": "bad-key"})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_form_list_401_invalid_jwt(client):
    """Returns 401 with malformed JWT token."""
    resp = client.get("/v1/forms/", headers={"X-SGG-Token": "invalid-jwt-token"})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"
