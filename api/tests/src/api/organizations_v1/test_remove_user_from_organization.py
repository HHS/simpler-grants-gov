from uuid import uuid4

import pytest

from src.constants.lookup_constants import Privilege
from src.db.models.user_models import OrganizationUser, OrganizationUserRole
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import OrganizationFactory


class TestRemoveUserFromOrganization:
    """Test DELETE /v1/organizations/:organization_id/users/:user_id endpoint"""

    def test_remove_user_from_organization_200_success(
        self, enable_factory_create, client, db_session
    ):
        """Test successful removal of a user from organization"""
        # Create admin user with required privileges
        admin_user, organization, admin_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create target user to be removed
        target_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,
            
        )

        # Verify user exists in organization before removal
        org_user_before = (
            db_session.query(OrganizationUser)
            .filter(
                OrganizationUser.organization_id == organization.organization_id,
                OrganizationUser.user_id == target_user.user_id,
            )
            .first()
        )
        assert org_user_before is not None

        # Make request
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{target_user.user_id}",
            headers={"X-SGG-Token": admin_token},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"] is None

        # Verify user was removed from organization
        org_user_after = (
            db_session.query(OrganizationUser)
            .filter(
                OrganizationUser.organization_id == organization.organization_id,
                OrganizationUser.user_id == target_user.user_id,
            )
            .first()
        )
        assert org_user_after is None

    def test_remove_user_cascades_delete_roles(self, enable_factory_create, client, db_session):
        """Test that removing user also deletes their organization roles"""
        # Create admin user with required privileges
        admin_user, organization, admin_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create target user with roles
        target_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,
            
        )

        # Get the organization user record
        org_user = (
            db_session.query(OrganizationUser)
            .filter(
                OrganizationUser.organization_id == organization.organization_id,
                OrganizationUser.user_id == target_user.user_id,
            )
            .first()
        )

        # Verify roles exist before removal
        roles_before = (
            db_session.query(OrganizationUserRole)
            .filter(OrganizationUserRole.organization_user_id == org_user.organization_user_id)
            .all()
        )
        assert len(roles_before) > 0

        # Make request
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{target_user.user_id}",
            headers={"X-SGG-Token": admin_token},
        )

        assert resp.status_code == 200

        # Verify roles were cascade deleted
        roles_after = (
            db_session.query(OrganizationUserRole)
            .filter(OrganizationUserRole.organization_user_id == org_user.organization_user_id)
            .all()
        )
        assert len(roles_after) == 0

    def test_remove_user_403_insufficient_privileges(
        self, enable_factory_create, client, db_session
    ):
        """Test that user without MANAGE_ORG_MEMBERS privilege gets 403"""
        # Create user with insufficient privileges
        requesting_user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],  # Not MANAGE_ORG_MEMBERS
            db_session=db_session,

        )

        # Create target user
        target_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,

        )

        # Make request
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{target_user.user_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_remove_user_403_last_admin_protection(self, enable_factory_create, client, db_session):
        """Test preventing removal of the last admin from organization"""
        # Create single admin user with manage privileges
        admin_user, organization, admin_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Try to remove the only user with MANAGE_ORG_MEMBERS privilege (themselves)
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{admin_user.user_id}",
            headers={"X-SGG-Token": admin_token},
        )

        assert resp.status_code == 403
        data = resp.get_json()
        assert "Cannot remove the last administrator from organization" in data["message"]

    def test_remove_user_multiple_admins_allows_removal(
        self, enable_factory_create, client, db_session
    ):
        """Test that removal is allowed when multiple users with MANAGE_ORG_MEMBERS exist"""
        # Create first admin user with manage privileges
        admin1, organization, admin1_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create second admin user with manage privileges
        admin2, _, _ = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            organization=organization,

        )

        # Remove one admin (should succeed since there's another admin)
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{admin2.user_id}",
            headers={"X-SGG-Token": admin1_token},
        )

        assert resp.status_code == 200

    def test_remove_user_404_organization_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Test that non-existent organization returns 404"""
        # Create user with privileges
        user, token = create_user_not_in_org(db_session)

        # Try to remove user from non-existent organization
        resp = client.delete(
            f"/v1/organizations/{uuid4()}/users/{uuid4()}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_remove_user_404_user_not_in_organization(
        self, enable_factory_create, client, db_session
    ):
        """Test that user not in organization returns 404"""
        # Create admin user
        admin_user, organization, admin_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create user not in the organization
        other_user, _ = create_user_not_in_org(db_session)

        # Try to remove user who isn't in the organization
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{other_user.user_id}",
            headers={"X-SGG-Token": admin_token},
        )

        assert resp.status_code == 404

    def test_remove_user_403_user_not_member_of_target_organization(
        self, enable_factory_create, client, db_session
    ):
        """Test that user from different organization cannot remove users from another org"""
        # Create user with privileges in their own organization
        user, user_org, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create different organization with its own member
        other_organization = OrganizationFactory.create()
        target_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=other_organization,

        )

        # User from first organization tries to remove user from second organization
        resp = client.delete(
            f"/v1/organizations/{other_organization.organization_id}/users/{target_user.user_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_remove_user_401_no_token(self, client):
        """Test that accessing endpoint without auth token returns 401"""
        resp = client.delete(f"/v1/organizations/{uuid4()}/users/{uuid4()}")
        assert resp.status_code == 401

    def test_remove_user_401_invalid_token(self, client):
        """Test that accessing endpoint with invalid token returns 401"""
        resp = client.delete(
            f"/v1/organizations/{uuid4()}/users/{uuid4()}",
            headers={"X-SGG-Token": "invalid-token"},
        )
        assert resp.status_code == 401

    def test_remove_user_can_remove_non_admin_member(
        self, enable_factory_create, client, db_session
    ):
        """Test that user with MANAGE_ORG_MEMBERS can remove regular members"""
        # Create admin user with manage privileges
        admin_user, organization, admin_token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            
        )

        # Create regular member
        member_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,

        )

        # Remove member (should succeed)
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{member_user.user_id}",
            headers={"X-SGG-Token": admin_token},
        )

        assert resp.status_code == 200

    @pytest.mark.parametrize(
        "privilege_set,expected_status",
        [
            ([Privilege.MANAGE_ORG_MEMBERS], 200),
            ([Privilege.VIEW_ORG_MEMBERSHIP], 403),
            ([Privilege.VIEW_APPLICATION], 403),
            ([], 403),
        ],
    )
    def test_remove_user_privilege_requirements(
        self, enable_factory_create, client, db_session, privilege_set, expected_status
    ):
        """Test various privilege combinations for removal permissions"""
        # Create user with specified privileges
        requesting_user, organization, token = create_user_in_org(
            privileges=privilege_set,
            db_session=db_session,

        )

        # Create target user to remove
        target_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,

        )

        # Make request
        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/users/{target_user.user_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == expected_status

        if expected_status == 200:
            data = resp.get_json()
            assert data["message"] == "Success"
            assert data["data"] is None
