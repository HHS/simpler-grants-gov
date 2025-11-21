from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

import pytest

from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.entity_models import LinkOrganizationInvitationToRole, OrganizationInvitation
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    LinkOrganizationInvitationToRoleFactory,
    OrganizationFactory,
    OrganizationInvitationFactory,
    RoleFactory,
)


class TestCreateOrganizationInvitation:
    """Test POST /v1/organizations/:organization_id/invitations endpoint"""

    @pytest.fixture
    def admin_role(self):
        return RoleFactory.create(
            privileges={Privilege.MANAGE_ORG_MEMBERS, Privilege.VIEW_ORG_MEMBERSHIP},
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    @pytest.fixture
    def member_role(self):
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
    def limited_role(self):
        return RoleFactory.create(
            privileges={
                Privilege.VIEW_APPLICATION,
                Privilege.SUBMIT_APPLICATION,
                Privilege.LIST_APPLICATION,
            },
            is_core=True,
            role_types=[RoleType.ORGANIZATION],
        )

    def test_create_invitation_single_role_success(
        self, client, db_session, enable_factory_create, admin_role, member_role, monkeypatch
    ):
        """Should successfully create invitation with single role"""
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        _clear_mock_responses()

        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "newuser@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]

        # Verify response structure
        assert data["organization_id"] == str(organization.organization_id)
        assert data["invitee_email"] == "newuser@example.com"
        assert data["status"] == "pending"
        assert "expires_at" in data
        assert "created_at" in data
        assert len(data["roles"]) == 1
        assert data["roles"][0]["role_id"] == str(member_role.role_id)
        assert data["roles"][0]["role_name"] == member_role.role_name

        # Verify database records created
        invitation = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "newuser@example.com")
            .first()
        )
        assert invitation is not None
        assert invitation.organization_id == organization.organization_id
        assert invitation.inviter_user_id == admin_user.user_id

        # Verify role association created
        role_links = (
            db_session.query(LinkOrganizationInvitationToRole)
            .filter(
                LinkOrganizationInvitationToRole.organization_invitation_id
                == invitation.organization_invitation_id
            )
            .all()
        )
        assert len(role_links) == 1
        assert role_links[0].role_id == member_role.role_id

        # Verify email was sent
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1
        request = mock_responses[0][0]
        assert request["MessageRequest"]["Addresses"] == {
            "newuser@example.com": {"ChannelType": "EMAIL"}
        }

    def test_create_invitation_multiple_roles_success(
        self, client, db_session, enable_factory_create, admin_role, member_role, limited_role
    ):
        """Should successfully create invitation with multiple roles"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        role_ids = [str(member_role.role_id), str(limited_role.role_id)]

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "multiuser@example.com",
                "role_ids": role_ids,
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]

        # Verify response has both roles
        assert len(data["roles"]) == 2
        returned_role_ids = {role["role_id"] for role in data["roles"]}
        assert returned_role_ids == set(role_ids)

        # Verify database has both role associations
        invitation = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "multiuser@example.com")
            .first()
        )
        role_links = (
            db_session.query(LinkOrganizationInvitationToRole)
            .filter(
                LinkOrganizationInvitationToRole.organization_invitation_id
                == invitation.organization_invitation_id
            )
            .all()
        )
        assert len(role_links) == 2
        db_role_ids = {str(link.role_id) for link in role_links}
        assert db_role_ids == set(role_ids)

    def test_create_invitation_when_previous_expired(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should allow creating new invitation when previous one is expired"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Create expired invitation
        expired_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            invitee_email="expired@example.com",
            is_expired=True,
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=expired_invitation, role=member_role
        )

        # Make request for same email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "expired@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data["invitee_email"] == "expired@example.com"
        assert data["status"] == "pending"

        # Verify we now have two invitations for this email
        invitations = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "expired@example.com")
            .all()
        )
        assert len(invitations) == 2

    def test_create_invitation_when_previous_rejected(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should allow creating new invitation when previous one was rejected"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Create rejected invitation
        rejected_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            invitee_email="rejected@example.com",
            is_rejected=True,
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=rejected_invitation, role=member_role
        )

        # Make request for same email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "rejected@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data["invitee_email"] == "rejected@example.com"
        assert data["status"] == "pending"

    def test_create_invitation_401_no_token(self, client, enable_factory_create):
        """Should return 401 when no authentication token provided"""
        resp = client.post(
            f"/v1/organizations/{uuid4()}/invitations",
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(uuid4())],
            },
        )
        assert resp.status_code == 401

    def test_create_invitation_401_invalid_token(self, client, enable_factory_create):
        """Should return 401 when invalid authentication token provided"""
        resp = client.post(
            f"/v1/organizations/{uuid4()}/invitations",
            headers={"X-SGG-Token": "invalid-token"},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(uuid4())],
            },
        )
        assert resp.status_code == 401

    def test_create_invitation_403_insufficient_privileges(
        self, client, db_session, enable_factory_create, limited_role, member_role
    ):
        """Should return 403 when user lacks MANAGE_ORG_MEMBERS privilege"""
        # Create user with limited privileges
        user, organization, token = create_user_in_org(db_session=db_session, role=limited_role)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 403

    def test_create_invitation_403_not_organization_member(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 403 when user is not a member of the organization"""
        # Create user not in any organization
        user, token = create_user_not_in_org(db_session)

        # Create organization (user is NOT a member)
        organization = OrganizationFactory.create()

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 403

    def test_create_invitation_404_organization_not_found(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 404 when organization does not exist"""
        # Create user (doesn't need to be in any organization for this test)
        user, token = create_user_not_in_org(db_session)

        # Try to create invitation for non-existent organization
        resp = client.post(
            f"/v1/organizations/{uuid4()}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 404

    def test_create_invitation_404_invalid_role_ids(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 404 when role IDs don't exist"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request with non-existent role ID
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(uuid4())],
            },
        )
        assert resp.status_code == 404

    def test_create_invitation_404_mixed_valid_invalid_role_ids(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 404 when some role IDs are valid and some are not"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request with mix of valid and invalid role IDs
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(member_role.role_id), str(uuid4())],
            },
        )
        assert resp.status_code == 404

    def test_create_invitation_422_duplicate_active_invitation(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 422 when active invitation already exists for email"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)
        # Create expired invitation
        expired_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            invitee_email="pending@example.com",
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=expired_invitation, role=member_role
        )
        # Create pending invitation
        pending_invitation = OrganizationInvitationFactory.create(
            organization=organization,
            invitee_email="pending@example.com",
        )
        LinkOrganizationInvitationToRoleFactory.create(
            organization_invitation=pending_invitation, role=member_role
        )

        # Try to create another invitation for same email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "pending@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 422
        assert "active invitation already exists" in resp.get_json()["message"]

    def test_create_invitation_422_user_already_member(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 422 when trying to invite existing organization member"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Create another user in the same organization
        existing_member, _, _ = create_user_in_org(
            db_session=db_session, organization=organization, role=member_role
        )

        # Try to invite the existing member
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": existing_member.email,
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 422
        assert "already a member" in resp.get_json()["message"]

    def test_create_invitation_422_invalid_email_format(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return 422 when email format is invalid"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request with invalid email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "not-an-email",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 422

    def test_create_invitation_422_empty_role_ids(
        self, client, db_session, enable_factory_create, admin_role
    ):
        """Should return 422 when role_ids list is empty"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request with empty role_ids
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [],
            },
        )
        assert resp.status_code == 422

    def test_create_invitation_422_missing_required_fields(
        self, client, db_session, enable_factory_create, admin_role
    ):
        """Should return 422 when required fields are missing"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Test missing invitee_email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={"role_ids": [str(uuid4())]},
        )
        assert resp.status_code == 422

        # Test missing role_ids
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={"invitee_email": "test@example.com"},
        )
        assert resp.status_code == 422

    def test_create_invitation_400_malformed_json(
        self, client, db_session, enable_factory_create, admin_role
    ):
        """Should return 400 when JSON is malformed"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request with malformed JSON
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token, "Content-Type": "application/json"},
            data='{"invitee_email": "test@example.com", "role_ids": [',  # Malformed JSON
        )
        assert resp.status_code == 400

    def test_create_invitation_email_case_insensitive(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should handle email case insensitively"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Create invitation with uppercase email
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "TEST@EXAMPLE.COM",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 200

        # Verify email is stored in lowercase
        invitation = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "test@example.com")
            .first()
        )
        assert invitation is not None

        # Try to create another invitation with different case - should fail due to case-insensitive duplicate check
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "test@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )
        assert resp.status_code == 422

    def test_create_invitation_expiration_date_set(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should set expiration date 7 days in the future"""

        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        before_request = datetime.now(timezone.utc)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "expiry@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        after_request = datetime.now(timezone.utc)

        assert resp.status_code == 200

        # Verify expiration date is approximately 7 days from now
        invitation = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "expiry@example.com")
            .first()
        )

        expected_min_expiry = before_request + timedelta(days=7)
        expected_max_expiry = after_request + timedelta(days=7)

        assert expected_min_expiry <= invitation.expires_at <= expected_max_expiry

    def test_create_invitation_response_data_matches_database(
        self, client, db_session, enable_factory_create, admin_role, member_role
    ):
        """Should return response data that matches what's stored in database"""
        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "verify@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()["data"]

        # Get invitation from database
        invitation = (
            db_session.query(OrganizationInvitation)
            .filter(OrganizationInvitation.invitee_email == "verify@example.com")
            .first()
        )

        # Verify response matches database
        assert data["organization_invitation_id"] == str(invitation.organization_invitation_id)
        assert data["organization_id"] == str(invitation.organization_id)
        assert data["invitee_email"] == invitation.invitee_email
        assert data["status"] == invitation.status.value
        assert data["expires_at"] == invitation.expires_at.isoformat()
        assert data["created_at"] == invitation.created_at.isoformat()

        # Verify roles match
        db_roles = invitation.roles
        assert len(data["roles"]) == len(db_roles)
        assert data["roles"][0]["role_id"] == str(db_roles[0].role_id)
        assert data["roles"][0]["role_name"] == db_roles[0].role_name

    def test_create_invitation_sends_email_with_proper_content(
        self, client, db_session, enable_factory_create, admin_role, member_role, monkeypatch
    ):
        """Should send invitation email with proper content"""
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        _clear_mock_responses()

        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "newuser@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200

        # Verify email was sent with correct content
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        request = mock_responses[0][0]
        email_config = request["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
            "SimpleEmail"
        ]

        # Verify subject contains required text
        subject = email_config["Subject"]["Data"]
        assert "Invitation to join" in subject

        # Verify HTML content contains required information
        html_content = email_config["HtmlPart"]["Data"]
        assert "invited" in html_content.lower()
        assert "expire" in html_content.lower()
        assert "simpler.grants.gov" in html_content

    def test_create_invitation_email_failure_does_not_block_creation(
        self, client, db_session, enable_factory_create, admin_role, member_role, monkeypatch
    ):
        """Should create invitation even if email sending fails"""
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")

        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Mock send_pinpoint_email_raw to raise an exception
        with patch(
            "src.services.organizations_v1.create_organization_invitation.send_pinpoint_email_raw"
        ) as mock_send:
            mock_send.side_effect = Exception("Email service unavailable")

            # Make request
            resp = client.post(
                f"/v1/organizations/{organization.organization_id}/invitations",
                headers={"X-SGG-Token": token},
                json={
                    "invitee_email": "newuser@example.com",
                    "role_ids": [str(member_role.role_id)],
                },
            )

            # Invitation should still be created successfully
            assert resp.status_code == 200
            data = resp.get_json()["data"]
            assert data["invitee_email"] == "newuser@example.com"
            assert data["status"] == "pending"

            # Verify database record was created
            invitation = (
                db_session.query(OrganizationInvitation)
                .filter(OrganizationInvitation.invitee_email == "newuser@example.com")
                .filter(OrganizationInvitation.organization_id == organization.organization_id)
                .first()
            )
            assert invitation is not None

            # Verify send_pinpoint_email_raw was called (and failed)
            assert mock_send.called

    def test_create_invitation_generates_trace_id_for_email(
        self,
        client,
        db_session,
        enable_factory_create,
        admin_role,
        member_role,
        monkeypatch,
        caplog,
    ):
        """Should generate a trace_id for Pinpoint and log it"""
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        _clear_mock_responses()

        # Create admin user in organization
        admin_user, organization, token = create_user_in_org(db_session=db_session, role=admin_role)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/invitations",
            headers={"X-SGG-Token": token},
            json={
                "invitee_email": "newuser@example.com",
                "role_ids": [str(member_role.role_id)],
            },
        )

        assert resp.status_code == 200

        # Verify email was sent with a trace_id
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        request = mock_responses[0][0]
        pinpoint_trace_id = request["MessageRequest"]["TraceId"]

        # Verify we got a trace_id (should be a UUID)
        assert pinpoint_trace_id is not None
        assert len(pinpoint_trace_id) > 0

        # Verify the trace_id appears in the logs
        log_records = [r for r in caplog.records if "Sending invitation email" in r.message]
        assert len(log_records) == 1

        log_record = log_records[0]

        # Verify the pinpoint_trace_id in the log matches what was sent to Pinpoint
        assert log_record.__dict__.get("pinpoint_trace_id") == pinpoint_trace_id
