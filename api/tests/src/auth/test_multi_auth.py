from datetime import timedelta

import pytest

import src.app as app_entry
import src.logging
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.auth.multi_auth import (
    AuthType,
    jwt_key_or_internal_multi_auth,
    jwt_or_api_user_key_multi_auth,
    jwt_or_key_multi_auth,
)
from src.util import datetime_util
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


@pytest.fixture(scope="module")
def mini_app(monkeypatch_module):
    """Create a separate app that we can modify separate from the base one used by other tests"""

    def stub(app):
        pass

    # We want all the configurational setup for the app, but
    # don't want blueprints to keep setup simpler
    monkeypatch_module.setattr(app_entry, "register_blueprints", stub)
    monkeypatch_module.setattr(app_entry, "setup_logging", stub)
    mini_app = app_entry.create_app()

    @mini_app.get("/dummy_auth_endpoint")
    @mini_app.auth_required(jwt_or_key_multi_auth)
    def dummy_endpoint():
        user = jwt_or_key_multi_auth.get_user()

        return {
            "message": "ok",
            "auth_type": user.auth_type,
            "user_id": getattr(user.user, "user_id", None),
            "username": getattr(user.user, "username", None),
        }

    @mini_app.get("/dummy_internal_auth_endpoint")
    @mini_app.auth_required(jwt_key_or_internal_multi_auth)
    def dummy_internal_endpoint():
        user = jwt_key_or_internal_multi_auth.get_user()

        return {
            "message": "ok",
            "auth_type": user.auth_type,
            "user_id": getattr(user.user, "user_id", None),
            "username": getattr(user.user, "username", None),
            "token_id": getattr(user.user, "short_lived_internal_token_id", None),
        }

    @mini_app.get("/dummy_auth_endpoint_simpler")
    @mini_app.auth_required(jwt_or_api_user_key_multi_auth)
    def dummy_endpoint_simpler():
        user = jwt_or_api_user_key_multi_auth.get_user()

        return {
            "message": "ok",
            "user_id": getattr(user, "user_id", None),
        }

    # To avoid re-initializing logging everytime we
    # setup the app, we disabled it above and do it here
    # in case you want it while running your tests
    with src.logging.init(__package__):
        yield mini_app


def test_multi_auth_happy_path(mini_app, enable_factory_create, db_session, api_auth_token):
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()  # need to commit here to push the session to the DB

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)
    assert resp.json["username"] is None

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.API_KEY_AUTH
    assert resp.json["user_id"] is None
    assert resp.json["username"] == "auth_token_0"

    # If we provide both tokens, the user auth is used
    # because it's the "primary" auth and takes precedence
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-SGG-Token": token, "X-Auth": api_auth_token}
    )
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)
    assert resp.json["username"] is None


def test_multi_auth_no_auth_provided(mini_app):
    # This will still go into the first auth (jwt auth) and fail
    # for not having a token
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={})
    assert resp.status_code == 401
    assert resp.json["message"] == "Unable to process token"


def test_multi_auth_invalid_jwt(mini_app):
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-SGG-Token": "not-a-token"}
    )
    assert resp.status_code == 401
    assert resp.json["message"] == "Unable to process token"


def test_multi_auth_invalid_key(mini_app):
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-Auth": "not-a-token"})
    assert resp.status_code == 401
    assert (
        resp.json["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )


def test_internal_multi_auth_with_user_jwt(mini_app, enable_factory_create, db_session):
    """Test that the internal multi-auth works with regular user JWT tokens"""
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)
    assert resp.json["username"] is None
    assert resp.json["token_id"] is None


def test_internal_multi_auth_with_api_key(mini_app, api_auth_token):
    """Test that the internal multi-auth rejects API key tokens (security requirement)"""
    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-Auth": api_auth_token}
    )
    # API keys should not be accepted for internal multi-auth endpoints for security reasons
    assert resp.status_code == 401
    assert resp.json["message"] == "Unable to process token"


def test_internal_multi_auth_with_internal_jwt(mini_app, enable_factory_create, db_session):
    """Test that the internal multi-auth works with internal JWT tokens"""
    expires_at = datetime_util.utcnow() + timedelta(hours=1)
    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Internal-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.INTERNAL_JWT_AUTH
    assert resp.json["user_id"] is None
    assert resp.json["username"] is None
    assert resp.json["token_id"] == str(short_lived_token.short_lived_internal_token_id)


def test_internal_multi_auth_precedence(
    mini_app, enable_factory_create, db_session, api_auth_token
):
    """Test that auth precedence works correctly - user JWT takes precedence over internal JWT"""
    user = UserFactory.create()
    user_token, _ = create_jwt_for_user(user, db_session)

    expires_at = datetime_util.utcnow() + timedelta(hours=1)
    internal_token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    # If we provide both user JWT and internal JWT, user JWT takes precedence
    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint",
        headers={"X-SGG-Token": user_token, "X-SGG-Internal-Token": internal_token},
    )
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)


def test_multi_auth_simpler_with_jwt(mini_app, enable_factory_create, db_session):
    """Test that the jwt_or_api_user_key_multi_auth works with JWT tokens and returns the actual user"""
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint_simpler", headers={"X-SGG-Token": token}
    )
    assert resp.status_code == 200
    assert resp.json["message"] == "ok"
    assert resp.json["user_id"] == str(user.user_id)


def test_multi_auth_simpler_with_api_user_key(mini_app, enable_factory_create, db_session):
    """Test that the jwt_or_api_user_key_multi_auth works with api user keys and returns the actual user"""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, is_active=True)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint_simpler", headers={"X-API-Key": api_key.key_id}
    )
    assert resp.status_code == 200
    assert resp.json["message"] == "ok"
    assert resp.json["user_id"] == str(user.user_id)


def test_multi_auth_simpler_precedence(mini_app, enable_factory_create, db_session):
    """Test that JWT auth takes precedence over api user key auth when both are provided for jwt_or_api_user_key_multi_auth"""
    # Create two different users
    jwt_user = UserFactory.create()
    api_user_key_user = UserFactory.create()

    # Create authentication for both users
    token, _ = create_jwt_for_user(jwt_user, db_session)
    api_key = UserApiKeyFactory.create(user=api_user_key_user, is_active=True)
    db_session.commit()

    # Send request with both authentication methods
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint_simpler",
        headers={"X-SGG-Token": token, "X-API-Key": api_key.key_id},
    )

    # Should use the JWT user since it's first in the MultiUserAuth definition
    assert resp.status_code == 200
    assert resp.json["message"] == "ok"
    assert resp.json["user_id"] == str(jwt_user.user_id)


def test_multi_auth_simpler_no_auth(mini_app):
    """Test that authentication fails when no auth is provided for jwt_or_api_user_key_multi_auth"""
    resp = mini_app.test_client().get("/dummy_auth_endpoint_simpler", headers={})
    assert resp.status_code == 401


def test_multi_auth_simpler_invalid_auth(mini_app):
    """Test that authentication fails with invalid credentials for jwt_or_api_user_key_multi_auth"""
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint_simpler", headers={"X-SGG-Token": "invalid-token"}
    )
    assert resp.status_code == 401

    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint_simpler", headers={"X-API-Key": "invalid-key"}
    )
    assert resp.status_code == 401
