from uuid import uuid4

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import OrganizationAuditEvent, Privilege, RoleType
from src.db.models.user_models import OrganizationUserRole
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
)


def get_role_id(roles):
    return [str(role.role_id) for role in roles]


class TestUpdateUserOrganizationRoles:
    """Test POST /v1/organizations/:organization_id/users/:user_id endpoint"""

    @pytest.fixture
    def role_a(self):
        return RoleFactory.create(
            privileges={Privilege.MANAGE_ORG_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP},
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    @pytest.fixture
    def role_b(self):
        return RoleFactory.create(
            privileges={
                Privilege.VIEW_ORG_MEMBERSHIP,
                Privilege.VIEW_APPLICATION,
                Privilege.SUBMIT_APPLICATION,
                Privilege.LIST_APPLICATION,
            },
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    @pytest.fixture
    def role_c(self):
        return RoleFactory.create(
            privileges={
                Privilege.VIEW_APPLICATION,
                Privilege.SUBMIT_APPLICATION,
                Privilege.LIST_APPLICATION,
            },
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    def test_update_user_organization_roles(
        self, client, db_session, enable_factory_create, role_a, role_b, role_c
    ):
        """Should allow non-admin user with manage privileges to assign non-admin roles."""
        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=role_a)

        # Create target user in organization
        org_user = OrganizationUserFactory.create(organization=org)
        roles_assigned = get_role_id([role_b, role_c])

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": roles_assigned},
        )
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert len(data) == len(roles_assigned)
        assert set([role["role_id"] for role in data]) == set(roles_assigned)

        # Verify audit history recorded
        assert len(org.organization_audits) == 1
        assert org.organization_audits[0].user.user_id == request_user.user_id
        assert org.organization_audits[0].target_user_id == org_user.user_id
        assert (
            org.organization_audits[0].organization_audit_event
            == OrganizationAuditEvent.USER_ROLE_UPDATED
        )

    def test_update_user_overwrites_existing_roles(
        self,
        client,
        db_session,
        enable_factory_create,
        role_a,
        role_b,
        role_c,
    ):
        """Should overwrite existing roles with the new set of roles."""
        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=role_a)

        # Create target user with existing roles
        org_user = OrganizationUserFactory.create(organization=org)
        user_role_1 = OrganizationUserRoleFactory.create(organization_user=org_user, role=role_b)
        user_role_2 = OrganizationUserRoleFactory.create(organization_user=org_user, role=role_c)

        # Verify original roles
        original_role_ids = {r.role.role_id for r in org_user.organization_user_roles}
        assert user_role_1.role_id in original_role_ids
        assert user_role_2.role_id in original_role_ids

        roles_assigned = get_role_id([role_a])

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

        # Verify audit history recorded
        assert len(org.organization_audits) == 1
        assert org.organization_audits[0].user.user_id == request_user.user_id
        assert org.organization_audits[0].target_user_id == org_user.user_id
        assert (
            org.organization_audits[0].organization_audit_event
            == OrganizationAuditEvent.USER_ROLE_UPDATED
        )

    def test_update_user_organization_roles_404_organization(
        self, client, db_session, user, enable_factory_create, role_a
    ):
        """Should return 404 when organization does not exist."""
        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.put(
            f"/v1/organizations/{uuid4()}/users/{user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": [role_a.role_id]},
        )
        assert resp.status_code == 404

    def test_update_user_organization_roles_403_target_user(
        self, client, db_session, user, enable_factory_create, role_a
    ):
        """Should return 403 if target user is not part of the organization."""
        # Create JWT token
        _, org, token = create_user_in_org(db_session=db_session, role=role_a)

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{uuid4()}",
            headers={"X-SGG-Token": token},
            json={"role_ids": [role_a.role_id]},
        )
        assert resp.status_code == 404

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
            json={"role_ids": [role_c.role_id]},
        )
        assert resp.status_code == 403

    def test_update_user_organization_roles_existing_roles(
        self,
        client,
        db_session,
        user,
        enable_factory_create,
        role_a,
        role_b,
    ):
        """Should not update if it is the same exact set of roles as the existing roles."""

        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=role_a)

        # Create target user in organization with roles
        org_user = OrganizationUserFactory.create(organization=org, user=user)
        org_user_role = OrganizationUserRoleFactory(organization_user=org_user, role=role_b)

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": get_role_id([role_b])},
        )
        data = resp.get_json()["data"]
        assert resp.status_code == 200
        assert len(data) == 1

        db_user_role = (
            db_session.query(OrganizationUserRole)
            .filter(OrganizationUserRole.organization_user_id == org_user.organization_user_id)
            .one()
        )
        assert db_user_role.created_at == org_user_role.created_at

        # Verify audit history not recorded
        assert len(org.organization_audits) == 0

    def test_update_user_organization_roles_404_missing_role_ids(
        self, client, db_session, enable_factory_create, role_a, role_b
    ):
        """Should raise error if any of the role_ids are not found in the database."""

        # Create user in organization with given role
        request_user, org, token = create_user_in_org(db_session=db_session, role=role_a)

        # Create target user
        org_user = OrganizationUserFactory.create(organization=org)

        # Make request
        resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": [str(role_b.role_id), str(uuid4())]},
        )

        assert resp.status_code == 404
