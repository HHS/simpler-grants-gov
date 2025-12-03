import logging

from src.db.models.entity_models import Organization, OrganizationInvitation
from src.task.notifications.config import EmailNotificationConfig

logger = logging.getLogger(__name__)


def build_invitation_email(
    invitation: OrganizationInvitation, organization: Organization, config: EmailNotificationConfig
) -> tuple[str, str]:
    """Build the email subject and content for an organization invitation.

    Args:
        invitation: The invitation record
        organization: The organization the user is being invited to
        config: Email configuration containing frontend_base_url

    Returns:
        tuple[str, str]: (subject, html_content)
    """
    org_name = organization.organization_name or "an organization"
    subject = f"You've been invited to join {org_name} in SimplerGrants"

    # Build email content with new copy
    content = f"""
<html>
<body>
<p>Hello,</p>

<p>You've been invited to join <strong>{org_name}</strong> in SimplerGrants, we're glad you're here.</p>

<p>Here's how to get started:</p>
<ol>
<li>Go to <a href="{config.frontend_base_url}" target="_blank">Simpler.Grants.gov</a> and sign in (top right) using your Login.gov email and password. If you don't have an account yet, you'll be guided to create one.</li>
<li>After signing in, open your "Activity dashboard" under Workspace in the navigation.</li>
<li>A message will be waiting for you, select "Accept" to join your organization. Once you accept, you'll have access to your team, organization details, and more.</li>
</ol>

<p>If you run into anything unexpected, you can always reach out to your organization's eBizPOC.</p>

<p>Welcome aboard!</p>

<p>The SimplerGrants Team</p>

<p><a href="{config.frontend_base_url}" target="_blank">SimplerGrants.gov</a></p>
</body>
</html>
"""

    return subject, content
