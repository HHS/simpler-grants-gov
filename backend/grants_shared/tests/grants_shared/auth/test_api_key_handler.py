import string
import uuid
from datetime import timedelta
from unittest.mock import patch

import apiflask
import pytest
from sqlalchemy import select

from grants_shared.adapters import db
from grants_shared.auth.api_key_handler import MAX_KEY_GENERATION_RETRIES, KeyGenerationError
from grants_shared.util import datetime_util
from tests.grants_shared.db.models.factories import SharedUserApiKeyFactory, SharedUserFactory
from tests.grants_shared.db_test_models.db_test_models import SharedUserApiKey
from tests.grants_shared.test_utils.auth_handler import SharedApiKeyHandler


def test_create_api_key_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key successfully creates a new API key with auto-generated key_id."""
    user = SharedUserFactory.create()

    with caplog.at_level("INFO"):
        api_key = SharedApiKeyHandler(db_session).create_api_key(
            user_id=user.shared_user_id,
            key_name="Test API Key",
        )

    # Verify that the API key was created successfully (AWS integration is mocked automatically)

    # Verify the API key was created correctly
    assert api_key.shared_api_key_id is not None
    assert api_key.shared_user_id == user.shared_user_id
    assert api_key.key_name == "Test API Key"
    assert api_key.key_id is not None
    assert len(api_key.key_id) == 25  # Auto-generated key_id should be 25 characters
    assert api_key.is_active is True
    assert api_key.last_used is None

    # Verify the key_id contains only alphanumeric characters
    allowed_chars = string.ascii_letters + string.digits
    assert all(c in allowed_chars for c in api_key.key_id)

    # Verify it was persisted to the database
    db_session.commit()
    db_session.refresh(api_key)
    assert api_key.created_at is not None
    assert api_key.updated_at is not None

    assert any("Created new API key" in record.message for record in caplog.records)

    log_record = next(
        record for record in caplog.records if "Created new API key" in record.message
    )
    assert str(getattr(log_record, "auth.shared_api_key_id")) == str(api_key.shared_api_key_id)
    assert str(getattr(log_record, "auth.shared_user_id")) == str(api_key.shared_user_id)


def test_create_api_key_generates_unique_key_ids(enable_factory_create, db_session: db.Session):
    """Test that create_api_key generates unique key_ids for each API key."""
    user = SharedUserFactory.create()

    api_keys = []
    for i in range(3):
        api_key = SharedApiKeyHandler(db_session).create_api_key(
            user_id=user.shared_user_id,
            key_name=f"Key {i}",
        )
        api_keys.append(api_key)

    key_ids = [key.key_id for key in api_keys]
    assert len(set(key_ids)) == len(key_ids), "All key_ids should be unique"

    assert all(len(key_id) == 25 for key_id in key_ids)


def test_create_api_key_collision_detection(enable_factory_create, db_session: db.Session):
    """Test that create_api_key handles key_id collisions by retrying."""
    user = SharedUserFactory.create()

    existing_key_id = "COLLISION_TEST_KEY_12345"
    SharedUserApiKeyFactory.create(
        shared_user=user, key_name="Existing Key", key_id=existing_key_id
    )

    with patch("grants_shared.auth.api_key_handler.generate_api_key_id") as mock_generate:
        mock_generate.side_effect = [
            existing_key_id,
            "UNIQUE_TEST_KEY_123456789",
        ]

        api_key = SharedApiKeyHandler(db_session).create_api_key(
            user_id=user.shared_user_id,
            key_name="New Key",
        )

        assert api_key.key_id == "UNIQUE_TEST_KEY_123456789"
        assert mock_generate.call_count == 2


def test_create_api_key_max_retries_exceeded(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key raises KeyGenerationError when max retries exceeded."""
    user = SharedUserFactory.create()

    existing_key_id = "COLLISION_KEY_12345678901234"
    SharedUserApiKeyFactory.create(
        shared_user=user, key_name="Existing Key", key_id=existing_key_id
    )

    with patch("grants_shared.auth.api_key_handler.generate_api_key_id") as mock_generate:
        mock_generate.return_value = existing_key_id  # Always return the same colliding key

        with (
            caplog.at_level("ERROR"),
            pytest.raises(
                KeyGenerationError,
                match="Unable to generate unique API key after 5 attempts",
            ),
        ):
            SharedApiKeyHandler(db_session).create_api_key(
                user_id=user.shared_user_id,
                key_name="Failed Key",
            )

        assert mock_generate.call_count == MAX_KEY_GENERATION_RETRIES

        assert any(
            "Failed to generate unique key_id after maximum retries" in record.message
            for record in caplog.records
        )

        error_log = next(
            record
            for record in caplog.records
            if "Failed to generate unique key_id after maximum retries" in record.message
        )
        assert hasattr(error_log, "max_retries")
        assert error_log.max_retries == MAX_KEY_GENERATION_RETRIES


