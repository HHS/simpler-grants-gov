import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import NotificationType
from src.db.models.user_models import UserNotificationPreference
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import UserFactory


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, UserNotificationPreference)
    return


def _get_preferences(db_session, user):
    return (
        db_session.execute(
            select(UserNotificationPreference).where(
                UserNotificationPreference.user_id == user.user_id
            )
        )
        .scalars()
        .all()
    )


def test_create_user_notification_preference(
    enable_factory_create, db_session, client, user, user_auth_token
):
    response = client.post(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"is_enabled": True},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    preferences = _get_preferences(db_session, user)
    assert len(preferences) == 1
    assert preferences[0].notification_type == NotificationType.ALL_NEW_OPPORTUNITIES
    assert preferences[0].is_enabled is True


def test_update_user_notification_preference(
    enable_factory_create, db_session, client, user, user_auth_token
):
    for is_enabled in [True, False, True]:
        response = client.post(
            f"/v1/users/{user.user_id}/all-opportunities/notifications",
            headers={"X-SGG-Token": user_auth_token},
            json={"is_enabled": is_enabled},
        )

        assert response.status_code == 200

        db_session.expire_all()
        preferences = _get_preferences(db_session, user)

        # The row is updated in place rather than duplicated
        assert len(preferences) == 1
        assert preferences[0].is_enabled is is_enabled


def test_create_user_notification_preference_unauthorized_user(
    enable_factory_create, db_session, client, user, user_auth_token
):
    other_user = UserFactory.create()

    response = client.post(
        f"/v1/users/{other_user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"is_enabled": True},
    )

    assert response.status_code == 403
    assert _get_preferences(db_session, other_user) == []


def test_create_user_notification_preference_missing_is_enabled(
    enable_factory_create, db_session, client, user, user_auth_token
):
    response = client.post(
        f"/v1/users/{user.user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={},
    )

    assert response.status_code == 422
    assert _get_preferences(db_session, user) == []


def test_create_user_notification_preference_user_not_found(
    enable_factory_create, db_session, client, user, user_auth_token
):
    """
    A user_id that matches no user is rejected before any lookup happens, so the
    route returns 403 rather than 404 - it only compares the path user_id against
    the authenticated user.
    """
    missing_user_id = uuid.uuid4()

    response = client.post(
        f"/v1/users/{missing_user_id}/all-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"is_enabled": True},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    # Nothing was written for the caller either
    assert _get_preferences(db_session, user) == []
