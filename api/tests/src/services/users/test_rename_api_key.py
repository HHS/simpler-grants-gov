import apiflask.exceptions
import pytest

from src.adapters import db
from src.services.users.rename_api_key import rename_api_key
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


def test_rename_api_key_success(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key successfully renames an existing API key."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": "New Key Name"}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.api_key_id == api_key.api_key_id
    assert renamed_api_key.user_id == user.user_id
    assert renamed_api_key.key_name == "New Key Name"
    assert renamed_api_key.key_id == api_key.key_id  # key_id should remain unchanged
    assert renamed_api_key.is_active == api_key.is_active
    assert renamed_api_key.last_used == api_key.last_used

    db_session.commit()
    db_session.refresh(renamed_api_key)
    assert renamed_api_key.key_name == "New Key Name"


def test_rename_api_key_wrong_user(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key raises 404 error when API key belongs to different user."""
    user1 = UserFactory.create()
    user2 = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user1, key_name="Original Key Name")
    json_data = {"key_name": "New Key Name"}

    with pytest.raises(apiflask.exceptions.HTTPError) as exc_info:
        rename_api_key(
            db_session=db_session,
            user_id=user2.user_id,  # Different user
            api_key_id=api_key.api_key_id,
            json_data=json_data,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "API key not found"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_same_name(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key works when setting the same name."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Same Key Name")
    json_data = {"key_name": "Same Key Name"}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.key_name == "Same Key Name"
    assert renamed_api_key.api_key_id == api_key.api_key_id


def test_rename_api_key_preserves_other_fields(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key only changes the key_name and preserves all other fields."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(
        user=user,
        key_name="Original Key Name",
        is_active=False,
        last_used=None,
    )

    original_api_key_id = api_key.api_key_id
    original_key_id = api_key.key_id
    original_user_id = api_key.user_id
    original_is_active = api_key.is_active
    original_last_used = api_key.last_used
    original_created_at = api_key.created_at

    json_data = {"key_name": "Updated Key Name"}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.key_name == "Updated Key Name"
    assert renamed_api_key.api_key_id == original_api_key_id
    assert renamed_api_key.key_id == original_key_id
    assert renamed_api_key.user_id == original_user_id
    assert renamed_api_key.is_active == original_is_active
    assert renamed_api_key.last_used == original_last_used
    assert renamed_api_key.created_at == original_created_at


def test_rename_api_key_logging_success(enable_factory_create, db_session: db.Session, caplog):
    """Test that rename_api_key logs appropriate success messages."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": "New Key Name"}

    with caplog.at_level("INFO"):
        rename_api_key(
            db_session=db_session,
            user_id=user.user_id,
            api_key_id=api_key.api_key_id,
            json_data=json_data,
        )

    assert any("Renamed API key" in record.message for record in caplog.records)

    log_record = next(record for record in caplog.records if "Renamed API key" in record.message)
    assert hasattr(log_record, "api_key_id")
    assert str(log_record.api_key_id) == str(api_key.api_key_id)
    assert hasattr(log_record, "user_id")
    assert str(log_record.user_id) == str(user.user_id)


def test_rename_api_key_multiple_keys_same_user(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key correctly identifies the right key when user has multiple keys."""
    user = UserFactory.create()
    api_key1 = UserApiKeyFactory.create(user=user, key_name="Key 1")
    api_key2 = UserApiKeyFactory.create(user=user, key_name="Key 2")

    json_data = {"key_name": "Renamed Key 2"}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key2.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.api_key_id == api_key2.api_key_id
    assert renamed_api_key.key_name == "Renamed Key 2"

    db_session.refresh(api_key1)
    assert api_key1.key_name == "Key 1"


def test_rename_api_key_long_name(enable_factory_create, db_session: db.Session):
    """Test that rename_api_key handles long key names correctly."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")

    long_name = "A" * 255
    json_data = {"key_name": long_name}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.key_name == long_name
    assert len(renamed_api_key.key_name) == 255


def test_rename_api_key_empty_name_handled_by_schema(enable_factory_create, db_session: db.Session):
    """Test that empty key names are handled by schema validation (not by the service)."""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": ""}

    renamed_api_key = rename_api_key(
        db_session=db_session,
        user_id=user.user_id,
        api_key_id=api_key.api_key_id,
        json_data=json_data,
    )

    assert renamed_api_key.key_name == ""
