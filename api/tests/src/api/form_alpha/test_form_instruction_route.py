import io
import uuid
from unittest.mock import MagicMock, patch

import pytest
from werkzeug.datastructures import FileStorage

import src.adapters.db as db
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import FormInstruction
from tests.src.db.models.factories import (
    FormFactory,
    FormInstructionFactory,
    InternalUserRoleFactory,
    UserApiKeyFactory,
    UserFactory,
)


@pytest.fixture
def form_instruction_file():
    return FileStorage(
        stream=io.BytesIO(b"test content"),
        filename="instructions.pdf",
        content_type="application/pdf",
    )


def test_form_instruction_upsert_create_new(
    client, db_session: db.Session, form_instruction_file, enable_factory_create
):
    # Setup user with privilege
    user = UserFactory.create()
    InternalUserRoleFactory.create(user=user, role__privileges=[Privilege.UPDATE_FORM])
    api_key = UserApiKeyFactory.create(user=user)

    form = FormFactory.create()
    form_instruction_id = uuid.uuid4()

    # Mock S3
    with patch("src.util.file_util.open_stream") as mock_open_stream:
        mock_file = MagicMock(spec=io.BytesIO)
        mock_open_stream.return_value.__enter__.return_value = mock_file

        # Execute
        resp = client.put(
            f"/alpha/forms/{form.form_id}/form_instructions/{form_instruction_id}",
            data={"file": form_instruction_file},
            content_type="multipart/form-data",
            headers={"X-API-Key": api_key.key_id},
        )

        # Verify
        assert resp.status_code == 200

        # Check DB
        instruction = db_session.get(FormInstruction, form_instruction_id)
        assert instruction is not None
        assert instruction.file_name == "instructions.pdf"
        assert f"forms/{form.form_id}/instructions/instructions.pdf" in instruction.file_location

        # Check S3 upload
        mock_open_stream.assert_called()


def test_form_instruction_upsert_update_existing(
    client, db_session: db.Session, form_instruction_file, enable_factory_create
):
    # Setup user with privilege
    user = UserFactory.create()
    InternalUserRoleFactory.create(user=user, role__privileges=[Privilege.UPDATE_FORM])
    api_key = UserApiKeyFactory.create(user=user)

    form = FormFactory.create()
    existing_instruction = FormInstructionFactory.create()
    existing_instruction.file_location = "s3://bucket/old/path/file.pdf"
    db_session.add(existing_instruction)
    db_session.commit()

    # Mock S3 and delete_file
    with patch("src.util.file_util.open_stream") as mock_open_stream, patch(
        "src.util.file_util.delete_file"
    ) as mock_delete_file:

        mock_file = MagicMock(spec=io.BytesIO)
        mock_open_stream.return_value.__enter__.return_value = mock_file

        # Execute
        resp = client.put(
            f"/alpha/forms/{form.form_id}/form_instructions/{existing_instruction.form_instruction_id}",
            data={"file": form_instruction_file},
            content_type="multipart/form-data",
            headers={"X-API-Key": api_key.key_id},
        )

        # Verify
        assert resp.status_code == 200

        # Check DB
        db_session.refresh(existing_instruction)
        assert existing_instruction.file_name == "instructions.pdf"
        assert (
            f"forms/{form.form_id}/instructions/instructions.pdf"
            in existing_instruction.file_location
        )

        # Check old file deleted
        mock_delete_file.assert_called_with("s3://bucket/old/path/file.pdf")


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
    client, db_session: db.Session, form_instruction_file, enable_factory_create
):
    # User without UPDATE_FORM
    user = UserFactory.create()
    # Give some other privilege
    InternalUserRoleFactory.create(user=user, role__privileges=[Privilege.VIEW_APPLICATION])
    api_key = UserApiKeyFactory.create(user=user)

    form_id = uuid.uuid4()
    form_instruction_id = uuid.uuid4()

    resp = client.put(
        f"/alpha/forms/{form_id}/form_instructions/{form_instruction_id}",
        data={"file": form_instruction_file},
        content_type="multipart/form-data",
        headers={"X-API-Key": api_key.key_id},
    )

    assert resp.status_code == 403
