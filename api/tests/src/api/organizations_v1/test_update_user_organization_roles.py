from uuid import uuid4

import pytest

import src.services.organizations_v1.update_user_organization_roles as update_user_org_roles
from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
)


def get_role_id(roles):
    return [str(role.role_id) for role in roles]


class TestUpdateUserOrganizationRoles:
    """Test POST /v1/organizations/:organization_id/users/:user_id endpoint"""

    @pytest.fixture
    def admin_role_a(self):
        return RoleFactory.create(
            privileges={
                Privilege.MANAGE_ORG_ADMIN_MEMBERS,
                Privilege.MANAGE_ORG_MEMBERS,
                Privilege.VIEW_ORG_MEMBERSHIP,
            }
        )

    @pytest.fixture
    def admin_role_b(self):
        return RoleFactory.create(
            privileges={Privilege.MANAGE_ORG_ADMIN_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP}
        )

    @pytest.fixture
    def role_b(self):
        return RoleFactory.create(
            privileges={Privilege.MANAGE_ORG_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP}
        )

    @pytest.fixture
    def role_c(self):
        return RoleFactory.create(
            privileges={
                Privilege.VIEW_APPLICATION,
                Privilege.SUBMIT_APPLICATION,
                Privilege.LIST_APPLICATION,
            }
        )

    @pytest.fixture
    def override_admin_roles(self, monkeypatch_class, admin_role_a, admin_role_b):
        """Override the global ADMIN_ROLES list for the test suite."""
        monkeypatch_class.setattr(
            update_user_org_roles,
            "ADMIN_ROLES",
            [str(role.role_id) for role in [admin_role_a, admin_role_b]],
        )

    def test_update_user_organization_roles_admin(
        self,
        client,
        db_session,
        enable_factory_create,
        override_admin_roles,
        admin_role_a,
        admin_role_b,
    ):
        """Should allow user with admin privileges to assign admin roles to a user."""

        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=admin_role_a)

        # Create target user in organization
        org_user = OrganizationUserFactory.create(organization=org)
        roles_assigned = get_role_id([admin_role_a, admin_role_b])

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

    def test_update_user_organization_roles_non_admin_role(
        self, client, db_session, enable_factory_create, role_b, role_c
    ):
        """Should allow non-admin user with manage privileges to assign non-admin roles."""
        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=role_b)

        # Create target user in organization
        org_user = OrganizationUserFactory.create(organization=org)
        roles_assigned = get_role_id([role_c])

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

    def test_update_user_overwrites_existing_roles(
        self,
        client,
        db_session,
        enable_factory_create,
        admin_role_a,
        role_b,
        role_c,
        admin_role_b,
    ):
        """Should overwrite existing roles with the new set of roles."""
        # Create user in organization with given role
        _, org, token = create_user_in_org(db_session=db_session, role=role_b)

        # Create target user with existing roles
        org_user = OrganizationUserFactory.create(organization=org)
        user_role_1 = OrganizationUserRoleFactory.create(organization_user=org_user, role=role_b)
        user_role_2 = OrganizationUserRoleFactory.create(organization_user=org_user, role=role_c)

        # Verify original roles
        original_role_ids = {r.role.role_id for r in org_user.organization_user_roles}
        assert user_role_1.role_id in original_role_ids
        assert user_role_2.role_id in original_role_ids

        roles_assigned = get_role_id([admin_role_b])

        # overwrite with new role
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": roles_assigned},
        )
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert len(data) == len(roles_assigned)
        assert [role["role_id"] for role in data] == roles_assigned

    def test_update_user_organization_roles_404_organization(
        self, client, db_session, user, enable_factory_create
    ):
        """Should return 404 when organization does not exist."""
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

    def test_update_user_organization_roles_403_target_user(
        self,
        client,
        db_session,
        user,
        enable_factory_create,
    ):
        """Should return 403 if target user is not part of the organization."""
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

    def test_update_user_organization_roles_403_no_access(
        self, client, db_session, user, enable_factory_create, role_c
    ):
        """Should return 403 if acting user lacks privileges to manage members."""
        # Create user in organization with limited privileges
        _, org, token = create_user_in_org(db_session=db_session, role=role_c)
        # Create target user in organization
        org_user = OrganizationUserFactory.create(user=user, organization=org)

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": []},
        )
        assert resp.status_code == 403

    def test_update_user_organization_roles_403_no_admin_access(
        self,
        client,
        db_session,
        user,
        enable_factory_create,
        role_b,
        override_admin_roles,
        admin_role_a,
    ):
        """Should return 403 if acting user can manage members but not admin members."""
        # Create user in organization with limited privileges
        _, org, token = create_user_in_org(db_session=db_session, role=role_b)
        # Create target user in organization
        org_user = OrganizationUserFactory.create(user=user, organization=org)

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": [admin_role_a.role_id]},
        )
        assert resp.status_code == 403
