from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import NotificationType
from tests.src.db.models.factories import (
    UserApiKeyFactory,
    UserFactory,
    UserNotificationPreferenceFactory,
)


def test_get_all_opportunities_notifications_default_no_row(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """With no preference row, is_enabled falls back to the notification type default (False)."""
    response = client.get(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["data"] == {"is_enabled": False}


def test_get_all_opportunities_notifications_enabled_row(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """An explicit enabled preference row is returned."""
    UserNotificationPreferenceFactory.create(
        user=user, notification_type=NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=True
    )

    response = client.get(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["data"] == {"is_enabled": True}


def test_get_all_opportunities_notifications_disabled_row(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """An explicit disabled preference row is returned."""
    UserNotificationPreferenceFactory.create(
        user=user, notification_type=NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=False
    )

    response = client.get(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["data"] == {"is_enabled": False}


def test_get_all_opportunities_notifications_ignores_other_users(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """Another user's preference row does not affect the requested user's preference."""
    UserNotificationPreferenceFactory.create(
        notification_type=NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=True
    )

    response = client.get(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    assert response.json["data"] == {"is_enabled": False}


def test_get_all_opportunities_notifications_with_api_key(
    client, enable_factory_create, db_session
):
    """The endpoint accepts API user key auth."""
    api_key = UserApiKeyFactory.create()
    UserNotificationPreferenceFactory.create(
        user=api_key.user, notification_type=NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=True
    )

    response = client.get(
        f"/v1/users/{api_key.user_id}/all-opportunities/notifications",
        headers={"X-API-Key": api_key.key_id},
    )

    assert response.status_code == 200
    assert response.json["data"] == {"is_enabled": True}


def test_get_all_opportunities_notifications_forbidden_different_user(
    client, enable_factory_create, db_session
):
    """Returns 403 when the authenticated user differs from the user_id in the URL."""
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    other_user = UserFactory.create()

    response = client.get(
        f"/v1/users/{other_user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_get_all_opportunities_notifications_unauthenticated(
    client, enable_factory_create, db_session
):
    """Returns 401 when no authentication is provided."""
    user = UserFactory.create()

    response = client.get(f"/v1/users/{user.user_id}/all-opportunities/notifications")

    assert response.status_code == 401
