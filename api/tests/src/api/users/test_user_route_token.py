from datetime import datetime

from freezegun import freeze_time

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import UserFactory


@freeze_time("2024-11-22 12:00:00", tz_offset=0)
def test_post_user_route_token_refresh_200(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()
    token, user_token_session = create_jwt_for_user(user, db_session)
    db_session.commit()

    resp = client.post("v1/users/token/refresh", headers={"X-SGG-Token": token})

    db_session.refresh(user_token_session)

    assert resp.status_code == 200
    assert user_token_session.expires_at == datetime.fromisoformat("2024-11-22 12:30:00+00:00")


def test_post_user_route_token_refresh_expired(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()

    token, session = create_jwt_for_user(user, db_session)
    session.expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")
    db_session.commit()

    resp = client.post("v1/users/token/refresh", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token expired"


def test_post_user_route_token_logout_200(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()
    token, user_token_session = create_jwt_for_user(user, db_session)
    db_session.commit()

    resp = client.post("v1/users/token/logout", headers={"X-SGG-Token": token})

    db_session.refresh(user_token_session)

    assert resp.status_code == 200
    assert not user_token_session.is_valid


def test_post_user_route_token_logout_invalid(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()

    token, session = create_jwt_for_user(user, db_session)
    session.is_valid = False
    db_session.commit()

    resp = client.post("v1/users/token/logout", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token is no longer valid"
