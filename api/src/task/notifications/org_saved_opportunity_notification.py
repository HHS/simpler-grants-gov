import html
import logging
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

# NOTE: closing_date_notification.py has an identical copy; not deduplicated because
# opportunity_notifcation.py defines a different CONTACT_INFO with no shared canonical version.
CONTACT_INFO = (
    "If you encounter technical issues while applying on Grants.gov, please reach out to the Contact Center:\n"
    '<a href="mailto:support@grants.gov">support@grants.gov</a>\n'
    "1-800-518-4726\n"
    "24 hours a day, 7 days a week\n"
    "Closed on federal holidays"
)


class OrgSavedOpportunityNotificationTask(BaseNotificationTask):

    def __init__(
        self,
        db_session: db.Session,
        notification_config: EmailNotificationConfig | None = None,
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

        # user_id -> list of (organization, list of opportunities)
        user_org_opportunities: dict[UUID, list[tuple[Organization, list[Opportunity]]]] = {}
        user_emails: dict[UUID, str] = {}

        for org_id, org_rows in org_to_rows.items():
            organization = org_rows[0].organization
            opportunities = [row.opportunity for row in org_rows]

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

            for org_user in eligible_members:
                user = org_user.user
                email = user.email
                if not email:
                    logger.warning("No email found for user", extra={"user_id": org_user.user_id})
                    continue

                user_emails[org_user.user_id] = email
                user_org_opportunities.setdefault(org_user.user_id, []).append(
                    (organization, opportunities)
                )

        if not user_org_opportunities:
            logger.info("No eligible members found for org saved opportunity notifications")
            return []

        # Build one email per user covering all their organizations' new opportunities
        notifications: list[UserEmailNotification] = []
        for user_id, org_opp_list in user_org_opportunities.items():
            email = user_emails[user_id]
            all_opportunity_ids = [opp.opportunity_id for _, opps in org_opp_list for opp in opps]
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

    def _build_notification_message(
        self, org_opp_list: list[tuple[Organization, list[Opportunity]]]
    ) -> str:
        has_multiple_orgs = len(org_opp_list) > 1

        if has_multiple_orgs:
            message = "New funding opportunities have been saved to your organizations:\n\n"
        else:
            org_name = html.escape(org_opp_list[0][0].organization_name or "your organization")
            message = f"New funding opportunities have been saved to {org_name}:\n\n"

        for organization, opportunities in org_opp_list:
            org_name = html.escape(organization.organization_name or "Unknown Organization")

            if has_multiple_orgs:
                message += f"<b>{org_name}</b>\n"

            displayed = opportunities[:MAX_OPPORTUNITIES_DISPLAYED]
            remaining = len(opportunities) - len(displayed)

            for opportunity in displayed:
                opp_url = (
                    f"{self.notification_config.frontend_base_url}"
                    f"/opportunity/{opportunity.opportunity_id}{UTM_TAG}"
                )
                opp_title = html.escape(opportunity.opportunity_title or "")
                message += f"• <a href='{opp_url}' target='_blank'>{opp_title}</a>\n"

            if remaining > 0:
                saved_opps_url = (
                    f"{self.notification_config.frontend_base_url}/saved-opportunities{UTM_TAG}"
                )
                message += (
                    f"• <a href='{saved_opps_url}' target='_blank'>"
                    f"And {remaining} more opportunity{'s' if remaining > 1 else ''}...</a>\n"
                )

            message += "\n"

        notification_prefs_url = (
            f"{self.notification_config.frontend_base_url}/notification-preferences{UTM_TAG}"
        )
        message += (
            f"<a href='{notification_prefs_url}' target='_blank'>"
            "Manage your notification preferences</a>\n\n"
            "<b>Questions?</b>\n"
            "If you have questions about an opportunity, please contact the grantor using "
            "the contact information on the listing page.\n\n"
        )
        message += CONTACT_INFO

        return message.replace("\n", "<br/>")

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
