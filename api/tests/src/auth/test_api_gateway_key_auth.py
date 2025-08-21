import pytest
from freezegun import freeze_time

import src.app as app_entry
import src.logging
from src.auth.api_gateway_key_auth import (
    ApiKeyValidationError,
    api_gateway_key_auth,
    validate_api_key_in_db,
)
from src.db.models.user_models import UserApiKey
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


@pytest.fixture(scope="module")
def mini_app(monkeypatch_module):
    def stub(app):
        pass

    """Create a separate app that we can modify separate from the base one used by other tests"""
    monkeypatch_module.setattr(app_entry, "register_blueprints", stub)
    monkeypatch_module.setattr(app_entry, "setup_logging", stub)
    mini_app = app_entry.create_app()

    @mini_app.get("/dummy_auth_endpoint")
    @mini_app.auth_required(api_gateway_key_auth)
    def dummy_endpoint():
        assert api_gateway_key_auth.current_user is not None
        assert isinstance(api_gateway_key_auth.current_user, UserApiKey)

        return {"message": "ok"}

    with src.logging.init(__package__):
        yield mini_app


def test_validate_api_key_in_db_success(enable_factory_create, db_session):
    """Test successful API key validation"""
    user = UserFactory.create()
    api_key = UserApiKeyFactory.create(user=user, key_id="test-key-123", is_active=True)
    db_session.commit()

    result = validate_api_key_in_db("test-key-123", db_session)

    assert result.api_key_id == api_key.api_key_id
    assert result.user_id == user.user_id
    assert result.is_active is True


def test_validate_api_key_in_db_key_not_found(enable_factory_create, db_session):
    """Test API key validation when key doesn't exist"""
    with pytest.raises(ApiKeyValidationError, match="Invalid API key"):
        validate_api_key_in_db("nonexistent-key", db_session)


def test_validate_api_key_in_db_key_inactive(enable_factory_create, db_session):
    """Test API key validation when key is inactive"""
    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="inactive-key", is_active=False)
    db_session.commit()

    with pytest.raises(ApiKeyValidationError, match="API key is inactive"):
        validate_api_key_in_db("inactive-key", db_session)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_api_gateway_key_auth_happy_path(mini_app, enable_factory_create, db_session):
    """Test successful API Gateway key authentication"""
    user = UserFactory.create()
    UserApiKeyFactory.create(
        user=user, key_id="valid-gateway-key", is_active=True, last_used=None
    )
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-API-Key": "valid-gateway-key"}
    )

    assert resp.status_code == 200
    assert resp.get_json()["message"] == "ok"

    # Note: last_used timestamp is updated during authentication but not committed
    # in the test environment due to transaction management


def test_api_gateway_key_auth_invalid_key(mini_app, enable_factory_create, db_session):
    """Test API Gateway key authentication with invalid key"""
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-API-Key": "invalid-key"})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_api_gateway_key_auth_inactive_key(mini_app, enable_factory_create, db_session):
    """Test API Gateway key authentication with inactive key"""
    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="inactive-gateway-key", is_active=False)
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-API-Key": "inactive-gateway-key"}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "API key is inactive"


def test_api_gateway_key_auth_no_key_header(mini_app, enable_factory_create, db_session):
    """Test API Gateway key authentication with missing header"""
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={})

    assert resp.status_code == 401


def test_api_gateway_key_auth_empty_key_header(mini_app, enable_factory_create, db_session):
    """Test API Gateway key authentication with empty header"""
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-API-Key": ""})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_api_gateway_key_auth_multiple_active_keys(mini_app, enable_factory_create, db_session):
    """Test that different API keys for the same user work independently"""
    user = UserFactory.create()
    UserApiKeyFactory.create(user=user, key_id="user-key-1", is_active=True)
    UserApiKeyFactory.create(user=user, key_id="user-key-2", is_active=True)
    db_session.commit()

    resp1 = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-API-Key": "user-key-1"})
    assert resp1.status_code == 200

    resp2 = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-API-Key": "user-key-2"})
    assert resp2.status_code == 200

    # Note: last_used timestamps are updated during authentication but not committed
    # in the test environment due to transaction management
