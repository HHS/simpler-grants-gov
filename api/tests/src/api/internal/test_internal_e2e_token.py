import uuid
from email.utils import parsedate_to_datetime

import jwt
import pytest
from sqlalchemy import select

from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import UserTokenSession
from tests.src.db.models import factories

E2E_TOKEN_URL = "/v1/internal/e2e-token"


@pytest.fixture
def manager_api_key(db_session, enable_factory_create):
    """Create a 'test user manager' user + API key with MANAGE_TEST_USER_TOKEN privilege."""
    manager_user = factories.UserFactory.create()
    api_key = factories.UserApiKeyFactory.create(user=manager_user)

    manager_role = factories.RoleFactory.create(
        role_name="Test User Manager", privileges=[Privilege.MANAGE_TEST_USER_TOKEN]
    )
    factories.LinkRoleRoleTypeFactory.create(role=manager_role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=manager_user, role=manager_role)

    return api_key.key_id


@pytest.fixture
def test_user(db_session, enable_factory_create):
    """Create a user tagged as a test user (has READ_TEST_USER_TOKEN privilege)."""
    user = factories.UserFactory.create()

    role = factories.RoleFactory.create(
        role_name="E2E Test User", privileges=[Privilege.READ_TEST_USER_TOKEN]
    )
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=user, role=role)

    return user


def test_get_e2e_token_success(client, db_session, manager_api_key, test_user):
    """Test successful token retrieval for a test user in a lower environment"""
    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": manager_api_key},
        json={"user_id": str(test_user.user_id)},
    )

    assert resp.status_code == 200
    data = resp.get_json()["data"]

    # The issued token must belong to the target test user, not the manager
    # whose API key made the request
    decoded_token = jwt.decode(data["token"], options={"verify_signature": False})
    assert decoded_token["user_id"] == str(test_user.user_id)

    token_session = db_session.execute(
        select(UserTokenSession).where(UserTokenSession.token_id == decoded_token["sub"])
    ).scalar_one_or_none()
    assert token_session is not None
    assert token_session.user_id == test_user.user_id
    assert token_session.is_valid is True
    # The response serializes the datetime in RFC 822 format with second precision
    assert parsedate_to_datetime(data["expires_at"]) == token_session.expires_at.replace(
        microsecond=0
    )


def test_get_e2e_token_forbidden_wrong_privilege(
    client, db_session, enable_factory_create, test_user
):
    """An API key without MANAGE_TEST_USER_TOKEN returns 403"""
    user = factories.UserFactory.create()
    api_key = factories.UserApiKeyFactory.create(user=user)

    role = factories.RoleFactory.create(
        role_name="Unprivileged", privileges=[Privilege.VIEW_APPLICATION]
    )
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=user, role=role)

    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": api_key.key_id},
        json={"user_id": str(test_user.user_id)},
    )

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_get_e2e_token_unauthorized(client, enable_factory_create):
    """A missing or invalid API key returns 401"""
    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": "invalid-key"},
        json={"user_id": str(uuid.uuid4())},
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Invalid API key"


def test_get_e2e_token_production_returns_404(
    client, db_session, manager_api_key, test_user, monkeypatch
):
    """In production, the endpoint returns 404 even with valid auth"""
    monkeypatch.setenv("ENVIRONMENT", "production")

    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": manager_api_key},
        json={"user_id": str(test_user.user_id)},
    )

    assert resp.status_code == 404


def test_get_e2e_token_user_not_found_returns_404(client, db_session, manager_api_key):
    """If the user_id doesn't match any user, returns 404"""
    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": manager_api_key},
        json={"user_id": str(uuid.uuid4())},
    )

    assert resp.status_code == 404


def test_get_e2e_token_non_test_user_returns_404(
    client, db_session, manager_api_key, enable_factory_create
):
    """If the user exists but isn't tagged as a test user, returns 404"""
    non_test_user = factories.UserFactory.create()

    resp = client.post(
        E2E_TOKEN_URL,
        headers={"X-API-Key": manager_api_key},
        json={"user_id": str(non_test_user.user_id)},
    )

    assert resp.status_code == 404


def test_get_e2e_token_missing_user_id_returns_422(client, db_session, manager_api_key):
    """A request missing the user_id field returns 422"""
    resp = client.post(E2E_TOKEN_URL, headers={"X-API-Key": manager_api_key}, json={})

    assert resp.status_code == 422
