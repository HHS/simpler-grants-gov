from uuid import uuid4

import pytest
from sqlalchemy import text

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import OrganizationInvitationStatus, Privilege, RoleType
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    LinkOrganizationInvitationToRoleFactory,
    OrganizationFactory,
    OrganizationInvitationFactory,
    RoleFactory,
    UserFactory,
    UserProfileFactory,
)


class TestUserInvitationsList:
    """Test POST /v1/users/:user_id/invitations/list endpoint"""

    @pytest.fixture
    def org_role(self):
        """Create an organization role for testing"""
        return RoleFactory.create(
            privileges={Privilege.VIEW_ORG_MEMBERSHIP, Privilege.START_APPLICATION},
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    def test_get_user_invitations_200_success(
        self, client, db_session, enable_factory_create, org_role
    ):
        """Test successful retrieval of user invitations"""
        # Use unique emails for this test
        user_email = f"user-success-{uuid4()}@example.com"
        inviter_email = f"admin-success-{uuid4()}@org.com"

        # Create user with login.gov external user
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)

        # Create user profile for better test data
        user_profile = UserProfileFactory.create(user=user, first_name="Test", last_name="User")

        # Create inviter user with profile
        inviter = UserFactory.create()
        inviter_profile = UserProfileFactory.create(
            user=inviter, first_name="John", last_name="Doe"
        )
        inviter_external = LinkExternalUserFactory.create(user=inviter, email=inviter_email)

        # Create organization and invitation
        organization = OrganizationFactory.create()
        invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=user_email,  # Match user's email
        )

        # Link role to invitation
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation, role=org_role
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        invitation_data = data["data"][0]
        assert invitation_data["organization_invitation_id"] == str(
            invitation.organization_invitation_id
        )
        assert invitation_data["organization"]["organization_id"] == str(
            organization.organization_id
        )
        assert invitation_data["status"] == OrganizationInvitationStatus.PENDING.value
        assert invitation_data["inviter"]["user_id"] == str(inviter.user_id)
        assert invitation_data["inviter"]["first_name"] == "John"
        assert invitation_data["inviter"]["last_name"] == "Doe"
        assert invitation_data["inviter"]["email"] == inviter_email
        assert len(invitation_data["roles"]) == 1
        assert invitation_data["roles"][0]["role_id"] == str(org_role.role_id)
        assert invitation_data["roles"][0]["role_name"] == org_role.role_name

    def test_get_user_invitations_200_empty_list(self, client, db_session, enable_factory_create):
        """Test user with no invitations returns empty list"""
        # Use unique email for this test
        user_email = f"user-empty-{uuid4()}@example.com"

        # Create user with login.gov external user
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_invitations_200_multiple_invitations(
        self, client, db_session, enable_factory_create, org_role
    ):
        """Test user with multiple invitations"""
        # Use unique emails for this test
        user_email = f"user-multiple-{uuid4()}@example.com"
        inviter_email = f"admin-multiple-{uuid4()}@org.com"

        # Create user with login.gov external user
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)

        # Create inviter user
        inviter = UserFactory.create()
        inviter_external = LinkExternalUserFactory.create(user=inviter, email=inviter_email)

        # Create multiple organizations and invitations
        org1 = OrganizationFactory.create()
        org2 = OrganizationFactory.create()

        invitation1 = OrganizationInvitationFactory.create(
            organization=org1,
            inviter_user=inviter,
            invitee_email=user_email,
        )
        invitation2 = OrganizationInvitationFactory.create(
            organization=org2,
            inviter_user=inviter,
            invitee_email=user_email,
        )

        # Link roles to invitations
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation1, role=org_role
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation2, role=org_role
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Verify both invitations are returned
        invitation_ids = {inv["organization_invitation_id"] for inv in data["data"]}
        expected_ids = {
            str(invitation1.organization_invitation_id),
            str(invitation2.organization_invitation_id),
        }
        assert invitation_ids == expected_ids

    def test_get_user_invitations_200_no_email_returns_empty(
        self, client, db_session, enable_factory_create
    ):
        """Test user without login.gov email returns empty list"""
        # Create user without external user (no email)
        user = UserFactory.create()

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_invitations_200_email_mismatch_returns_empty(
        self, client, db_session, enable_factory_create, org_role
    ):
        """Test user with different email than invitation returns empty list"""
        # Use unique emails for this test
        user_email = f"user-mismatch-{uuid4()}@example.com"
        inviter_email = f"admin-mismatch-{uuid4()}@org.com"
        different_email = f"different-mismatch-{uuid4()}@example.com"

        # Create user with login.gov external user
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)

        # Create inviter user
        inviter = UserFactory.create()
        inviter_external = LinkExternalUserFactory.create(user=inviter, email=inviter_email)

        # Create invitation with different email
        organization = OrganizationFactory.create()
        invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=different_email,  # Different email
        )

        # Link role to invitation
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation, role=org_role
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_invitations_403_forbidden(self, client, db_session, enable_factory_create):
        """Test user trying to access another user's invitations"""
        # Create two users
        user1 = UserFactory.create()
        user2 = UserFactory.create()
        external_user1 = LinkExternalUserFactory.create(user=user1, email="user1@example.com")
        external_user2 = LinkExternalUserFactory.create(user=user2, email="user2@example.com")

        # Create JWT token for user1
        token, _ = create_jwt_for_user(user1, db_session)
        db_session.commit()

        # Try to access user2's invitations
        resp = client.post(
            f"/v1/users/{user2.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 403

    def test_get_user_invitations_401_no_token(self, client):
        """Test request without authentication token"""
        user_id = uuid4()

        resp = client.post(f"/v1/users/{user_id}/invitations/list", json={})

        assert resp.status_code == 401

    def test_get_user_invitations_401_invalid_token(self, client):
        """Test request with invalid token"""
        user_id = uuid4()

        resp = client.post(
            f"/v1/users/{user_id}/invitations/list",
            headers={"X-SGG-Token": "invalid-token"},
            json={},
        )

        assert resp.status_code == 401

    def test_get_user_invitations_includes_all_statuses(
        self, client, db_session, enable_factory_create, org_role
    ):
        """Test that all invitation statuses are returned (not just pending)"""
        # Use unique emails for this test
        user_email = f"user-statuses-{uuid4()}@example.com"
        inviter_email = f"admin-statuses-{uuid4()}@org.com"

        # Create user with login.gov external user
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)

        # Create inviter user
        inviter = UserFactory.create()
        inviter_external = LinkExternalUserFactory.create(user=inviter, email=inviter_email)

        # Create organization
        organization = OrganizationFactory.create()

        # Create invitations with different statuses
        pending_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=user_email,
        )

        accepted_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=user_email,
            accepted_at=db_session.execute(text("SELECT NOW()")).scalar(),
        )

        # Link roles to invitations
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=pending_invitation, role=org_role
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=accepted_invitation, role=org_role
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Verify both statuses are returned
        statuses = {inv["status"] for inv in data["data"]}
        assert OrganizationInvitationStatus.PENDING.value in statuses
        assert OrganizationInvitationStatus.ACCEPTED.value in statuses

    def test_get_user_invitations_data_structure(
        self, client, db_session, enable_factory_create, org_role
    ):
        """Test the complete data structure of invitation response"""
        # Use unique emails for this test
        user_email = f"user-structure-{uuid4()}@example.com"
        inviter_email = f"admin-structure-{uuid4()}@org.com"

        # Create user with login.gov external user and profile
        user = UserFactory.create()
        external_user = LinkExternalUserFactory.create(user=user, email=user_email)
        user_profile = UserProfileFactory.create(user=user)

        # Create inviter user with profile
        inviter = UserFactory.create()
        inviter_profile = UserProfileFactory.create(
            user=inviter, first_name="John", last_name="Doe"
        )
        inviter_external = LinkExternalUserFactory.create(user=inviter, email=inviter_email)

        # Create organization and invitation
        organization = OrganizationFactory.create()
        invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=user_email,
        )

        # Link role to invitation
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation, role=org_role
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(
            f"/v1/users/{user.user_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        invitation_data = data["data"][0]

        # Verify complete structure
        required_fields = [
            "organization_invitation_id",
            "organization",
            "status",
            "created_at",
            "expires_at",
            "inviter",
            "roles",
        ]
        for field in required_fields:
            assert field in invitation_data

        # Verify organization structure
        org_data = invitation_data["organization"]
        assert "organization_id" in org_data
        assert "organization_name" in org_data

        # Verify inviter structure
        inviter_data = invitation_data["inviter"]
        inviter_required_fields = ["user_id", "first_name", "last_name", "email"]
        for field in inviter_required_fields:
            assert field in inviter_data

        # Verify roles structure
        assert isinstance(invitation_data["roles"], list)
        assert len(invitation_data["roles"]) == 1
        role_data = invitation_data["roles"][0]
        role_required_fields = ["role_id", "role_name", "privileges"]
        for field in role_required_fields:
            assert field in role_data

        # Verify privileges is a list
        assert isinstance(role_data["privileges"], list)
        assert len(role_data["privileges"]) > 0
