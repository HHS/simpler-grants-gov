import string
from unittest.mock import patch

import pytest

from src.adapters import db
from src.services.users.create_api_key import DuplicateKeyError, create_api_key
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


def test_create_api_key_success(enable_factory_create, db_session: db.Session):
    """Test that create_api_key successfully creates a new API key with auto-generated key_id."""
    user = UserFactory.create()
    key_name = "Test API Key"

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name=key_name,
        is_active=True,
    )

    # Verify the API key was created correctly
    assert api_key.api_key_id is not None
    assert api_key.user_id == user.user_id
    assert api_key.key_name == key_name
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

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name="Default Active Key",
    )

    assert api_key.is_active is True


def test_create_api_key_inactive(enable_factory_create, db_session: db.Session):
    """Test that create_api_key can create inactive keys."""
    user = UserFactory.create()

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name="Inactive Key",
        is_active=False,
    )

    assert api_key.is_active is False


def test_create_api_key_duplicate_raises_error(enable_factory_create, db_session: db.Session):
    """Test that attempting to create a duplicate (user_id, key_name) raises DuplicateKeyError."""
    user = UserFactory.create()
    key_name = "Duplicate Key Name"

    # Create the first API key using the factory
    UserApiKeyFactory.create(
        user=user,
        key_name=key_name,
    )

    # Attempt to create another API key with the same user_id and key_name
    with pytest.raises(
        DuplicateKeyError,
        match=f"API key with name '{key_name}' already exists for user {user.user_id}",
    ):
        create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            key_name=key_name,
        )


def test_create_api_key_same_name_different_users(enable_factory_create, db_session: db.Session):
    """Test that the same key name can be used by different users."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    key_name = "Same Key Name"

    # Create API key for first user
    api_key1 = create_api_key(
        db_session=db_session,
        user_id=user1.user_id,
        key_name=key_name,
    )

    # Create API key for second user with the same name - should succeed
    api_key2 = create_api_key(
        db_session=db_session,
        user_id=user2.user_id,
        key_name=key_name,
    )

    assert api_key1.user_id != api_key2.user_id
    assert api_key1.key_name == api_key2.key_name
    assert api_key1.api_key_id != api_key2.api_key_id
    assert api_key1.key_id != api_key2.key_id  # Different auto-generated key_ids


def test_create_api_key_different_names_same_user(enable_factory_create, db_session: db.Session):
    """Test that the same user can have multiple API keys with different names."""
    user = UserFactory.create()

    # Create first API key
    api_key1 = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name="Production Key",
    )

    # Create second API key for the same user - should succeed
    api_key2 = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name="Development Key",
    )

    assert api_key1.user_id == api_key2.user_id
    assert api_key1.key_name != api_key2.key_name
    assert api_key1.api_key_id != api_key2.api_key_id
    assert api_key1.key_id != api_key2.key_id  # Different auto-generated key_ids


@patch("src.services.users.create_api_key.generate_api_key_id")
def test_create_api_key_uses_key_generator(
    mock_generate, enable_factory_create, db_session: db.Session
):
    """Test that create_api_key uses the generate_api_key_id utility."""
    mock_generate.return_value = "TestGeneratedKey123456789"
    user = UserFactory.create()

    api_key = create_api_key(
        db_session=db_session,
        user_id=user.user_id,
        key_name="Test Key",
    )

    # Verify the mock was called
    mock_generate.assert_called_once()

    # Verify the generated key was used
    assert api_key.key_id == "TestGeneratedKey123456789"


def test_create_api_key_generates_unique_key_ids(enable_factory_create, db_session: db.Session):
    """Test that create_api_key generates unique key_ids for each API key."""
    user = UserFactory.create()

    # Create multiple API keys
    api_keys = []
    for i in range(5):
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            key_name=f"Key {i}",
        )
        api_keys.append(api_key)

    # Verify all key_ids are unique
    key_ids = [key.key_id for key in api_keys]
    assert len(set(key_ids)) == len(key_ids), "All key_ids should be unique"

    # Verify all key_ids are 25 characters
    assert all(len(key_id) == 25 for key_id in key_ids)


def test_create_api_key_logging(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key logs appropriate messages."""
    user = UserFactory.create()
    key_name = "Logging Test Key"

    with caplog.at_level("INFO"):
        api_key = create_api_key(
            db_session=db_session,
            user_id=user.user_id,
            key_name=key_name,
        )

    # Check that success log was written
    assert any("Created new API key" in record.message for record in caplog.records)

    # Check log contains correct information
    log_record = next(
        record for record in caplog.records if "Created new API key" in record.message
    )
    assert str(api_key.api_key_id) in str(log_record)
    assert str(user.user_id) in str(log_record)
    assert key_name in str(log_record)


def test_create_api_key_duplicate_logging(enable_factory_create, db_session: db.Session, caplog):
    """Test that create_api_key logs warning for duplicate attempts."""
    user = UserFactory.create()
    key_name = "Duplicate Logging Test"

    # Create first key
    UserApiKeyFactory.create(user=user, key_name=key_name)

    with caplog.at_level("WARNING"):
        with pytest.raises(DuplicateKeyError):
            create_api_key(
                db_session=db_session,
                user_id=user.user_id,
                key_name=key_name,
            )

    # Check that warning log was written
    assert any(
        "Attempted to create duplicate API key" in record.message for record in caplog.records
    )

    # Check log contains correct information
    log_record = next(
        record
        for record in caplog.records
        if "Attempted to create duplicate API key" in record.message
    )
    assert str(user.user_id) in str(log_record)
    assert key_name in str(log_record)