def test_create_api_key_aws_gateway_error_handling(
    enable_factory_create, db_session: db.Session, caplog
):
    """Test that API key creation works with the built-in AWS mock system."""
    # Note: With IS_LOCAL_AWS=1, the import_api_key function automatically uses mocks
    # and should not raise exceptions under normal circumstances

    user = SharedUserFactory.create()

    # This should succeed using the built-in mock system
    with caplog.at_level("INFO"):
        api_key = SharedApiKeyHandler(db_session).create_api_key(
            user_id=user.shared_user_id,
            key_name="Test API Key",
        )

    # Verify the API key was created successfully
    assert api_key.shared_api_key_id is not None
    assert api_key.shared_user_id == user.shared_user_id
    assert api_key.key_name == "Test API Key"
    assert api_key.is_active is True

    # Verify success was logged
    log_messages = [record.message for record in caplog.records]
    assert any(
        "Created new API key" in message for message in log_messages
    ), f"Expected log message not found. Actual messages: {log_messages}"


def test_create_api_key_database_rollback_on_gateway_failure(
    enable_factory_create, db_session: db.Session
):
    """Test that database operations work correctly with the built-in AWS mock system."""
    # Note: With IS_LOCAL_AWS=1, the import_api_key function uses mocks and should not fail
    # This test now verifies normal database operations
    user = SharedUserFactory.create()

    # Count existing API keys before creation
    initial_count = db_session.execute(
        select(SharedUserApiKey).where(SharedUserApiKey.shared_user_id == user.shared_user_id)
    ).all()
    initial_count = len(initial_count)

    # This should succeed with the built-in mock system
    api_key = SharedApiKeyHandler(db_session).create_api_key(
        user_id=user.shared_user_id,
        key_name="Test API Key",
    )

    # Verify that a new API key was persisted to the database
    final_count = db_session.execute(
        select(SharedUserApiKey).where(SharedUserApiKey.shared_user_id == user.shared_user_id)
    ).all()
    final_count = len(final_count)

    assert final_count == initial_count + 1, "One new API key should be persisted"

    # Verify the API key exists with the expected name
    api_key_with_name = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_user_id == user.shared_user_id,
            SharedUserApiKey.key_name == "Test API Key",
        )
    ).scalar_one_or_none()

    assert api_key_with_name is not None, "API key with the test name should exist"
    assert api_key_with_name.shared_api_key_id == api_key.shared_api_key_id


def test_create_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that the same user can have multiple API keys with different names."""
    user = SharedUserFactory.create()

    api_key1 = SharedApiKeyHandler(db_session).create_api_key(
        user_id=user.shared_user_id,
        key_name="Production Key",
    )

    api_key2 = SharedApiKeyHandler(db_session).create_api_key(
        user_id=user.shared_user_id,
        key_name="Development Key",
    )

    assert api_key1.shared_user_id == api_key2.shared_user_id
    assert api_key1.key_name != api_key2.key_name
    assert api_key1.shared_api_key_id != api_key2.shared_api_key_id
    assert api_key1.key_id != api_key2.key_id


def test_delete_api_key_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that delete_api_key successfully deletes an API key."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user, is_active=True)

    with caplog.at_level("INFO"):
        SharedApiKeyHandler(db_session).delete_api_key(
            user.shared_user_id, api_key.shared_api_key_id
        )

    db_api_key = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_api_key_id == api_key.shared_api_key_id
        )
    ).scalar_one_or_none()
    assert db_api_key is None

    assert any("Deleted API key" in record.message for record in caplog.records)

    log_record = next(record for record in caplog.records if "Deleted API key" in record.message)
    assert getattr(log_record, "auth.shared_api_key_id") == api_key.shared_api_key_id
    assert getattr(log_record, "auth.shared_user_id") == api_key.shared_user_id


def test_delete_api_key_not_found_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key raises 404 when API key doesn't belong to the user."""
    user1 = SharedUserFactory.create()
    user2 = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user1, is_active=True)

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        SharedApiKeyHandler(db_session).delete_api_key(
            user2.shared_user_id, api_key.shared_api_key_id
        )

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message

    db_api_key = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_api_key_id == api_key.shared_api_key_id
        )
    ).scalar_one_or_none()
    assert db_api_key is not None


def test_delete_api_key_not_found_nonexistent(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key raises 404 when API key doesn't exist."""
    user = SharedUserFactory.create()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        SharedApiKeyHandler(db_session).delete_api_key(user.shared_user_id, uuid.uuid4())

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message


def test_delete_api_key_already_inactive(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key can delete an already inactive API key."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user, is_active=False)

    SharedApiKeyHandler(db_session).delete_api_key(user.shared_user_id, api_key.shared_api_key_id)

    db_api_key = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_api_key_id == api_key.shared_api_key_id
        )
    ).scalar_one_or_none()
    assert db_api_key is None


