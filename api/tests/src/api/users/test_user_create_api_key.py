import uuid

from sqlalchemy import select

from src.db.models.user_models import UserApiKey


def test_create_api_key_success(enable_factory_create, db_session, client, user, user_auth_token):
    """Test successful API key creation"""
    json_data = {"key_name": "Test API Key"}

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 200

    response_data = response.json["data"]
    assert "api_key_id" in response_data
    assert response_data["key_name"] == "Test API Key"
    assert "key_id" in response_data
    assert response_data["is_active"] is True
    assert "created_at" in response_data
    assert response_data["last_used"] is None

    # Verify the key_id is a 25-character string
    assert len(response_data["key_id"]) == 25
    assert response_data["key_id"].isalnum()

    # Verify it's in the database
    api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == response_data["api_key_id"])
    ).scalar_one_or_none()

    assert api_key is not None
    assert str(api_key.api_key_id) == response_data["api_key_id"]
    assert api_key.key_name == "Test API Key"
    assert api_key.user_id == user.user_id
    assert api_key.is_active is True
    assert api_key.last_used is None


def test_create_api_key_validation_error_missing_key_name(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test validation error when key_name is missing"""
    json_data = {}

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    # Verify no API key was created in the database
    api_keys = (
        db_session.execute(select(UserApiKey).where(UserApiKey.user_id == user.user_id))
        .scalars()
        .all()
    )
    assert len(api_keys) == 0


def test_create_api_key_validation_error_long_key_name(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test validation error when key_name exceeds maximum length"""
    json_data = {"key_name": "a" * 256}  # Exceeds 255 character limit

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    # Verify no API key was created in the database
    api_keys = (
        db_session.execute(select(UserApiKey).where(UserApiKey.user_id == user.user_id))
        .scalars()
        .all()
    )
    assert len(api_keys) == 0


def test_create_api_key_unauthorized_different_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot create API keys for other users"""
    different_user_id = uuid.uuid4()
    json_data = {"key_name": "Test API Key"}

    response = client.post(
        f"/v1/users/{different_user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data,
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Verify no API key was created for either user
    api_keys = (
        db_session.execute(
            select(UserApiKey).where(UserApiKey.user_id.in_([user.user_id, different_user_id]))
        )
        .scalars()
        .all()
    )
    assert len(api_keys) == 0


def test_create_api_key_no_authentication(enable_factory_create, db_session, client, user):
    """Test that the endpoint requires authentication"""
    json_data = {"key_name": "Test API Key"}

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        json=json_data,
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    # Verify no API key was created
    api_keys = (
        db_session.execute(select(UserApiKey).where(UserApiKey.user_id == user.user_id))
        .scalars()
        .all()
    )
    assert len(api_keys) == 0


def test_create_api_key_multiple_keys_same_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that a user can create multiple API keys"""
    # Create first API key
    json_data_1 = {"key_name": "First API Key"}
    response_1 = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data_1,
    )
    assert response_1.status_code == 200

    # Create second API key
    json_data_2 = {"key_name": "Second API Key"}
    response_2 = client.post(
        f"/v1/users/{user.user_id}/api-keys",
        headers={"X-SGG-Token": user_auth_token},
        json=json_data_2,
    )
    assert response_2.status_code == 200

    # Verify both keys exist in the database
    api_keys = (
        db_session.execute(select(UserApiKey).where(UserApiKey.user_id == user.user_id))
        .scalars()
        .all()
    )
    assert len(api_keys) == 2

    key_names = [key.key_name for key in api_keys]
    assert "First API Key" in key_names
    assert "Second API Key" in key_names

    # Verify they have different key_ids
    key_ids = [key.key_id for key in api_keys]
    assert len(set(key_ids)) == 2  # Ensure uniqueness
