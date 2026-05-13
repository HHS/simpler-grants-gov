from tests.src.db.models.factories import FormFactory


def test_get_all_forms_success(client, user_auth_token, enable_factory_create):
    """Test getting all SGG forms returns 200 with correct structure"""
    form1 = FormFactory.create(agency_code="SGG", form_name="Test Form 1")
    form2 = FormFactory.create(agency_code="SGG", form_name="Test Form 2")
    form3 = FormFactory.create(agency_code="SGG", form_name="Test Form 3")

    resp = client.get("/v1/forms/", headers={"X-SGG-Token": user_auth_token})

    assert resp.status_code == 200
    response_data = resp.get_json()
    assert response_data["message"] == "Success"

    forms = response_data["data"]

    # Filter to just our created forms
    created_form_ids = {str(form1.form_id), str(form2.form_id), str(form3.form_id)}
    our_forms = [f for f in forms if f["form_id"] in created_form_ids]

    assert len(our_forms) == 3

    # Verify response structure for each form
    for form in our_forms:
        assert "form_id" in form
        assert "form_name" in form
        assert "agency_code" in form
        assert form["agency_code"] == "SGG"
        assert "form_json_schema" in form
        assert "form_ui_schema" in form
        assert "created_at" in form
        assert "updated_at" in form


def test_get_all_forms_includes_all_fields(client, user_auth_token, enable_factory_create):
    """Test that all schema fields are present in response"""
    from src.constants.lookup_constants import FormType

    form = FormFactory.create(
        agency_code="SGG",
        form_type=FormType.SF424,
        sgg_version="2.0",
        is_deprecated=False,
        form_name="Complete Fields Form",
    )

    resp = client.get("/v1/forms/", headers={"X-SGG-Token": user_auth_token})

    assert resp.status_code == 200
    response_data = resp.get_json()
    forms = response_data["data"]

    # Find the form that was just created
    our_form = None
    for f in forms:
        if f["form_id"] == str(form.form_id):
            our_form = f
            break

    assert our_form is not None

    # Verify all expected fields are present
    assert our_form["form_id"] == str(form.form_id)
    assert our_form["form_name"] == "Complete Fields Form"
    assert our_form["form_type"] == FormType.SF424.value
    assert our_form["sgg_version"] == "2.0"
    assert our_form["is_deprecated"] is False
    assert "short_form_name" in our_form
    assert "form_version" in our_form
    assert "agency_code" in our_form
    assert "omb_number" in our_form
    assert "legacy_form_id" in our_form
    assert "form_json_schema" in our_form
    assert "form_ui_schema" in our_form
    assert "form_rule_schema" in our_form
    assert "json_to_xml_schema" in our_form
    assert "created_at" in our_form
    assert "updated_at" in our_form


def test_get_all_forms_filters_out_non_sgg(client, user_auth_token, enable_factory_create):
    """Test that non-SGG agency forms are not returned"""
    form1 = FormFactory.create(agency_code="OTHER1")
    form2 = FormFactory.create(agency_code="OTHER2")

    resp = client.get("/v1/forms/", headers={"X-SGG-Token": user_auth_token})

    assert resp.status_code == 200
    response_data = resp.get_json()
    assert response_data["message"] == "Success"
    forms = response_data["data"]

    # Verify all returned forms are SGG
    for form in forms:
        assert form["agency_code"] == "SGG"

    # Verify our non-SGG forms are NOT in results
    form_ids = [f["form_id"] for f in forms]
    assert str(form1.form_id) not in form_ids
    assert str(form2.form_id) not in form_ids


def test_get_all_forms_invalid_token(client):
    response = client.get("/v1/forms/", headers={"X-SGG-Token": "invalid-token"})

    assert response.status_code == 401
    response_data = response.get_json()
    assert response_data["message"] == "Unable to process token"


def test_get_all_forms_ordered_by_created_at_desc(client, user_auth_token, enable_factory_create):
    """Test that forms are returned in descending order by created_at"""
    form1 = FormFactory.create(agency_code="SGG", form_name="First")
    form2 = FormFactory.create(agency_code="SGG", form_name="Second")
    form3 = FormFactory.create(agency_code="SGG", form_name="Third")

    resp = client.get("/v1/forms/", headers={"X-SGG-Token": user_auth_token})

    assert resp.status_code == 200
    response_data = resp.get_json()
    forms = response_data["data"]

    # Filter to just our created forms
    created_form_ids = {str(form1.form_id), str(form2.form_id), str(form3.form_id)}
    test_forms = [f for f in forms if f["form_id"] in created_form_ids]

    assert len(test_forms) == 3

    # Most recent should be first
    assert test_forms[0]["form_id"] == str(form3.form_id)
    assert test_forms[1]["form_id"] == str(form2.form_id)
    assert test_forms[2]["form_id"] == str(form1.form_id)


def test_get_all_forms_without_instructions(client, user_auth_token, enable_factory_create):
    """Test getting forms without instructions returns null for form_instruction"""
    form = FormFactory.create(agency_code="SGG", form_name="No Instructions Form")

    resp = client.get("/v1/forms/", headers={"X-SGG-Token": user_auth_token})

    assert resp.status_code == 200
    response_data = resp.get_json()
    forms = response_data["data"]

    # Find the form that was just created
    our_form = None
    for f in forms:
        if f["form_id"] == str(form.form_id):
            our_form = f
            break

    assert our_form is not None
    assert our_form["form_instruction"] is None
