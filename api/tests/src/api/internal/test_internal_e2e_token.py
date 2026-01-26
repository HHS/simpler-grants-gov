from src.constants.lookup_constants import Privilege, RoleType
from tests.src.db.models import factories

E2E_TOKEN_URL = "/v1/internal/e2e-token"


def setup_e2e_privileges(db_session, api_key_value, has_privilege=True):
    """Helper to setup a user with or without the E2E token privilege"""
    user = factories.UserFactory.create()
    factories.UserApiKeyFactory.create(user=user, key_id=api_key_value)

    privileges = [Privilege.READ_TEST_USER_TOKEN] if has_privilege else [Privilege.VIEW_APPLICATION]

    role = factories.RoleFactory.create(role_name="E2E Role", privileges=privileges)
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=user, role=role)

    db_session.commit()
    return user


def test_get_e2e_token_success(client, db_session, enable_factory_create, monkeypatch):
    """Test successful token retrieval in a lower environment"""
    monkeypatch.setenv("APP_ENV", "local")
    api_key = "privileged-e2e-key"
    setup_e2e_privileges(db_session, api_key, has_privilege=True)

    resp = client.post(E2E_TOKEN_URL, headers={"X-API-Key": api_key})

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "token" in data
    assert "expires_at" in data
    assert isinstance(data["token"], str)


def test_get_e2e_token_forbidden(client, db_session, enable_factory_create, monkeypatch):
    """Test that a valid key without the specific privilege returns 403"""
    monkeypatch.setenv("APP_ENV", "local")
    api_key = "unprivileged-key"
    setup_e2e_privileges(db_session, api_key, has_privilege=False)

    resp = client.post(E2E_TOKEN_URL, headers={"X-API-Key": api_key})

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_get_e2e_token_unauthorized(client, enable_factory_create):
    """Test that a missing or invalid key returns 401"""
    resp = client.post(E2E_TOKEN_URL, headers={"X-API-Key": "invalid-key"})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_get_e2e_token_production_guard_404(client, db_session, enable_factory_create, monkeypatch):
    """Test that the endpoint returns a 404 in production, even with valid auth"""
    monkeypatch.setenv("APP_ENV", "production")
    api_key = "prod-test-key"
    setup_e2e_privileges(db_session, api_key, has_privilege=True)

    resp = client.post(E2E_TOKEN_URL, headers={"X-API-Key": api_key})

    assert resp.status_code == 404
