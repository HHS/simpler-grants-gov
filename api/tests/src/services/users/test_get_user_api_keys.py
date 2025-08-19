from datetime import timedelta

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.services.users.get_user_api_keys import get_user_api_keys
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


def test_get_user_api_keys_empty_result(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns empty list when user has no API keys."""
    user = UserFactory.create()

    api_keys = get_user_api_keys(db_session, user.user_id)

    assert api_keys == []


def test_get_user_api_keys_single_key(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns single API key for user."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Test Key")

    api_keys = get_user_api_keys(db_session, user.user_id)

    assert len(api_keys) == 1
    assert api_keys[0].api_key_id == api_key.api_key_id
    assert api_keys[0].key_name == "Test Key"
    assert api_keys[0].user_id == user.user_id


def test_get_user_api_keys_multiple_keys(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys returns all API keys for user."""
    user = UserFactory.create()

    api_key1 = UserApiKeyFactory.create(
        user=user, key_name="First Key", created_at=datetime_util.utcnow() - timedelta(hours=2)
    )
    api_key2 = UserApiKeyFactory.create(
        user=user, key_name="Second Key", created_at=datetime_util.utcnow() - timedelta(hours=1)
    )
    api_key3 = UserApiKeyFactory.create(
        user=user, key_name="Third Key", created_at=datetime_util.utcnow()
    )

    api_keys = get_user_api_keys(db_session, user.user_id)

    assert len(api_keys) == 3

    assert api_keys[0].api_key_id == api_key3.api_key_id
    assert api_keys[1].api_key_id == api_key2.api_key_id
    assert api_keys[2].api_key_id == api_key1.api_key_id


def test_get_user_api_keys_only_users_keys(enable_factory_create, db_session: db.Session):
    """Test get_user_api_keys only returns keys for the specified user."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()

    user1_key = UserApiKeyFactory.create(user=user1, key_name="User 1 Key")
    user2_key = UserApiKeyFactory.create(user=user2, key_name="User 2 Key")

    user1_keys = get_user_api_keys(db_session, user1.user_id)

    assert len(user1_keys) == 1
    assert user1_keys[0].api_key_id == user1_key.api_key_id
    assert user1_keys[0].key_name == "User 1 Key"

    user2_keys = get_user_api_keys(db_session, user2.user_id)

    assert len(user2_keys) == 1
    assert user2_keys[0].api_key_id == user2_key.api_key_id
    assert user2_keys[0].key_name == "User 2 Key"
