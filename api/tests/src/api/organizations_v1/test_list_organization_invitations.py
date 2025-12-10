import uuid
from datetime import UTC, datetime, timedelta

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    LinkOrganizationInvitationToRoleFactory,
    OrganizationFactory,
    OrganizationInvitationFactory,
    RoleFactory,
    UserFactory,
)


class TestListOrganizationInvitations:
    """Test POST /v1/organizations/:organization_id/invitations/list endpoint"""

    def test_list_invitations_200_success_no_filters(
        self, client, db_session, enable_factory_create
    ):
        """Test successful invitation listing without filters"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Create some test invitations

        inviter = UserFactory.create()
        role = RoleFactory.create()

        # Create invitations with different statuses
        invitation1 = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email="pending@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation1,
            role=role,
        )

        invitation2 = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email="accepted@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=datetime.now(UTC) - timedelta(days=1),
            rejected_at=None,
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation2,
            role=role,
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Check that invitations are ordered by created_at desc (newest first)
        assert data["data"][0]["invitee_email"] in ["pending@example.com", "accepted@example.com"]
        assert data["data"][1]["invitee_email"] in ["pending@example.com", "accepted@example.com"]

    def test_list_invitations_200_success_with_status_filter(
        self, client, db_session, enable_factory_create
    ):
        """Test successful invitation listing with status filtering"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Create test invitations with different statuses

        inviter = UserFactory.create()

        # Pending invitation
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email="pending@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
        )

        # Accepted invitation
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email="accepted@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=datetime.now(UTC) - timedelta(days=1),
            rejected_at=None,
        )

        db_session.commit()

        # Filter for only pending invitations
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                },
                "filters": {"status": {"one_of": ["pending"]}},
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        assert data["data"][0]["invitee_email"] == "pending@example.com"
        assert data["data"][0]["status"] == "pending"

    def test_list_invitations_200_success_empty_list(
        self, client, db_session, enable_factory_create
    ):
        """Test successful response with no invitations"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"] == []

    def test_list_invitations_401_no_token(self, client, db_session, enable_factory_create):
        """Test that accessing endpoint without auth token returns 401"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 401

    def test_list_invitations_403_insufficient_privileges(
        self, client, db_session, enable_factory_create
    ):
        """Test that user without VIEW_ORG_MEMBERSHIP privilege gets 403"""
        user, organization, token = create_user_in_org(
            privileges=[],  # No privileges
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 403

    def test_list_invitations_403_user_not_in_organization(
        self, client, db_session, enable_factory_create
    ):
        """Test that user not in organization gets 403"""
        user, token = create_user_not_in_org(db_session)

        # Create a different organization

        other_organization = OrganizationFactory.create()
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{other_organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 403

    def test_list_invitations_404_organization_not_found(
        self, client, db_session, enable_factory_create
    ):
        """Test that non-existent organization returns 404"""
        user, token = create_user_not_in_org(db_session)
        fake_org_id = uuid.uuid4()

        resp = client.post(
            f"/v1/organizations/{fake_org_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 404

    def test_list_invitations_400_invalid_status_filter(
        self, client, db_session, enable_factory_create
    ):
        """Test that invalid status filter values return 400"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                },
                "filters": {"status": {"one_of": ["invalid_status"]}},
            },
        )

        assert resp.status_code == 422  # Validation error

    def test_list_invitations_includes_all_required_fields(
        self, client, db_session, enable_factory_create
    ):
        """Test that response includes all required fields per specification"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Create a test invitation with all relationships

        inviter = UserFactory.create()
        invitee = UserFactory.create()
        role = RoleFactory.create()

        invitation = OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_user=invitee,
            invitee_email="test@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=invitation,
            role=role,
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        invitation_data = data["data"][0]

        # Check all required fields are present
        required_fields = [
            "organization_invitation_id",
            "invitee_email",
            "status",
            "created_at",
            "expires_at",
            "accepted_at",
            "rejected_at",
            "inviter_user",
            "invitee_user",
            "roles",
        ]

        for field in required_fields:
            assert field in invitation_data, f"Missing required field: {field}"

        # Check inviter_user structure
        assert "user_id" in invitation_data["inviter_user"]
        assert "email" in invitation_data["inviter_user"]
        assert "first_name" in invitation_data["inviter_user"]
        assert "last_name" in invitation_data["inviter_user"]

        # Check invitee_user structure (can be null)
        if invitation_data["invitee_user"] is not None:
            assert "user_id" in invitation_data["invitee_user"]
            assert "email" in invitation_data["invitee_user"]
            assert "first_name" in invitation_data["invitee_user"]
            assert "last_name" in invitation_data["invitee_user"]

        # Check roles structure
        assert len(invitation_data["roles"]) > 0
        role_data = invitation_data["roles"][0]
        assert "role_id" in role_data
        assert "role_name" in role_data

    @pytest.mark.parametrize(
        "privilege_set,expected_status",
        [
            ([Privilege.MANAGE_ORG_MEMBERS], 200),  # Correct privilege
            ([Privilege.VIEW_ORG_MEMBERSHIP], 403),  # Wrong privilege
            ([], 403),  # No privileges
        ],
    )
    def test_list_invitations_privilege_requirements(
        self, privilege_set, expected_status, client, db_session, enable_factory_create
    ):
        """Test that only users with MANAGE_ORG_MEMBERS privilege can access endpoint"""
        user, organization, token = create_user_in_org(
            privileges=privilege_set,
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                }
            },
        )

        assert resp.status_code == expected_status

    def test_list_invitations_filters_expired_invitations(
        self, client, db_session, enable_factory_create
    ):
        """Test that expired invitations are properly identified and can be filtered"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Create an expired invitation

        inviter = UserFactory.create()

        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email="expired@example.com",
            expires_at=datetime.now(UTC) - timedelta(days=1),  # Expired
            accepted_at=None,
            rejected_at=None,
        )

        db_session.commit()

        # Filter for expired invitations
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "filters": {"status": {"one_of": ["expired"]}},
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                },
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        assert data["data"][0]["status"] == "expired"

    def test_list_invitations_default_sorting(self, client, db_session, enable_factory_create):
        """Test default sorting: email"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        inviter = UserFactory.create()
        for email in ["a@example.com", "b@example.com", "a@example.com"]:
            OrganizationInvitationFactory.create(
                organization=organization,
                inviter_user=inviter,
                invitee_email=email,
            )

        # Default sort by email ASC
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations/list",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 10,
                },
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 3

        # Check that sorting is correct
        emails_in_order = [inv["invitee_email"] for inv in data["data"]]
        assert emails_in_order == ["a@example.com", "a@example.com", "b@example.com"]
