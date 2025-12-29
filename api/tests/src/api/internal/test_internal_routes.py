import uuid
from sqlalchemy import select
from src.constants.lookup_constants import RoleType, Privilege
from src.db.models.user_models import InternalUserRole, UserApiKey
import tests.src.db.models.factories as factories

INTERNAL_ROLES_URL = "/v1/internal/roles"

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
        role_name=f"Internal Admin {uuid.uuid4()}",
        privileges=[Privilege.MANAGE_INTERNAL_ROLES]
    )
    factories.LinkRoleRoleTypeFactory.create(role=admin_role, role_type=RoleType.INTERNAL)
    
    factories.InternalUserRoleFactory.create(user=user, role=admin_role)
    db_session.commit()
    return user

def test_update_internal_role_success(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test successfully assigning an internal role to a user"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    role_to_assign = factories.RoleFactory.create(role_name="New Internal Role")
    factories.LinkRoleRoleTypeFactory.create(role=role_to_assign, role_type=RoleType.INTERNAL)
    
    target_user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(user=target_user, email="success@test.org")
    db_session.commit()

    payload = {
        "user_email": external_link.email,
        "internal_role_id": str(role_to_assign.role_id)
    }

    resp = client.put(
        INTERNAL_ROLES_URL,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload
    )

    assert resp.status_code == 200
    assignment = db_session.query(InternalUserRole).filter_by(
        user_id=target_user.user_id, 
        role_id=role_to_assign.role_id
    ).first()
    assert assignment is not None

def test_update_internal_role_not_found(
    client, db_session, internal_admin_user_api_key, enable_factory_create
):
    """Test 404 response when the internal_role_id does not exist"""
    setup_admin_privileges(db_session, internal_admin_user_api_key)

    target_user = factories.UserFactory.create()
    external_link = factories.LinkExternalUserFactory.create(user=target_user, email="404@test.org")
    db_session.commit()
    
    payload = {
        "user_email": external_link.email,
        "internal_role_id": str(uuid.uuid4())
    }

    resp = client.put(
        INTERNAL_ROLES_URL,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload
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
    external_link = factories.LinkExternalUserFactory.create(user=target_user, email="conflict@test.org")
    
    factories.InternalUserRoleFactory.create(user=target_user, role=role)
    db_session.commit()

    payload = {
        "user_email": external_link.email,
        "internal_role_id": str(role.role_id)
    }

    resp = client.put(
        INTERNAL_ROLES_URL,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload
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

    payload = {
        "user_email": external_link.email,
        "internal_role_id": str(role.role_id)
    }

    resp = client.put(
        INTERNAL_ROLES_URL,
        headers={"X-API-Key": user_api_key_id},
        json=payload
    )

    assert resp.status_code == 403
    assert resp.get_json()["message"] == "Forbidden"


def test_update_internal_role_invalid_input(client, internal_admin_user_api_key, enable_factory_create):
    """Test 422 response for malformed JSON or missing fields"""
    payload = {"user_email": "missing_role_id@example.com"}

    resp = client.put(
        INTERNAL_ROLES_URL,
        headers={"X-API-Key": internal_admin_user_api_key},
        json=payload
    )

    assert resp.status_code == 422