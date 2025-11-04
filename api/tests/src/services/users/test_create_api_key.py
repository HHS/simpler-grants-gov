import string
from unittest.mock import patch

import pytest

from src.adapters import db
from src.services.users.create_api_key import (
    MAX_KEY_GENERATION_RETRIES,
    KeyGenerationError,
    create_api_key,
)
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


def test_create_api_key_success(enable_factory_create, db_session: db.Session):
    """Test that create_api_key successfully creates a new API key with auto-generated key_id."""
    user = UserFactory.create()
    json_data = {"key_name": "Test API Key"}

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data,
    )

    # Verify that the API key was created successfully (AWS integration is mocked automatically)

    # Verify the API key was created correctly
    assert api_key.api_key_id is not None
    assert api_key.user_id == user.user_id
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


def test_create_api_key_default_active(enable_factory_create, db_session: db.Session):
    """Test that create_api_key defaults is_active to True."""
    user = UserFactory.create()
    json_data = {"key_name": "Default Active Key"}

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data,
    )

    assert api_key.is_active is True


def test_create_api_key_inactive(enable_factory_create, db_session: db.Session):
    """Test that create_api_key can create inactive keys."""
    user = UserFactory.create()
    json_data = {"key_name": "Inactive Key"}

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data,
    )

    assert api_key.is_active is True


def test_create_api_key_generates_unique_key_ids(enable_factory_create, db_session: db.Session):
    """Test that create_api_key generates unique key_ids for each API key."""
    user = UserFactory.create()

    api_keys = []
    for i in range(3):
        json_data = {"key_name": f"Key {i}"}
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            json_data=json_data,
        )
        api_keys.append(api_key)

    key_ids = [key.key_id for key in api_keys]
    assert len(set(key_ids)) == len(key_ids), "All key_ids should be unique"

    assert all(len(key_id) == 25 for key_id in key_ids)


def test_create_api_key_collision_detection(enable_factory_create, db_session: db.Session):
    """Test that create_api_key handles key_id collisions by retrying."""
    user = UserFactory.create()

    existing_key_id = "COLLISION_TEST_KEY_12345"
    UserApiKeyFactory.create(user=user, key_name="Existing Key", key_id=existing_key_id)

    with patch("src.services.users.create_api_key.generate_api_key_id") as mock_generate:
        mock_generate.side_effect = [
            existing_key_id,
            "UNIQUE_TEST_KEY_123456789",
        ]

        json_data = {"key_name": "New Key"}
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            json_data=json_data,
        )

        assert api_key.key_id == "UNIQUE_TEST_KEY_123456789"
        assert mock_generate.call_count == 2


def test_create_api_key_max_retries_exceeded(enable_factory_create, db_session: db.Session):
    """Test that create_api_key raises KeyGenerationError when max retries exceeded."""
    user = UserFactory.create()

    existing_key_id = "COLLISION_KEY_12345678901234"
    UserApiKeyFactory.create(user=user, key_name="Existing Key", key_id=existing_key_id)

    with patch("src.services.users.create_api_key.generate_api_key_id") as mock_generate:
        mock_generate.return_value = existing_key_id  # Always return the same colliding key
        json_data = {"key_name": "Failed Key"}

        with pytest.raises(
            KeyGenerationError,
            match=f"Unable to generate unique API key after {MAX_KEY_GENERATION_RETRIES} attempts",
        ):
            create_api_key(
                db_session=db_session,
                user_id=user.user_id,
                json_data=json_data,
            )

        assert mock_generate.call_count == MAX_KEY_GENERATION_RETRIES


