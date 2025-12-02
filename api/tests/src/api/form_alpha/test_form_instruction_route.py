import io
import uuid

import pytest
from werkzeug.datastructures import FileStorage

import src.adapters.db as db
import src.util.file_util as file_util
from src.db.models.competition_models import FormInstruction
from tests.src.db.models.factories import FormFactory, FormInstructionFactory


@pytest.fixture
def form_instruction_file():
    return FileStorage(
        stream=io.BytesIO(b"test content"),
        filename="instructions.pdf",
        content_type="application/pdf",
    )


def test_form_instruction_upsert_create_new(
    client,
    db_session: db.Session,
    form_instruction_file,
    enable_factory_create,
    internal_admin_user_api_key,
    mock_s3_bucket,
):
    form = FormFactory.create()
    form_instruction_id = uuid.uuid4()

    # Execute
    resp = client.put(
        f"/alpha/forms/{form.form_id}/form_instructions/{form_instruction_id}",
        data={"file": form_instruction_file},
        content_type="multipart/form-data",
        headers={"X-API-Key": internal_admin_user_api_key},
    )

    # Verify
    assert resp.status_code == 200

    # Check DB
    instruction = db_session.get(FormInstruction, form_instruction_id)
    assert instruction is not None
    assert instruction.file_name == "instructions.pdf"
    assert f"forms/{form.form_id}/instructions/instructions.pdf" in instruction.file_location

    # Verify file was actually written to S3
    assert file_util.file_exists(instruction.file_location)
    file_content = file_util.read_file(instruction.file_location)
    assert file_content == "test content"


def test_form_instruction_upsert_update_existing(
    client,
    db_session: db.Session,
    form_instruction_file,
    enable_factory_create,
    internal_admin_user_api_key,
    mock_s3_bucket,
):
    form = FormFactory.create()
    existing_instruction = FormInstructionFactory.create()
    old_location = f"s3://{mock_s3_bucket}/old/path/file.pdf"
    existing_instruction.file_location = old_location
    db_session.add(existing_instruction)
    db_session.commit()

    # Create the old file in S3 so we can verify it gets deleted
    file_util.write_to_file(old_location, "old content")
    assert file_util.file_exists(old_location)

    # Execute
    resp = client.put(
        f"/alpha/forms/{form.form_id}/form_instructions/{existing_instruction.form_instruction_id}",
        data={"file": form_instruction_file},
        content_type="multipart/form-data",
        headers={"X-API-Key": internal_admin_user_api_key},
    )

    # Verify
    assert resp.status_code == 200

    # Check DB
    db_session.refresh(existing_instruction)
    assert existing_instruction.file_name == "instructions.pdf"
    assert (
        f"forms/{form.form_id}/instructions/instructions.pdf" in existing_instruction.file_location
    )

    # Verify new file was written to S3
    assert file_util.file_exists(existing_instruction.file_location)
    new_content = file_util.read_file(existing_instruction.file_location)
    assert new_content == "test content"

    # Verify old file was deleted from S3
    assert not file_util.file_exists(old_location)


def test_form_instruction_upsert_no_auth(client, db_session: db.Session, form_instruction_file):
    form_id = uuid.uuid4()
    form_instruction_id = uuid.uuid4()

    resp = client.put(
        f"/alpha/forms/{form_id}/form_instructions/{form_instruction_id}",
        data={"file": form_instruction_file},
        content_type="multipart/form-data",
    )

    assert resp.status_code == 401


def test_form_instruction_upsert_wrong_privilege(
    client, db_session: db.Session, form_instruction_file, enable_factory_create, user_api_key
):
    # user_api_key fixture creates a user without UPDATE_FORM privilege
    form_id = uuid.uuid4()
    form_instruction_id = uuid.uuid4()

    resp = client.put(
        f"/alpha/forms/{form_id}/form_instructions/{form_instruction_id}",
        data={"file": form_instruction_file},
        content_type="multipart/form-data",
        headers={"X-API-Key": user_api_key.key_id},
    )

    assert resp.status_code == 403
