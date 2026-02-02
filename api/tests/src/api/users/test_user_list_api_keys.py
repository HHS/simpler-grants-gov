import uuid

from tests.src.db.models.factories import UserApiKeyFactory


def test_list_api_keys_empty_result(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test listing API keys when user has no keys"""
    response = client.post(
        f"/v1/users/{user.user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"
    assert response.json["data"] == []


def test_list_api_keys_single_key(enable_factory_create, db_session, client, user, user_auth_token):
    """Test listing API keys when user has one key"""
    api_key = UserApiKeyFactory.create(user=user, key_name="Test API Key")
    db_session.commit()

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    response_data = response.json["data"]
    assert len(response_data) == 1

    api_key_data = response_data[0]
    assert api_key_data["api_key_id"] == str(api_key.api_key_id)
    assert api_key_data["key_name"] == "Test API Key"
    assert api_key_data["key_id"] == api_key.key_id
    assert api_key_data["is_active"] == api_key.is_active
    assert "created_at" in api_key_data
    assert "last_used" in api_key_data


def test_list_api_keys_multiple_keys_ordered_by_created_at(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test listing multiple API keys ordered by creation date (newest first)"""
    api_key1 = UserApiKeyFactory.create(user=user, key_name="First Key")
    api_key2 = UserApiKeyFactory.create(user=user, key_name="Second Key")
    api_key3 = UserApiKeyFactory.create(user=user, key_name="Third Key")
    db_session.commit()

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    response_data = response.json["data"]
    assert len(response_data) == 3

    returned_key_ids = {key_data["api_key_id"] for key_data in response_data}
    expected_key_ids = {
        str(api_key1.api_key_id),
        str(api_key2.api_key_id),
        str(api_key3.api_key_id),
    }
    assert returned_key_ids == expected_key_ids

    assert response_data[0]["api_key_id"] == str(api_key3.api_key_id)


def test_list_api_keys_only_users_keys(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that only the authenticated user's keys are returned"""
    from tests.src.db.models.factories import UserFactory

    other_user = UserFactory.create()
    other_user_key = UserApiKeyFactory.create(user=other_user, key_name="Other User Key")

    user_key = UserApiKeyFactory.create(user=user, key_name="User Key")
    db_session.commit()

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    response_data = response.json["data"]
    assert len(response_data) == 1

    assert response_data[0]["api_key_id"] == str(user_key.api_key_id)
    assert response_data[0]["key_name"] == "User Key"

    returned_key_ids = {key_data["api_key_id"] for key_data in response_data}
    assert str(other_user_key.api_key_id) not in returned_key_ids


def test_list_api_keys_includes_inactive_keys(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that both active and inactive keys are returned"""
    active_key = UserApiKeyFactory.create(user=user, key_name="Active Key", is_active=True)
    inactive_key = UserApiKeyFactory.create(user=user, key_name="Inactive Key", is_active=False)
    db_session.commit()

    response = client.post(
        f"/v1/users/{user.user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    response_data = response.json["data"]
    assert len(response_data) == 2

    # Find the keys in the response
    active_key_data = next(
        (key for key in response_data if key["api_key_id"] == str(active_key.api_key_id)), None
    )
    inactive_key_data = next(
        (key for key in response_data if key["api_key_id"] == str(inactive_key.api_key_id)), None
    )

    assert active_key_data is not None
    assert active_key_data["is_active"] is True

    assert inactive_key_data is not None
    assert inactive_key_data["is_active"] is False


def test_list_api_keys_unauthorized_different_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """Test that users cannot list API keys for other users"""
    different_user_id = uuid.uuid4()

    response = client.post(
        f"/v1/users/{different_user_id}/api-keys/list",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_list_api_keys_no_authentication(enable_factory_create, db_session, client, user):
    """Test that the endpoint requires authentication"""
    response = client.post(f"/v1/users/{user.user_id}/api-keys/list", json={})

    assert response.status_code == 401
    assert response.json["message"] == "Unable to process token"
