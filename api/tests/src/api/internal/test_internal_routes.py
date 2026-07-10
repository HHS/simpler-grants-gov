import uuid

from sqlalchemy import func, select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import Privilege, RoleType, UserType
from src.constants.static_role_values import INTERNAL_S3_SCANNER_ROLE_ID
from src.db.models.user_models import InternalUserRole, User, UserApiKey

INTERNAL_ROLES_URL = "/v1/internal/roles"
SCANNER_USER_URL = "/v1/internal/file-scan-scanner-user"


def setup_admin_privileges(db_session, api_key_value):
    """
    Ensures the user associated with the API key has the required privilege.
    Checks for existing keys to avoid IntegrityError.
    """
    existing_key = db_session.execute(
        select(UserApiKey).where(UserApiKey.key_id == api_key_value)
    ).scalar_one_or_none()

    if existing_key:
        user = existing_key.user
    else:
        user = factories.UserFactory.create()
        factories.UserApiKeyFactory.create(user=user, key_id=api_key_value)

    admin_role = factories.RoleFactory.create(
        role_name=f"Internal Admin {uuid.uuid4()}", privileges=[Privilege.MANAGE_INTERNAL_ROLES]
    )
    factories.LinkRoleRoleTypeFactory.create(role=admin_role, role_type=RoleType.INTERNAL)

    factories.InternalUserRoleFactory.create(user=user, role=admin_role)

    return user


def test_update_internal_role_success(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test successfully assigning an internal role to a user"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    role_to_assign = factories.RoleFactory.create(role_name="New Internal Role")
    factories.LinkRoleRoleTypeFactory.create(role=role_to_assign, role_type=RoleType.INTERNAL)

    target_user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(
        user=target_user, email="success@test.org"
    )

    payload = {"user_email": external_link.email, "internal_role_id": str(role_to_assign.role_id)}

    resp = client.put(
        INTERNAL_ROLES_URL, headers={"X-API-Key": internal_admin_user_api_key}, json=payload
    )

    assert resp.status_code == 200
    assignment = (
        db_session.query(InternalUserRole)
        .filter_by(user_id=target_user.user_id, role_id=role_to_assign.role_id)
        .first()
    )
    assert assignment is not None


def test_update_internal_role_not_found(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 response when the internal_role_id does not exist"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    target_user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(user=target_user, email="404@test.org")

    payload = {"user_email": external_link.email, "internal_role_id": str(uuid.uuid4())}

    resp = client.put(
        INTERNAL_ROLES_URL, headers={"X-API-Key": internal_admin_user_api_key}, json=payload
    )

    assert resp.status_code == 404
    assert "Internal role not found" in resp.get_json()["message"]


def test_update_internal_role_already_assigned(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test 422 response when the user already has this role"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    role = factories.RoleFactory.create()
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    target_user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(
        user=target_user, email="conflict@test.org"
    )

    factories.InternalUserRoleFactory.create(user=target_user, role=role)

    payload = {"user_email": external_link.email, "internal_role_id": str(role.role_id)}

    resp = client.put(
        INTERNAL_ROLES_URL, headers={"X-API-Key": internal_admin_user_api_key}, json=payload
    )

    assert resp.status_code == 422
    assert "User already has this role" in resp.get_json()["message"]


def test_update_internal_role_unauthorized(client, enable_factory_create):
    """Test that requests without valid auth are rejected (401)"""
    payload = {"user_email": "test@example.org", "internal_role_id": str(uuid.uuid4())}

    resp = client.put(INTERNAL_ROLES_URL, json=payload)
    assert resp.status_code == 401


def test_update_internal_role_forbidden(client, user_api_key_id, enable_factory_create):
    """Test that users without manage_internal_roles privilege are rejected (403)"""
    role = factories.RoleFactory.create()
    user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(user=user)

    payload = {"user_email": external_link.email, "internal_role_id": str(role.role_id)}

    resp = client.put(INTERNAL_ROLES_URL, headers={"X-API-Key": user_api_key_id}, json=payload)

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_update_internal_role_invalid_input(
    client, internal_admin_user_api_key, enable_factory_create
):
    """Test 422 response for malformed JSON or missing fields"""
    payload = {"user_email": "missing_role_id@example.com"}

    resp = client.put(
        INTERNAL_ROLES_URL, headers={"X-API-Key": internal_admin_user_api_key}, json=payload
    )

    assert resp.status_code == 422


def test_setup_scanner_user_success(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Provisions the scanner user, its INTERNAL_S3_SCAN role, and returns a generated key"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)
    scanner_user_id = uuid.uuid4()

    resp = client.post(
        SCANNER_USER_URL,
        headers={"X-API-Key": internal_admin_user_api_key},
        json={"user_id": str(scanner_user_id)},
    )

    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["user_id"] == str(scanner_user_id)
    generated_key = data["api_key"]
    assert generated_key

    user = db_session.scalars(select(User).where(User.user_id == scanner_user_id)).one()
    assert user.user_type == UserType.INTERNAL_SYSTEM_USER
    assert any(link.role_id == INTERNAL_S3_SCANNER_ROLE_ID for link in user.internal_user_roles)

    # The returned key is the one persisted for the scanner user, and is active.
    key = db_session.scalars(select(UserApiKey).where(UserApiKey.key_id == generated_key)).one()
    assert key.user_id == scanner_user_id
    assert str(key.api_key_id) == data["api_key_id"]
    assert key.is_active is True


def test_setup_scanner_user_idempotent_user_and_role(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Re-running keeps a single user + role link but mints a fresh key each call (rotation)"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)
    scanner_user_id = uuid.uuid4()

    keys = []
    for _ in range(2):
        resp = client.post(
            SCANNER_USER_URL,
            headers={"X-API-Key": internal_admin_user_api_key},
            json={"user_id": str(scanner_user_id)},
        )
        assert resp.status_code == 200
        keys.append(resp.get_json()["data"]["api_key"])

    # Each call returns a distinct, newly generated key.
    assert keys[0] != keys[1]

    assert (
        db_session.scalar(
            select(func.count()).select_from(User).where(User.user_id == scanner_user_id)
        )
        == 1
    )
    assert (
        db_session.scalar(
            select(func.count())
            .select_from(InternalUserRole)
            .where(InternalUserRole.user_id == scanner_user_id)
        )
        == 1
    )
    # Both rotations are persisted against the same user.
    assert (
        db_session.scalar(
            select(func.count())
            .select_from(UserApiKey)
            .where(UserApiKey.user_id == scanner_user_id)
        )
        == 2
    )


def test_setup_scanner_user_unauthorized(client, enable_factory_create):
    """Requests without valid auth are rejected (401)"""
    resp = client.post(SCANNER_USER_URL, json={"user_id": str(uuid.uuid4())})
    assert resp.status_code == 401


def test_setup_scanner_user_forbidden(client, user_api_key_id, enable_factory_create):
    """Users without the manage_internal_roles privilege are rejected (403)"""
    resp = client.post(
        SCANNER_USER_URL,
        headers={"X-API-Key": user_api_key_id},
        json={"user_id": str(uuid.uuid4())},
    )

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_setup_scanner_user_invalid_input(
    client, internal_admin_user_api_key, enable_factory_create
):
    """Missing the required user_id field is a 422"""
    resp = client.post(
        SCANNER_USER_URL, headers={"X-API-Key": internal_admin_user_api_key}, json={}
    )
    assert resp.status_code == 422
