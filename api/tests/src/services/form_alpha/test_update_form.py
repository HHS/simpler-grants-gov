import uuid

import pytest
from apiflask.exceptions import HTTPError

from src.constants.lookup_constants import FormType
from src.services.form_alpha.update_form import update_form
from tests.src.db.models.factories import FormFactory, FormInstructionFactory


def test_update_form_create_new(enable_factory_create, db_session, internal_admin_user):
    """Test creating a new form"""
    form_id = uuid.uuid4()
    form_data = {
        "form_name": "New Test Form",
        "short_form_name": "new_test_form",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": "4040-0001",
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [{"type": "field"}],
        "form_instruction_id": None,
        "form_rule_schema": None,
    }

    with db_session.begin():
        form = update_form(db_session, form_id, form_data, internal_admin_user)

    assert form.form_id == form_id
    assert form.form_name == "New Test Form"
    assert form.short_form_name == "new_test_form"
    assert form.form_version == "1.0"
    assert form.agency_code == "TEST"
    assert form.omb_number == "4040-0001"
    assert form.form_json_schema == {"type": "object"}
    assert form.form_ui_schema == [{"type": "field"}]
    assert form.form_instruction_id is None
    assert form.form_rule_schema is None
    assert form.legacy_form_id is None


def test_update_form_update_existing(enable_factory_create, db_session, internal_admin_user):
    """Test updating an existing form"""
    existing_form = FormFactory.create(
        form_name="Original Name",
        short_form_name="original_name",
        form_version="1.0",
        agency_code="ORIG",
        omb_number="0000-0001",
    )

    form_data = {
        "form_name": "Updated Name",
        "short_form_name": "updated_name",
        "form_version": "2.0",
        "agency_code": "UPD",
        "omb_number": "4040-0002",
        "form_json_schema": {"type": "updated"},
        "form_ui_schema": [{"type": "updated_field"}],
        "form_instruction_id": None,
        "form_rule_schema": {"rule": "updated"},
    }

    with db_session.begin():
        form = update_form(db_session, existing_form.form_id, form_data, internal_admin_user)

    assert form.form_id == existing_form.form_id
    assert form.form_name == "Updated Name"
    assert form.short_form_name == "updated_name"
    assert form.form_version == "2.0"
    assert form.agency_code == "UPD"
    assert form.omb_number == "4040-0002"
    assert form.form_json_schema == {"type": "updated"}
    assert form.form_ui_schema == [{"type": "updated_field"}]
    assert form.form_rule_schema == {"rule": "updated"}


def test_update_form_with_form_instruction(enable_factory_create, db_session, internal_admin_user):
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
        "form_instruction_id": form_instruction.form_instruction_id,
        "form_rule_schema": None,
    }

    with db_session.begin():
        form = update_form(db_session, form_id, form_data, internal_admin_user)

    assert form.form_instruction_id == form_instruction.form_instruction_id
    assert form.form_instruction == form_instruction


def test_update_form_invalid_instruction(enable_factory_create, db_session, internal_admin_user):
    """Test updating a form with invalid form instruction ID"""
    form_id = uuid.uuid4()
    invalid_instruction_id = uuid.uuid4()

    form_data = {
        "form_name": "Test Form",
        "short_form_name": "test_form",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": invalid_instruction_id,
        "form_rule_schema": None,
    }

    with pytest.raises(HTTPError) as exc_info:
        with db_session.begin():
            update_form(db_session, form_id, form_data, internal_admin_user)

    assert exc_info.value.status_code == 404
    assert f"Form instruction with ID {invalid_instruction_id} not found" in exc_info.value.message


def test_update_form_nullable_fields(enable_factory_create, db_session, internal_admin_user):
    """Test updating a form with null values for optional fields"""
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

    with db_session.begin():
        form = update_form(db_session, form_id, form_data, internal_admin_user)

    assert form.omb_number is None
    assert form.form_instruction_id is None
    assert form.form_rule_schema is None
    assert form.legacy_form_id is None


def test_update_form_overwrite_instruction(enable_factory_create, db_session, internal_admin_user):
    """Test updating a form to remove form instruction"""
    form_instruction = FormInstructionFactory.create()
    existing_form = FormFactory.create(form_instruction=form_instruction)

    form_data = {
        "form_name": "Updated Form",
        "short_form_name": "updated_form",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": None,
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [],
        "form_instruction_id": None,  # Remove the instruction
        "form_rule_schema": None,
    }

    with db_session.begin():
        form = update_form(db_session, existing_form.form_id, form_data, internal_admin_user)

    assert form.form_instruction_id is None
    assert form.form_instruction is None


def test_update_form_with_new_fields(enable_factory_create, db_session, internal_admin_user):
    """Test updating a form with form_type, sgg_version, and is_deprecated"""
    form_id = uuid.uuid4()
    form_data = {
        "form_name": "Test Form with New Fields",
        "short_form_name": "test_form_new_fields",
        "form_version": "1.0",
        "agency_code": "TEST",
        "omb_number": "4040-0001",
        "form_json_schema": {"type": "object"},
        "form_ui_schema": [{"type": "field"}],
        "form_instruction_id": None,
        "form_rule_schema": None,
        "form_type": FormType.SF424,
        "sgg_version": "1.0",
        "is_deprecated": False,
    }

    with db_session.begin():
        form = update_form(db_session, form_id, form_data, internal_admin_user)

    assert form.form_id == form_id
    assert form.form_type == FormType.SF424
    assert form.sgg_version == "1.0"
    assert form.is_deprecated is False


def test_update_form_with_null_new_fields(enable_factory_create, db_session, internal_admin_user):
    """Test updating a form with null values for new fields"""
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
        "form_type": None,
        "sgg_version": None,
        "is_deprecated": None,
    }

    with db_session.begin():
        form = update_form(db_session, form_id, form_data, internal_admin_user)

    assert form.form_type is None
    assert form.sgg_version is None
    assert form.is_deprecated is None
