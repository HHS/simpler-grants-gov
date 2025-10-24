from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import OrganizationInvitationStatus
from src.db.models.entity_models import OrganizationInvitation
from src.db.models.user_models import OrganizationUser, OrganizationUserRole, User
from src.util.datetime_util import utcnow


def org_invitation_response(
    db_session: db.Session, user: User, invitation_id: UUID, json_data: dict
) -> dict:
    """
        Handle a user's response to an organization invitation.
         This function allows a user to ACCEPT or REJECT an invitation to join an organization.
    It validates that the invitation exists, is still pending, is not expired, and that the
    responding user matches the invitee's ID and email on record. Depending on the response:

    - ACCEPTED: Adds the user to the organization, assigns any linked roles, and updates the accepted timestamp and sets the invitee_user_id.
    - REJECTED: Updates the rejected timestamp and sets the invitee_user_id.

    """

    # Fetch invitation
    invitation = db_session.execute(
        select(OrganizationInvitation).where(
            OrganizationInvitation.organization_invitation_id == invitation_id
        )
    ).scalar_one_or_none()

    # Validate invitation
    if not invitation:
        raise_flask_error(404, "Invitation not found")

    # Verify response user is the same
    if user.user_id != invitation.invitee_user_id:
        raise_flask_error(403, "Forbidden, invitation user does not match user's ID on record")

    # Verify responder email
    if user.email != invitation.invitee_email:
        raise_flask_error(403, "Forbidden, invitation email does not match user's email on record")

    # Validate status status
    if invitation.status != OrganizationInvitationStatus.PENDING or invitation.is_expired:
        raise_flask_error(
            400, f"Invitation cannot be responded to; current status is {invitation.status}"
        )

    status = json_data.get("status")
    now = utcnow()
    if status == OrganizationInvitationStatus.ACCEPTED:
        # Create organization and assign role
        org_user = OrganizationUser(
            organization_id=invitation.organization_id,
            user=user,
            is_organization_owner=False,
        )
        db_session.add(org_user)
        for role in invitation.linked_roles:
            org_user_role = OrganizationUserRole(organization_user=org_user, role_id=role.role_id)
            db_session.add(org_user_role)
        # Update response time
        invitation.accepted_at = now

    if status == OrganizationInvitationStatus.REJECTED:
        # Update response time
        invitation.rejected_at = now

    invitation.invitee_user_id = user.user_id

    db_session.add(invitation)

    return {
        "organization_invitation_id": invitation.organization_invitation_id,
        "status": invitation.status,
        "responded_at": (
            invitation.accepted_at
            if status == OrganizationInvitationStatus.ACCEPTED
            else invitation.rejected_at
        ),
        "organization_id": invitation.organization_id,
        "role_granted": invitation.linked_roles,
    }