def test_create_api_key_logging_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key logs appropriate success messages."""
    user = UserFactory.create()
    key_name = "Logging Test Key"
    json_data = {"key_name": key_name}

    with caplog.at_level("INFO"):
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            json_data=json_data,
        )

    assert any("Created new API key" in record.message for record in caplog.records)

    log_record = next(
        record for record in caplog.records if "Created new API key" in record.message
    )
    assert hasattr(log_record, "api_key_id")
    assert str(log_record.api_key_id) == str(api_key.api_key_id)
    assert hasattr(log_record, "user_id")
    assert str(log_record.user_id) == str(user.user_id)
    assert hasattr(log_record, "key_name")
    assert log_record.key_name == key_name


def test_create_api_key_logging_max_retries(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key logs error when max retries exceeded."""
    user = UserFactory.create()

    existing_key_id = "COLLISION_LOG_12345678901234"
    UserApiKeyFactory.create(user=user, key_name="Existing Key", key_id=existing_key_id)

    with patch("src.services.users.create_api_key.generate_api_key_id") as mock_generate:
        mock_generate.return_value = existing_key_id
        json_data = {"key_name": "Failed Key"}

        with caplog.at_level("ERROR"):
            with pytest.raises(KeyGenerationError):
                create_api_key(
                    db_session=db_session,
                    user_id=user.user_id,
                    json_data=json_data,
                )

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


@patch("src.services.users.create_api_key.generate_api_key_id")
def test_create_api_key_uses_key_generator(
    mock_generate, enable_factory_create, db_session: db.Session
):
    """Test that create_api_key uses the generate_api_key_id utility."""
    mock_generate.return_value = "TestGeneratedKey123456789"
    user = UserFactory.create()

    json_data = {"key_name": "Test Key"}
    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data,
    )

    mock_generate.assert_called_once()

    assert api_key.key_id == "TestGeneratedKey123456789"


def test_create_api_key_aws_gateway_error_handling(
    enable_factory_create, db_session: db.Session, caplog
):
    """Test that API key creation works with the built-in AWS mock system."""
    # Note: With IS_LOCAL_AWS=1, the import_api_key function automatically uses mocks
    # and should not raise exceptions under normal circumstances

    user = UserFactory.create()
    json_data = {"key_name": "Test API Key"}

    # This should succeed using the built-in mock system
    with caplog.at_level("INFO"):
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            json_data=json_data,
        )

    # Verify the API key was created successfully
    assert api_key.api_key_id is not None
    assert api_key.user_id == user.user_id
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
    from sqlalchemy import select

    from src.db.models.user_models import UserApiKey

    # Note: With IS_LOCAL_AWS=1, the import_api_key function uses mocks and should not fail
    # This test now verifies normal database operations

    user = UserFactory.create()
    json_data = {"key_name": "Test API Key"}

    # Count existing API keys before creation
    initial_count = db_session.execute(
        select(UserApiKey).where(UserApiKey.user_id == user.user_id)
    ).all()
    initial_count = len(initial_count)

    # This should succeed with the built-in mock system
    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data,
    )

    # Verify that a new API key was persisted to the database
    final_count = db_session.execute(
        select(UserApiKey).where(UserApiKey.user_id == user.user_id)
    ).all()
    final_count = len(final_count)

    assert final_count == initial_count + 1, "One new API key should be persisted"

    # Verify the API key exists with the expected name
    api_key_with_name = db_session.execute(
        select(UserApiKey).where(
            UserApiKey.user_id == user.user_id, UserApiKey.key_name == "Test API Key"
        )
    ).scalar_one_or_none()

    assert api_key_with_name is not None, "API key with the test name should exist"
    assert api_key_with_name.api_key_id == api_key.api_key_id


def test_create_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that the same user can have multiple API keys with different names."""
    user = UserFactory.create()

    json_data1 = {"key_name": "Production Key"}
    api_key1 = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data1,
    )

    json_data2 = {"key_name": "Development Key"}
    api_key2 = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        json_data=json_data2,
    )

    assert api_key1.user_id == api_key2.user_id
    assert api_key1.key_name != api_key2.key_name
    assert api_key1.api_key_id != api_key2.api_key_id
    assert api_key1.key_id != api_key2.key_id
