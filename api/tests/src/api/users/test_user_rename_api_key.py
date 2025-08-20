from sqlalchemy import select

from src.db.models.user_models import UserApiKey
from tests.src.db.models.factories import UserApiKeyFactory


def test_rename_api_key_success(enable_factory_create, db_session, client, user, user_auth_token):
    """Test successful API key renaming"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name", last_used=None)
    json_data = {"key_name": "Updated API Key Name"}

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 200

    response_data = response.json["data"]
    assert str(response_data["api_key_id"]) == str(api_key.api_key_id)
    assert response_data["key_name"] == "Updated API Key Name"
    assert response_data["key_id"] == api_key.key_id
    assert response_data["is_active"] == api_key.is_active
    assert response_data["last_used"] is None
    assert "created_at" in response_data

    db_session.expunge(api_key)

    updated_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()

    assert updated_api_key is not None
    assert updated_api_key.key_name == "Updated API Key Name"
    assert updated_api_key.user_id == user.user_id
    assert updated_api_key.key_id == api_key.key_id


def test_rename_api_key_validation_error_missing_key_name(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test validation error when key_name is missing"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {}

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_validation_error_long_key_name(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test validation error when key_name exceeds maximum length"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": "a" * 256}  # Exceeds 255 character limit

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_validation_error_empty_key_name(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test validation error when key_name is empty"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": ""}

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_unauthorized_different_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot rename API keys for other users"""
    other_user = UserApiKeyFactory.create().user
    api_key = UserApiKeyFactory.create(user=other_user, key_name="Original Key Name")
    json_data = {"key_name": "Updated API Key Name"}

    response = client.put(
        f"/v1/users/{other_user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_unauthorized_wrong_user_owns_key(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot rename API keys that belong to other users even with correct user_id in path"""
    other_user = UserApiKeyFactory.create().user
    api_key = UserApiKeyFactory.create(user=other_user, key_name="Original Key Name")
    json_data = {"key_name": "Updated API Key Name"}

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 404
    assert response.json["message"] == "API key not found"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_no_authentication(enable_factory_create, db_session, client, user):
    """Test that the endpoint requires authentication"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Original Key Name")
    json_data = {"key_name": "Updated API Key Name"}

    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        json=json_data,
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    db_session.refresh(api_key)
    assert api_key.key_name == "Original Key Name"


def test_rename_api_key_multiple_keys_same_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that renaming one API key doesn't affect other API keys for the same user"""
    api_key1 = UserApiKeyFactory.create(user=user, key_name="First API Key")
    api_key2 = UserApiKeyFactory.create(user=user, key_name="Second API Key")

    # Rename the second key
    json_data = {"key_name": "Renamed Second API Key"}
    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key2.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 200

    response_data = response.json["data"]
    assert response_data["key_name"] == "Renamed Second API Key"
    assert str(response_data["api_key_id"]) == str(api_key2.api_key_id)

    db_session.refresh(api_key1)
    assert api_key1.key_name == "First API Key"

    db_session.refresh(api_key2)
    assert api_key2.key_name == "Renamed Second API Key"


def test_rename_api_key_preserves_other_fields(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that renaming only changes the key_name and preserves other fields"""
    api_key = UserApiKeyFactory.create(
        user=user,
        key_name="Original Key Name",
        is_active=False,
        last_used=None,
    )

    original_key_id = api_key.key_id
    original_is_active = api_key.is_active
    original_last_used = api_key.last_used
    original_created_at = api_key.created_at

    json_data = {"key_name": "Updated Key Name"}
    response = client.put(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 200

    response_data = response.json["data"]
    assert response_data["key_name"] == "Updated Key Name"
    assert response_data["key_id"] == original_key_id
    assert response_data["is_active"] == original_is_active
    assert response_data["last_used"] == original_last_used

    db_session.refresh(api_key)
    assert api_key.key_name == "Updated Key Name"
    assert api_key.key_id == original_key_id
    assert api_key.is_active == original_is_active
    assert api_key.last_used == original_last_used
    assert api_key.created_at == original_created_at