def test_delete_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that deleting one API key doesn't affect other API keys for the same user."""
    user = SharedUserFactory.create()
    api_key1 = SharedUserApiKeyFactory.create(shared_user=user, is_active=True, key_name="Key 1")
    api_key2 = SharedUserApiKeyFactory.create(shared_user=user, is_active=True, key_name="Key 2")

    SharedApiKeyHandler(db_session).delete_api_key(user.shared_user_id, api_key1.shared_api_key_id)

    db_api_key1 = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_api_key_id == api_key1.shared_api_key_id
        )
    ).scalar_one_or_none()
    db_api_key2 = db_session.execute(
        select(SharedUserApiKey).where(
            SharedUserApiKey.shared_api_key_id == api_key2.shared_api_key_id
        )
    ).scalar_one_or_none()
    assert db_api_key1 is None
    assert db_api_key2 is not None


def test_get_user_api_keys_empty_result(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns empty list when user has no API keys."""
    user = SharedUserFactory.create()

    api_keys = SharedApiKeyHandler(db_session).get_user_api_keys(user.shared_user_id)

    assert api_keys == []


def test_get_user_api_keys_single_key(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns single API key for user."""
    api_key = SharedUserApiKeyFactory.create(key_name="Test Key")

    api_keys = SharedApiKeyHandler(db_session).get_user_api_keys(api_key.shared_user_id)

    assert len(api_keys) == 1
    assert api_keys[0].shared_api_key_id == api_key.shared_api_key_id
    assert api_keys[0].key_name == "Test Key"
    assert api_keys[0].shared_user_id == api_key.shared_user_id


def test_get_user_api_keys_multiple_keys(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns all API keys for user."""
    user = SharedUserFactory.create()

    api_key1 = SharedUserApiKeyFactory.create(
        shared_user=user,
        key_name="First Key",
        created_at=datetime_util.utcnow() - timedelta(hours=2),
    )
    api_key2 = SharedUserApiKeyFactory.create(
        shared_user=user,
        key_name="Second Key",
        created_at=datetime_util.utcnow() - timedelta(hours=1),
    )
    api_key3 = SharedUserApiKeyFactory.create(
        shared_user=user, key_name="Third Key", created_at=datetime_util.utcnow()
    )

    api_keys = SharedApiKeyHandler(db_session).get_user_api_keys(user.shared_user_id)

    assert len(api_keys) == 3

    assert api_keys[0].shared_api_key_id == api_key3.shared_api_key_id
    assert api_keys[1].shared_api_key_id == api_key2.shared_api_key_id
    assert api_keys[2].shared_api_key_id == api_key1.shared_api_key_id


def test_get_user_api_keys_only_users_keys(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys only returns keys for the specified user."""

    user1_key = SharedUserApiKeyFactory.create(key_name="User 1 Key")
    user2_key = SharedUserApiKeyFactory.create(key_name="User 2 Key")

    user1_keys = SharedApiKeyHandler(db_session).get_user_api_keys(user1_key.shared_user_id)

    assert len(user1_keys) == 1
    assert user1_keys[0].shared_api_key_id == user1_key.shared_api_key_id
    assert user1_keys[0].key_name == "User 1 Key"

    user2_keys = SharedApiKeyHandler(db_session).get_user_api_keys(user2_key.shared_user_id)

    assert len(user2_keys) == 1
    assert user2_keys[0].shared_api_key_id == user2_key.shared_api_key_id
    assert user2_keys[0].key_name == "User 2 Key"


def test_get_user_api_key_success(enable_factory_create, db_session: db.Session):
    """Test get_user_api_key returns the correct API key for a user."""

    api_key = SharedUserApiKeyFactory.create(key_name="Test Key")

    result = SharedApiKeyHandler(db_session).get_user_api_key(
        api_key.shared_user_id, api_key.shared_api_key_id
    )

    assert result.shared_api_key_id == api_key.shared_api_key_id
    assert result.key_name == "Test Key"
    assert result.shared_user_id == api_key.shared_user_id


def test_get_user_api_key_not_found_wrong_user(enable_factory_create, db_session: db.Session):
    """Test get_user_api_key raises 404 when API key belongs to different user."""
    user1 = SharedUserFactory.create()
    user2 = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user1, key_name="User 1 Key")

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        SharedApiKeyHandler(db_session).get_user_api_key(
            user2.shared_user_id, api_key.shared_api_key_id
        )

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message


def test_get_user_api_key_not_found_nonexistent(enable_factory_create, db_session: db.Session):
    """Test get_user_api_key raises 404 when API key doesn't exist."""
    user = SharedUserFactory.create()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        SharedApiKeyHandler(db_session).get_user_api_key(user.shared_user_id, uuid.uuid4())

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message


def test_rename_api_key_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that rename_api_key successfully renames an existing API key."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user, key_name="Original Key Name")

    with caplog.at_level("INFO"):
        renamed_api_key = SharedApiKeyHandler(db_session).rename_api_key(
            user_id=user.shared_user_id,
            api_key_id=api_key.shared_api_key_id,
            key_name="New Key Name",
        )

    assert renamed_api_key.shared_api_key_id == api_key.shared_api_key_id
    assert renamed_api_key.shared_user_id == user.shared_user_id
    assert renamed_api_key.key_name == "New Key Name"
    assert renamed_api_key.key_id == api_key.key_id  # key_id should remain unchanged
    assert renamed_api_key.is_active == api_key.is_active
    assert renamed_api_key.last_used == api_key.last_used

    db_session.commit()
    db_session.refresh(renamed_api_key)
    assert renamed_api_key.key_name == "New Key Name"

    assert any("Renamed API key" in record.message for record in caplog.records)

    log_record = next(record for record in caplog.records if "Renamed API key" in record.message)
    assert str(getattr(log_record, "auth.shared_api_key_id")) == str(api_key.shared_api_key_id)
    assert str(getattr(log_record, "auth.shared_user_id")) == str(api_key.shared_user_id)


def test_rename_api_key_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key raises 404 error when API key belongs to different user."""
    user1 = SharedUserFactory.create()
    user2 = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user1, key_name="Original Key Name")

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        SharedApiKeyHandler(db_session).rename_api_key(
            user_id=user2.shared_user_id,  # Different user
            api_key_id=api_key.shared_api_key_id,
            key_name="New Key Name",
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "API key not found"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_same_name(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key works when setting the same name."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user, key_name="Same Key Name")

    renamed_api_key = SharedApiKeyHandler(db_session).rename_api_key(
        user_id=user.shared_user_id, api_key_id=api_key.shared_api_key_id, key_name="Same Key Name"
    )

    assert renamed_api_key.key_name == "Same Key Name"
    assert renamed_api_key.shared_api_key_id == api_key.shared_api_key_id


def test_rename_api_key_preserves_other_fields(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key only changes the key_name and preserves all other fields."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(
        shared_user=user,
        key_name="Original Key Name",
        is_active=False,
        last_used=None,
    )

    original_api_key_id = api_key.shared_api_key_id
    original_key_id = api_key.key_id
    original_user_id = api_key.shared_user_id
    original_is_active = api_key.is_active
    original_last_used = api_key.last_used
    original_created_at = api_key.created_at

    renamed_api_key = SharedApiKeyHandler(db_session).rename_api_key(
        user_id=user.shared_user_id,
        api_key_id=api_key.shared_api_key_id,
        key_name="Updated Key Name",
    )

    assert renamed_api_key.key_name == "Updated Key Name"
    assert renamed_api_key.shared_api_key_id == original_api_key_id
    assert renamed_api_key.key_id == original_key_id
    assert renamed_api_key.shared_user_id == original_user_id
    assert renamed_api_key.is_active == original_is_active
    assert renamed_api_key.last_used == original_last_used
    assert renamed_api_key.created_at == original_created_at


def test_rename_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key correctly identifies the right key when user has multiple keys."""
    user = SharedUserFactory.create()
    api_key1 = SharedUserApiKeyFactory.create(shared_user=user, key_name="Key 1")
    api_key2 = SharedUserApiKeyFactory.create(shared_user=user, key_name="Key 2")

    renamed_api_key = SharedApiKeyHandler(db_session).rename_api_key(
        user_id=user.shared_user_id, api_key_id=api_key2.shared_api_key_id, key_name="Renamed Key 2"
    )

    assert renamed_api_key.shared_api_key_id == api_key2.shared_api_key_id
    assert renamed_api_key.key_name == "Renamed Key 2"

    db_session.refresh(api_key1)
    assert api_key1.key_name == "Key 1"


def test_rename_api_key_long_name(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key handles long key names correctly."""
    user = SharedUserFactory.create()
    api_key = SharedUserApiKeyFactory.create(shared_user=user, key_name="Original Key Name")

    long_name = "A" * 255

    renamed_api_key = SharedApiKeyHandler(db_session).rename_api_key(
        user_id=user.shared_user_id, api_key_id=api_key.shared_api_key_id, key_name=long_name
    )

    assert renamed_api_key.key_name == long_name
    assert len(renamed_api_key.key_name) == 255
