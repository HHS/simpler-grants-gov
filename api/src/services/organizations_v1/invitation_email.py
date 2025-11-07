import logging

from src.db.models.entity_models import Organization, OrganizationInvitation

logger = logging.getLogger(__name__)


def build_invitation_email(
    invitation: OrganizationInvitation, organization: Organization
) -> tuple[str, str]:
    """Build the email subject and content for an organization invitation.

    Args:
        invitation: The invitation record
        organization: The organization the user is being invited to
        inviter: The user who created the invitation

    Returns:
        tuple[str, str]: (subject, html_content)
    """
    org_name = organization.organization_name or "an organization"
    subject = f"Invitation to join {org_name}"

    # Format expiration date
    expiration_date = invitation.expires_at.strftime("%B %d, %Y")

    # Build minimal email content
    content = f"""
<html>
<body>
<p>Hello,</p>

<p>You have been invited to join <strong>{org_name}</strong> on simpler.grants.gov.</p>

<p>This invitation will expire on {expiration_date}.</p>

<p>Thank you,<br>
The simpler.grants.gov team</p>
</body>
</html>
"""

    return subject, content
