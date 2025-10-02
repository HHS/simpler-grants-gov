from uuid import uuid4

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from src.constants.static_role_values import ORG_ADMIN, ORG_ADMIN_ID
from src.db.models.user_models import OrganizationUserRole, Role
import src.services.organizations_v1.update_user_organization_roles as update_user_org_roles
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import OrganizationFactory, OrganizationUserFactory, RoleFactory, \
    OrganizationUserRoleFactory

def get_static_role(db_session, role_id):
    return  db_session.query(Role).filter(Role.role_id == role_id).one()

ROLE_ADMIN_A = RoleFactory.build(privileges={Privilege.MANAGE_ORG_ADMIN_MEMBERS, Privilege.MANAGE_ORG_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP})
ROLE_ADMIN_B = RoleFactory.build(privileges={Privilege.MANAGE_ORG_ADMIN_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP})
ROLE_B = RoleFactory.build(privileges={Privilege.VIEW_APPLICATION, Privilege.SUBMIT_APPLICATION, Privilege.LIST_APPLICATION})
ROLE_C = RoleFactory.build(privileges={Privilege.VIEW_APPLICATION, Privilege.LIST_APPLICATION})

@pytest.fixture
def override_admin_roles(monkeypatch):
    monkeypatch.setattr(update_user_org_roles, "ADMIN_ROLES", [str(role.role_id) for role in [ROLE_ADMIN_A, ROLE_ADMIN_B]])

def get_role_id(roles):
    return [str(role.role_id) for role in roles]

@pytest.mark.parametrize(
    "has_role,assigning_role",
    [
        # User with admin role assigning same admin role
        (ROLE_ADMIN_A, [ROLE_ADMIN_A]),
        # User with admin role assigning a different admin role
        (ROLE_ADMIN_A, [ROLE_ADMIN_B]),
        # User with Non-Admin role assigning multiple non admin role
        (ROLE_ADMIN_B, [ROLE_ADMIN_B,ROLE_B]),
    ]
)
def test_update_user_organization_roles_200(db_session, user, enable_factory_create, client, has_role, assigning_role, override_admin_roles, monkeypatch):

    # Create user in organization with given privilege
    request_user, org, token = create_user_in_org(db_session=db_session, role=has_role)

    # Create target user in organization
    org_user = OrganizationUserFactory.create(organization=org)
    roles_assigned = get_role_id(assigning_role)

    def mock_get_role(db_session, roles_assigned):
        return assigning_role

    monkeypatch.setattr(update_user_org_roles, "get_role", mock_get_role)

    # Make request
    resp = client.put(
        f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
        headers={"X-SGG-Token": token},
        json={"role_ids": roles_assigned},
    )
    data = resp.get_json()["data"]

    assert resp.status_code == 200
    assert len(data) == len(roles_assigned)
    assert [role["role_id"] for role in data] == roles_assigned


def test_update_user_organization_roles_admin_role(db_session, user, enable_factory_create, client):
    # Create user in organization with admin privileges
    organization = OrganizationFactory()
    admin_org = get_static_role(db_session, ORG_ADMIN.role_id)
    org_user_1 = OrganizationUserFactory.create(organization=organization, user=user)

    OrganizationUserRoleFactory.create(organization_user=org_user_1, role=admin_org)
    token, _ = create_jwt_for_user(user, db_session)


    # Create target user in organization
    org_user = OrganizationUserFactory.create(organization=organization)

    # Make request
    resp = client.put(
        f"/v1/organizations/{organization.organization_id}/users/{org_user.user_id}",
        headers={"X-SGG-Token": token},
        json={"role_ids": [ORG_ADMIN_ID]},
    )
    data = resp.get_json()["data"]

    assert resp.status_code == 200
    assert len(data) == 1
    assert data[0]["role_id"] == str(admin_org.role_id)

#with exisiting roles
def test_update_user_organization_roles_404_organization(db_session, user, enable_factory_create, client):
    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    # Make request
    resp = client.put(
        f"/v1/organizations/{uuid4()}/users/{user.user_id}",
        headers={"X-SGG-Token": token},
        json={"role_ids": []},
    )
    assert resp.status_code == 404

def test_update_user_organization_roles_403_target_user(db_session, user, enable_factory_create, client):
    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    # Create Organization
    org = OrganizationFactory.create()

    # Make request
    resp = client.put(
        f"/v1/organizations/{org.organization_id}/users/{uuid4()}",
        headers={"X-SGG-Token": token},
        json={"role_ids": []},
    )
    assert resp.status_code == 403

def test_update_user_organization_roles_403_no_access(db_session, user, enable_factory_create, client):
    # Create user in organization with limited privileges
    _, org, token = create_user_in_org(
        privileges=[Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    # Create target user in organization
    org_user = OrganizationUserFactory.create(
        user=user, organization=org
    )

    # Make request
    resp = client.put(
        f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
        headers={"X-SGG-Token": token},
        json={"role_ids": []},
    )
    assert resp.status_code == 403

def test_update_user_organization_roles_403_no_admin_access(db_session, user, enable_factory_create, client):
    # Create user in organization with limited privileges
    _, org, token = create_user_in_org(
        privileges=[Privilege.VIEW_APPLICATION],
        db_session=db_session,
    )
    # Create target user in organization
    org_user = OrganizationUserFactory.create(
        user=user, organization=org
    )

    # Make request
    resp = client.put(
        f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
        headers={"X-SGG-Token": token},
        json={"role_ids": [ORG_ADMIN.role_id]}, # assign to admin role
    )
    assert resp.status_code == 403