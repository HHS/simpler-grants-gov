import uuid

import apiflask.exceptions
import pytest
from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import UserApiKey
from src.services.users.delete_api_key import delete_api_key
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


def test_delete_api_key_success(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key successfully deletes an API key."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, is_active=True)

    delete_api_key(db_session, user.user_id, api_key.api_key_id)

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is None


def test_delete_api_key_not_found_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key raises 404 when API key doesn't belong to the user."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user1, is_active=True)

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_api_key(db_session, user2.user_id, api_key.api_key_id)

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is not None


def test_delete_api_key_not_found_nonexistent(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key raises 404 when API key doesn't exist."""
    user = UserFactory.create()
    nonexistent_api_key_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        delete_api_key(db_session, user.user_id, nonexistent_api_key_id)

    assert exc_info.value.status_code == 404
    assert "API key not found" in exc_info.value.message


def test_delete_api_key_already_inactive(enable_factory_create, db_session: db.Session):
    """Test that delete_api_key can delete an already inactive API key."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, is_active=False)

    delete_api_key(db_session, user.user_id, api_key.api_key_id)

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is None


def test_delete_api_key_logging_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that delete_api_key logs appropriate success messages."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, is_active=True, key_name="Test Key")

    with caplog.at_level("INFO"):
        delete_api_key(db_session, user.user_id, api_key.api_key_id)

    assert any("Deleted API key" in record.message for record in caplog.records)

    log_record = next(record for record in caplog.records if "Deleted API key" in record.message)
    assert hasattr(log_record, "api_key_id")
    assert str(log_record.api_key_id) == str(api_key.api_key_id)
    assert hasattr(log_record, "user_id")
    assert str(log_record.user_id) == str(user.user_id)


def test_delete_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that deleting one API key doesn't affect other API keys for the same user."""
    user = UserFactory.create()
    api_key1 = UserApiKeyFactory.create(user=user, is_active=True, key_name="Key 1")
    api_key2 = UserApiKeyFactory.create(user=user, is_active=True, key_name="Key 2")

    delete_api_key(db_session, user.user_id, api_key1.api_key_id)

    db_api_key1 = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key1.api_key_id)
    ).scalar_one_or_none()
    db_api_key2 = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key2.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key1 is None
    assert db_api_key2 is not None
