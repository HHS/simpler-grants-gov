from uuid import uuid4

import pytest

from src.constants.lookup_constants import OrganizationAuditEvent, OrganizationInvitationStatus
from src.db.models.entity_models import OrganizationInvitation
from tests.src.db.models import factories
from tests.src.db.models.factories import (
    LinkOrganizationInvitationToRoleFactory,
    OrganizationInvitationFactory,
    RoleFactory,
)


@pytest.fixture(autouse=True)
def user_with_email(user, enable_factory_create):
    factories.LinkExternalUserFactory.create(user=user, email="test@gmail.com")
    return user


def test_org_invitation_response_accepted(
    client, db_session, user, user_auth_token, enable_factory_create
):
    """Test that an invitation can be successfully ACCEPTED by the correct user."""

    # Create an invitation
    inv = OrganizationInvitationFactory.create(invitee_email=user.email)
    # Create multiple roles to assign to user
    roles = RoleFactory.create_batch(3)
    for role in roles:
        LinkOrganizationInvitationToRoleFactory.create(organization_invitation=inv, role=role)

    assert inv.status == OrganizationInvitationStatus.PENDING

    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.ACCEPTED},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 200

    res = (
        db_session.query(OrganizationInvitation)
        .filter(OrganizationInvitation.organization_invitation_id == inv.organization_invitation_id)
        .first()
    )
    # Verify status
    assert res.status == OrganizationInvitationStatus.ACCEPTED

    # Verify user data
    assert res.invitee_user_id == user.user_id
    assert res.invitee_email == user.email
    assert len(user.organization_users) == 1
    assert user.organization_users[0].user_id == user.user_id
    assert [role.role_id for role in user.organization_users[0].roles] == [
        role.role_id for role in inv.linked_roles
    ]

    # Verify response data
    data = resp.get_json()["data"]
    assert data["status"] == OrganizationInvitationStatus.ACCEPTED
    assert data["responded_at"] == res.accepted_at.isoformat()

    # Verify audit history recorded
    org = inv.organization
    assert len(org.organization_audits) == 1
    assert org.organization_audits[0].user.user_id == user.user_id
    assert org.organization_audits[0].organization_audit_event == OrganizationAuditEvent.USER_ADDED


def test_org_invitation_response_rejected(
    client, db_session, user, user_auth_token, enable_factory_create
):
    """Test that an invitation can be successfully REJECTED by the correct user."""
    # Create an invitation with role
    inv = OrganizationInvitationFactory.create(invitee_email=user.email)
    LinkOrganizationInvitationToRoleFactory.create(organization_invitation=inv)
    assert inv.status == OrganizationInvitationStatus.PENDING

    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.REJECTED},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 200

    res = (
        db_session.query(OrganizationInvitation)
        .filter(OrganizationInvitation.organization_invitation_id == inv.organization_invitation_id)
        .first()
    )
    # Verify status
    assert res.status == OrganizationInvitationStatus.REJECTED

    # Verify user data
    assert res.invitee_user_id == user.user_id
    assert res.invitee_email == user.email
    assert not user.organization_users

    # Verify response data
    data = resp.get_json()["data"]
    assert data["status"] == OrganizationInvitationStatus.REJECTED
    assert data["responded_at"] == res.rejected_at.isoformat()

    # Verify user added audit event was not created
    user_added_audits = [
        audit for audit in inv.organization.organization_audits if audit.audit_event == "USER_ADDED"
    ]
    assert len(user_added_audits) == 0


def test_org_invitation_response_404_invitation(client, db_session, user, user_auth_token):
    """Test that responding to a non-existent invitation returns a 404 error."""
    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{uuid4()}/organizations",
        json={"status": OrganizationInvitationStatus.REJECTED},
        headers={"X-SGG-Token": user_auth_token},
    )
    assert resp.status_code == 404
    assert resp.get_json()["message"] == "Invitation not found"


def test_org_invitation_response_403_email(client, db_session, user, user_auth_token):
    """Test that a user whose email does not match the invitation's invitee_email
    cannot respond to the invitation."""
    # Create an invitation with role
    inv = OrganizationInvitationFactory.create()
    LinkOrganizationInvitationToRoleFactory.create(organization_invitation=inv)

    assert inv.status == OrganizationInvitationStatus.PENDING
    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.REJECTED},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 403
    assert (
        resp.get_json()["message"]
        == "Forbidden, invitation email does not match user's email on record"
    )


@pytest.mark.parametrize(
    "current_status",
    [
        OrganizationInvitationStatus.REJECTED,
        OrganizationInvitationStatus.ACCEPTED,
        OrganizationInvitationStatus.EXPIRED,
    ],
)
def test_org_invitation_response_422_status(
    client, db_session, user, user_auth_token, current_status
):
    """Test that responding to an invitation that is not pending or is expired
    returns a 422 error."""
    # Create an invitation with role
    inv = OrganizationInvitationFactory.create(invitee_email=user.email, is_accepted=True)

    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.REJECTED},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 422
    assert (
        resp.get_json()["message"]
        == f"Invitation cannot be responded to; current status is {OrganizationInvitationStatus.ACCEPTED}"
    )


def test_org_invitation_response_invalid_status(client, db_session, user, user_auth_token):
    """Test that sending an invalid status in the request returns a 422 error."""
    # Create an invitation with role
    inv = OrganizationInvitationFactory.create(invitee_email=user.email, is_accepted=True)

    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.PENDING},
        headers={"X-SGG-Token": user_auth_token},
    )
    assert resp.status_code == 422


def test_org_invitation_response_422_invitee_user_id(
    client,
    db_session,
    user,
    user_auth_token,
):
    """Test that if an ivitee_user_id has already been set it throws an error"""
    # Create an invitation with role
    inv = OrganizationInvitationFactory.create(
        invitee_user_id=user.user_id, invitee_email=user.email, is_accepted=True
    )

    resp = client.post(
        f"/v1/users/{user.user_id}/invitations/{inv.organization_invitation_id}/organizations",
        json={"status": OrganizationInvitationStatus.REJECTED},
        headers={"X-SGG-Token": user_auth_token},
    )

    assert resp.status_code == 422
    assert resp.get_json()["message"] == "Invitation has already been responded to"
