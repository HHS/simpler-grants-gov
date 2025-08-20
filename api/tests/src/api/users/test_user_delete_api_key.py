import uuid

from sqlalchemy import select

from src.db.models.user_models import UserApiKey
from tests.src.db.models.factories import UserApiKeyFactory


def test_delete_api_key_success(enable_factory_create, db_session, client, user, user_auth_token):
    """Test successful API key deletion"""
    api_key = UserApiKeyFactory.create(user=user, is_active=True, key_name="Test API Key")

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Expunge the object to see changes made by the API call
    db_session.expunge(api_key)

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is None


def test_delete_api_key_not_found(enable_factory_create, db_session, client, user, user_auth_token):
    """Test deletion of non-existent API key returns 404"""
    nonexistent_api_key_id = uuid.uuid4()

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{nonexistent_api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "API key not found"


def test_delete_api_key_wrong_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot delete API keys belonging to other users"""
    from tests.src.db.models.factories import UserFactory

    other_user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=other_user, is_active=True)

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404
    assert response.json["message"] == "API key not found"

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is not None


def test_delete_api_key_unauthorized_different_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot delete API keys for other users via URL manipulation"""
    different_user_id = uuid.uuid4()
    api_key = UserApiKeyFactory.create(user=user, is_active=True)

    response = client.delete(
        f"/v1/users/{different_user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is not None


def test_delete_api_key_no_authentication(enable_factory_create, db_session, client, user):
    """Test that the endpoint requires authentication"""
    api_key = UserApiKeyFactory.create(user=user, is_active=True)

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
    )

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is not None


def test_delete_api_key_already_inactive(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test deletion of an already inactive API key"""
    api_key = UserApiKeyFactory.create(user=user, is_active=False, key_name="Inactive Key")

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Expunge the object to see changes made by the API call
    db_session.expunge(api_key)

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is None


def test_delete_api_key_multiple_keys(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that deleting one API key doesn't affect others"""
    api_key1 = UserApiKeyFactory.create(user=user, is_active=True, key_name="Key 1")
    api_key2 = UserApiKeyFactory.create(user=user, is_active=True, key_name="Key 2")

    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/{api_key1.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200

    # Expunge the objects to see changes made by the API call
    db_session.expunge(api_key1)
    db_session.expunge(api_key2)

    db_api_key1 = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key1.api_key_id)
    ).scalar_one_or_none()
    db_api_key2 = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key2.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key1 is None  # First key was deleted
    assert db_api_key2 is not None  # Second key still exists


def test_delete_api_key_invalid_uuid(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test deletion with invalid UUID format"""
    response = client.delete(
        f"/v1/users/{user.user_id}/api-keys/invalid-uuid",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404


def test_delete_api_key_invalid_user_uuid(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test deletion with invalid user UUID format"""
    api_key = UserApiKeyFactory.create(user=user, is_active=True)

    response = client.delete(
        f"/v1/users/invalid-uuid/api-keys/{api_key.api_key_id}",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 404

    db_api_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.api_key_id == api_key.api_key_id)
    ).scalar_one_or_none()
    assert db_api_key is not None
