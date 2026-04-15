from collections.abc import Sequence

from src.db.models.entity_models import Organization
from src.db.models.opportunity_models import Opportunity
from src.task.notifications.config import EmailNotificationConfig


def build_notification_content(
    config: EmailNotificationConfig,
    organization: Organization,
    org_saved_opportunities: Sequence[Opportunity],
) -> tuple[str, str]:

    count = len(org_saved_opportunities)
    org_name = organization.organization_name

    if count == 1:
        subject = f"{org_name} has a new opportunity to review"
        intro = "A new opportunity has been saved for your organization."
    else:
        subject = f"{org_name} has new opportunities to review"
        intro = "New opportunities have been saved for your organization."

    intro += " See what fits your team’s goals and align on next steps."

    # Build list items (no bullets)
    items = [
        f"""<li style="list-style-type:none; margin:0; padding:0;"><a href="{config.frontend_base_url}/opportunity/{opp.opportunity_id}" target="_blank">{opp.opportunity_title}</a></li>"""
        for opp in org_saved_opportunities[:3]
    ]

    if count > 3:
        items.append(
            f'<li style="list-style-type:none; margin:0; padding:0;">+ {count - 3} more</li>'
        )
    items_html = "\n".join(items)
    titles_html = f"""
<ul style="list-style-type:none; margin:0; padding-left:16px;">
{items_html}
</ul>
""".strip()

    view_all_opps_url = (
        f"{config.frontend_base_url}/workspace/saved-opportunities"
        f"?savedBy=organization:{organization.organization_id}"
    )

    notification_prefs_url = f"{config.frontend_base_url}/notifications"

    content = f"""
<html>
<body>

<p>
{intro}
</p>

{titles_html}

<p>
<a href="{view_all_opps_url}" style="text-decoration: none;">View all opportunities</a>
</p>

<p>
Manage which updates you receive in your
<a href="{notification_prefs_url}">notification preferences</a>.
</p>

</body>
</html>
""".strip()

    return subject, content
