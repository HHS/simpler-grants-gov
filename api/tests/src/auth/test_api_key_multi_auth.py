import pytest

import src.app as app_entry
import src.logging
from src.auth.multi_auth import AuthType, api_key_multi_auth
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


@pytest.fixture(scope="module")
def mini_app(monkeypatch_module):
    def stub(app):
        pass

    """Create a separate app that we can modify separate from the base one used by other tests"""
    monkeypatch_module.setattr(app_entry, "register_blueprints", stub)
    monkeypatch_module.setattr(app_entry, "setup_logging", stub)
    mini_app = app_entry.create_app()

    @mini_app.get("/dummy_multi_auth_endpoint")
    @mini_app.auth_required(api_key_multi_auth)
    def dummy_endpoint():
        multi_user = api_key_multi_auth.get_user()

        return {
            "message": "ok",
            "auth_type": multi_user.auth_type,
            "user_type": type(multi_user.user).__name__,
        }

    with src.logging.init(__package__):
        yield mini_app


def test_api_key_multi_auth_with_env_api_key(mini_app, monkeypatch):
    """Test multi-auth with environment-based API key (X-Auth header)"""
    monkeypatch.setenv("API_AUTH_TOKEN", "test-env-key")

    import src.auth.api_key_auth

    src.auth.api_key_auth.API_AUTH_USERS = None

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-Auth": "test-env-key"}
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "ok"
    assert data["auth_type"] == AuthType.API_KEY_AUTH
    assert data["user_type"] == "ApiKeyUser"


def test_api_key_multi_auth_with_gateway_api_key(mini_app, enable_factory_create, db_session):
    """Test multi-auth with database-based API Gateway key (X-API-Key header)"""
    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="test-gateway-key", is_active=True)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-API-Key": "test-gateway-key"}
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "ok"
    assert data["auth_type"] == AuthType.API_GATEWAY_KEY_AUTH
    assert data["user_type"] == "UserApiKey"


def test_api_key_multi_auth_precedence(mini_app, monkeypatch, enable_factory_create, db_session):
    """Test that API Gateway key takes precedence when both headers are present"""
    monkeypatch.setenv("API_AUTH_TOKEN", "test-env-key")

    import src.auth.api_key_auth

    src.auth.api_key_auth.API_AUTH_USERS = None

    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="test-gateway-key", is_active=True)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint",
        headers={"X-Auth": "test-env-key", "X-API-Key": "test-gateway-key"},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "ok"
    assert data["auth_type"] == AuthType.API_GATEWAY_KEY_AUTH  # API Gateway key takes precedence
    assert data["user_type"] == "UserApiKey"


def test_api_key_multi_auth_invalid_env_key(mini_app, monkeypatch):
    """Test multi-auth with invalid environment API key"""
    monkeypatch.setenv("API_AUTH_TOKEN", "valid-env-key")

    import src.auth.api_key_auth

    src.auth.api_key_auth.API_AUTH_USERS = None

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-Auth": "invalid-key"}
    )

    assert resp.status_code == 401


def test_api_key_multi_auth_invalid_gateway_key(mini_app, enable_factory_create, db_session):
    """Test multi-auth with invalid API Gateway key"""
    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-API-Key": "invalid-gateway-key"}
    )

    assert resp.status_code == 401


def test_api_key_multi_auth_no_headers(mini_app):
    """Test multi-auth with no authentication headers"""
    resp = mini_app.test_client().get("/dummy_multi_auth_endpoint", headers={})

    assert resp.status_code == 401


def test_api_key_multi_auth_inactive_gateway_key(mini_app, enable_factory_create, db_session):
    """Test multi-auth with inactive API Gateway key"""
    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="inactive-gateway-key", is_active=False)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-API-Key": "inactive-gateway-key"}
    )

    assert resp.status_code == 401


def test_api_key_multi_auth_fallback_to_gateway_key(mini_app, enable_factory_create, db_session):
    """Test that gateway key works when environment key is not configured"""
    import os

    if "API_AUTH_TOKEN" in os.environ:
        del os.environ["API_AUTH_TOKEN"]

    import src.auth.api_key_auth

    src.auth.api_key_auth.API_AUTH_USERS = None

    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="test-gateway-key", is_active=True)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-API-Key": "test-gateway-key"}
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "ok"
    assert data["auth_type"] == AuthType.API_GATEWAY_KEY_AUTH
    assert data["user_type"] == "UserApiKey"


def test_api_key_multi_auth_user_types(mini_app, monkeypatch, enable_factory_create, db_session):
    """Test that the multi-auth correctly identifies different user types"""
    monkeypatch.setenv("API_AUTH_TOKEN", "test-env-key")

    import src.auth.api_key_auth

    src.auth.api_key_auth.API_AUTH_USERS = None

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-Auth": "test-env-key"}
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["auth_type"] == AuthType.API_KEY_AUTH

    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="test-gateway-key", is_active=True)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_multi_auth_endpoint", headers={"X-API-Key": "test-gateway-key"}
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["auth_type"] == AuthType.API_GATEWAY_KEY_AUTH
