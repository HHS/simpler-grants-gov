import html
import logging
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import and_, exists, select, update
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.entity_models import Organization, OrganizationSavedOpportunity
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import (
    LinkExternalUser,
    OrganizationUser,
    SuppressedEmail,
    UserSavedOpportunityNotification,
)
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import Metrics, NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)

UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=org_saved_opportunity"

# Maximum number of opportunities to show per organization in the email
MAX_OPPORTUNITIES_DISPLAYED = 5


@dataclass
class OrgOpportunityGroup:
    organization: Organization
    opportunities: list[Opportunity]
    displayed: list[Opportunity]
    remaining: int


class OrgSavedOpportunityNotificationTask(BaseNotificationTask):

    def __init__(
        self,
        db_session: db.Session,
        notification_config: EmailNotificationConfig,
    ):
        super().__init__(db_session, notification_config)

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """
        Collect notifications for users whose organizations have new saved opportunities.

        - For every organization that has unprocessed saved opportunities (notification_processed_at IS NULL):
          - Get members of that organization
          - Filter members to those with org notifications enabled
          - Mark all unprocessed opportunity rows as processed (notification_processed_at = now)
          - Aggregate per-user across all their orgs
        - Send one email per user with all their orgs' new opportunities
        """
        now = datetime_util.utcnow()

        # Fetch all unprocessed org-opportunity rows with relationships loaded
        stmt = (
            select(OrganizationSavedOpportunity)
            .options(
                # Load organization and its sam_gov_entity in a single chained eager load so both
                # are available without additional queries when building email content
                selectinload(OrganizationSavedOpportunity.organization).selectinload(
                    Organization.sam_gov_entity
                ),
                selectinload(OrganizationSavedOpportunity.opportunity),
            )
            .where(OrganizationSavedOpportunity.notification_processed_at.is_(None))
        )
        unprocessed_rows = self.db_session.execute(stmt).scalars().all()

        if not unprocessed_rows:
            logger.info("No unprocessed organization saved opportunities found")
            return []

        # Group unprocessed rows by organization_id
        org_to_rows: dict[UUID, list[OrganizationSavedOpportunity]] = {}
        for row in unprocessed_rows:
            org_to_rows.setdefault(row.organization_id, []).append(row)

        # user_id -> list of OrgOpportunityGroup
        user_org_opportunities: dict[UUID, list[OrgOpportunityGroup]] = {}
        user_emails: dict[UUID, str] = {}

        for org_id, org_rows in org_to_rows.items():
            organization = org_rows[0].organization
            opportunities = [row.opportunity for row in org_rows]
            displayed = opportunities[:MAX_OPPORTUNITIES_DISPLAYED]
            remaining = len(opportunities) - len(displayed)

            # Mark all unprocessed rows for this org as processed
            self.db_session.execute(
                update(OrganizationSavedOpportunity)
                .where(
                    OrganizationSavedOpportunity.organization_id == org_id,
                    OrganizationSavedOpportunity.notification_processed_at.is_(None),
                )
                .values(notification_processed_at=now)
            )

            self.increment(Metrics.ORG_SAVED_OPPORTUNITIES_TRACKED, len(opportunities))

            # Find members of this org who have notifications enabled and are not suppressed
            eligible_members = self._get_eligible_members(org_id)

            logger.info(
                "Processing org saved opportunity notifications",
                extra={
                    "organization_id": org_id,
                    "opportunity_count": len(opportunities),
                    "eligible_member_count": len(eligible_members),
                },
            )

            org_group = OrgOpportunityGroup(
                organization=organization,
                opportunities=opportunities,
                displayed=displayed,
                remaining=remaining,
            )

            for org_user in eligible_members:
                user = org_user.user
                email = user.email
                if not email:
                    logger.warning("No email found for user", extra={"user_id": org_user.user_id})
                    continue

                user_emails[org_user.user_id] = email
                user_org_opportunities.setdefault(org_user.user_id, []).append(org_group)

        if not user_org_opportunities:
            logger.info("No eligible members found for org saved opportunity notifications")
            return []

        # Build one email per user covering all their organizations' new opportunities
        notifications: list[UserEmailNotification] = []
        for user_id, org_opp_list in user_org_opportunities.items():
            email = user_emails[user_id]
            all_opportunity_ids = [
                opp.opportunity_id for group in org_opp_list for opp in group.opportunities
            ]
            content = self._build_notification_message(org_opp_list)
            org_count = len(org_opp_list)
            subject = (
                "New funding opportunities have been saved to your organization"
                if org_count == 1
                else "New funding opportunities have been saved to your organizations"
            )

            logger.info(
                "Created org saved opportunity email notification",
                extra={
                    "user_id": user_id,
                    "org_count": org_count,
                    "opportunity_count": len(all_opportunity_ids),
                },
            )

            notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=email,
                    subject=subject,
                    content=content,
                    notification_reason=NotificationReason.ORG_SAVED_OPPORTUNITY,
                    notified_object_ids=all_opportunity_ids,
                    is_notified=False,
                )
            )

        logger.info(
            "Collected org saved opportunity notifications",
            extra={
                "user_count": len(notifications),
                "total_opportunities": sum(len(n.notified_object_ids) for n in notifications),
            },
        )
        return notifications

    def _get_eligible_members(self, org_id: UUID) -> list[OrganizationUser]:
        """Return org members who have org notifications enabled and are not suppressed."""
        stmt = (
            select(OrganizationUser)
            .options(selectinload(OrganizationUser.user))
            .where(OrganizationUser.organization_id == org_id)
            .where(
                exists().where(
                    and_(
                        UserSavedOpportunityNotification.user_id == OrganizationUser.user_id,
                        UserSavedOpportunityNotification.organization_id == org_id,
                        UserSavedOpportunityNotification.email_enabled.is_(True),
                    )
                )
            )
            .where(
                ~exists().where(
                    and_(
                        SuppressedEmail.email == LinkExternalUser.email,
                        LinkExternalUser.user_id == OrganizationUser.user_id,
                    )
                )
            )
        )
        return list(self.db_session.execute(stmt).scalars().all())

    def _build_notification_message(self, org_opp_list: list[OrgOpportunityGroup]) -> str:
        has_multiple_orgs = len(org_opp_list) > 1

        if has_multiple_orgs:
            intro = "New funding opportunities have been saved to your organizations."
        else:
            org_name = html.escape(
                org_opp_list[0].organization.organization_name or "your organization"
            )
            intro = f"New funding opportunities have been saved to {org_name}."
        intro += " See what fits your team's goals and align on next steps."

        notification_prefs_url = (
            f"{self.notification_config.frontend_base_url}/notifications{UTM_TAG}"
        )

        org_sections = []
        for group in org_opp_list:
            org_name = html.escape(group.organization.organization_name or "Unknown Organization")
            items = []

            for opportunity in group.displayed:
                opp_url = (
                    f"{self.notification_config.frontend_base_url}"
                    f"/opportunity/{opportunity.opportunity_id}{UTM_TAG}"
                )
                opp_title = html.escape(opportunity.opportunity_title or "")
                items.append(
                    f'<li style="list-style-type:none; margin:0; padding:0;">'
                    f'<a href="{opp_url}" target="_blank">{opp_title}</a>'
                    f"</li>"
                )

            if group.remaining > 0:
                saved_opps_url = (
                    f"{self.notification_config.frontend_base_url}/saved-opportunities{UTM_TAG}"
                )
                items.append(
                    f'<li style="list-style-type:none; margin:0; padding:0;">'
                    f'<a href="{saved_opps_url}" target="_blank">'
                    f"And {group.remaining} more opportunit"
                    f"{'ies' if group.remaining > 1 else 'y'}..."
                    f"</a>"
                    f"</li>"
                )

            items_html = "\n".join(items)
            section = (
                f'<ul style="list-style-type:none; margin:0; padding-left:16px;">\n'
                f"{items_html}\n"
                f"</ul>"
            )

            if has_multiple_orgs:
                section = f"<p><strong>{org_name}</strong></p>\n{section}"

            org_sections.append(section)

        body_content = "\n\n".join(org_sections)

        return f"""<html>
<body>

<p>
{intro}
</p>

{body_content}

<p>
Manage which updates you receive in your
<a href="{notification_prefs_url}">notification preferences</a>.
</p>

</body>
</html>"""

    def post_notifications_process(self, notifications: list[UserEmailNotification]) -> None:
        for notification in notifications:
            if notification.is_notified:
                logger.info(
                    "Sent org saved opportunity notification",
                    extra={
                        "user_id": notification.user_id,
                        "opportunity_count": len(notification.notified_object_ids),
                    },
                )
