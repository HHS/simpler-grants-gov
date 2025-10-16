import uuid

from tests.src.db.models.factories import FormFactory, FormInstructionFactory


def test_form_update_success_new_form(client, api_auth_token, enable_factory_create):
    """Test successfully creating a new form via PUT endpoint"""
    form_id = uuid.uuid4()
    form_data = {
        "form_name": "New Test Form",
        "short_form_name": "new_test_form",
        "form_version": "2.0",
        "agency_code": "TEST",
        "omb_number": "4040-0002",
        "form_json_schema": {"type": "object", "properties": {"test_field": {"type": "string"}}},
        "form_ui_schema": [{"type": "field", "definition": "/properties/test_field"}],
        "form_instruction_id": None,
        "form_rule_schema": None,
        "json_to_xml_schema": {"mapping": "test"},
    }

    resp = client.put(f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token}, json=form_data)

    assert resp.status_code == 200
    response_data = resp.get_json()
    assert response_data["message"] == "Success"

    form = response_data["data"]
    assert form["form_id"] == str(form_id)
    assert form["form_name"] == "New Test Form"
    assert form["short_form_name"] == "new_test_form"
    assert form["form_version"] == "2.0"
    assert form["agency_code"] == "TEST"
    assert form["omb_number"] == "4040-0002"
    assert form["json_to_xml_schema"] == {"mapping": "test"}


def test_form_update_success_existing_form(client, api_auth_token, enable_factory_create):
    """Test successfully updating an existing form via PUT endpoint"""
    existing_form = FormFactory.create(
        form_name="Original Name",
        short_form_name="original_name",
        form_version="1.0",
        agency_code="ORIG",
    )

    form_data = {
        "form_name": "Updated Name",
        "short_form_name": "updated_name",
        "form_version": "2.0",
        "agency_code": "UPD",
        "omb_number": "4040-0003",
        "form_json_schema": {"type": "object", "properties": {"updated_field": {"type": "string"}}},
        "form_ui_schema": [{"type": "field", "definition": "/properties/updated_field"}],
        "form_instruction_id": None,
        "form_rule_schema": {"some": "rule"},
        "json_to_xml_schema": {"updated": "mapping"},
    }

    resp = client.put(
        f"/alpha/forms/{existing_form.form_id}", headers={"X-Auth": api_auth_token}, json=form_data
    )

    assert resp.status_code == 200
    response_data = resp.get_json()
    assert response_data["message"] == "Success"

    form = response_data["data"]
    assert form["form_id"] == str(existing_form.form_id)
    assert form["form_name"] == "Updated Name"
    assert form["short_form_name"] == "updated_name"
    assert form["form_version"] == "2.0"
    assert form["agency_code"] == "UPD"
    assert form["omb_number"] == "4040-0003"
    assert form["json_to_xml_schema"] == {"updated": "mapping"}


def test_form_update_with_form_instruction(client, api_auth_token, enable_factory_create):
    """Test updating a form with a form instruction"""
    form_instruction = FormInstructionFactory.create()
    form_id = uuid.uuid4()

    form_data = {
        "form_name": "Form with Instruction",
        "short_form_name": "form_with_instruction",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": str(form_instruction.form_instruction_id),
        "form_rule_schema": None,
    }

    resp = client.put(f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token}, json=form_data)

    assert resp.status_code == 200
    response_data = resp.get_json()
    form = response_data["data"]
    assert form["form_instruction"] is not None
    assert form["form_instruction"]["form_instruction_id"] == str(
        form_instruction.form_instruction_id
    )


def test_form_update_invalid_form_instruction(client, api_auth_token, enable_factory_create):
    """Test updating a form with an invalid form instruction ID"""
    form_id = uuid.uuid4()
    invalid_instruction_id = uuid.uuid4()

    form_data = {
        "form_name": "Form with Invalid Instruction",
        "short_form_name": "form_with_invalid_instruction",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": str(invalid_instruction_id),
        "form_rule_schema": None,
    }

    resp = client.put(f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token}, json=form_data)

    assert resp.status_code == 404
    response_data = resp.get_json()
    assert (
        f"Form instruction with ID {invalid_instruction_id} not found" in response_data["message"]
    )


def test_form_update_missing_required_fields(client, api_auth_token, enable_factory_create):
    """Test updating a form with missing required fields"""
    form_id = uuid.uuid4()

    # Missing form_name and short_form_name
    form_data = {
        "form_version": "1.0",
        "agency_code": "TEST",
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
    }

    resp = client.put(f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token}, json=form_data)

    assert resp.status_code == 422


def test_form_update_unauthorized_user(client, all_api_auth_tokens, enable_factory_create):
    """Test that non-admin users cannot update forms"""
    form_id = uuid.uuid4()

    form_data = {
        "form_name": "Test Form",
        "short_form_name": "test_form",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": None,
        "form_rule_schema": None,
    }

    # Use auth_token_1 instead of auth_token_0 (not admin)
    non_admin_token = all_api_auth_tokens[1] if len(all_api_auth_tokens) > 1 else "non_admin_token"

    resp = client.put(
        f"/alpha/forms/{form_id}", headers={"X-Auth": non_admin_token}, json=form_data
    )

    assert resp.status_code == 403
    response_data = resp.get_json()
    assert "Only internal admin users can update forms" in response_data["message"]


def test_form_update_no_auth_token(client, enable_factory_create):
    """Test that requests without auth token are rejected"""
    form_id = uuid.uuid4()

    form_data = {
        "form_name": "Test Form",
        "short_form_name": "test_form",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": None,
        "form_rule_schema": None,
    }

    resp = client.put(f"/alpha/forms/{form_id}", json=form_data)

    assert resp.status_code == 401


def test_form_update_invalid_json(client, api_auth_token, enable_factory_create):
    """Test updating a form with invalid JSON"""
    form_id = uuid.uuid4()

    resp = client.put(
        f"/alpha/forms/{form_id}", headers={"X-Auth": api_auth_token}, data="invalid json"
    )

    # The framework returns 422 for malformed request body, not 400
    assert resp.status_code == 422
