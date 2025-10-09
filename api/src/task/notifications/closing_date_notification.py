import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import and_, exists, select, update
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.user_models import (
    LinkExternalUser,
    SuppressedEmail,
    UserOpportunityNotificationLog,
    UserSavedOpportunity,
)
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)

CONTACT_INFO = (
    "If you encounter technical issues while applying on Grants.gov, please reach out to the Contact Center:\n"
    '<a href="mailto:support@grants.gov">support@grants.gov</a>\n'
    "1-800-518-4726\n"
    "24 hours a day, 7 days a week\n"
    "Closed on federal holidays"
)

PLEASE_CAREFULLY_REVIEW_MSG = (
    ", please contact the grantor using the contact information on the listing page.\n\n"
)

UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=closing_date"


class ClosingDateNotificationTask(BaseNotificationTask):

    def __init__(
        self,
        db_session: db.Session,
        notification_config: EmailNotificationConfig | None = None,
    ):
        super().__init__(db_session, notification_config)

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for opportunities closing in two weeks"""

        days_ago = 14
        interval_ago = datetime_util.get_now_us_eastern_date() + timedelta(days=days_ago)

        # Find saved opportunities closing in two weeks that haven't been notified
        stmt = (
            select(UserSavedOpportunity)
            .options(selectinload(UserSavedOpportunity.user))
            .join(UserSavedOpportunity.opportunity)
            .join(
                OpportunitySummary, OpportunitySummary.opportunity_id == Opportunity.opportunity_id
            )
            .where(UserSavedOpportunity.is_deleted.isnot(True))
            .where(
                # Check if closing date is within 24 hours of two weeks from now
                and_(
                    OpportunitySummary.close_date <= interval_ago,
                    OpportunitySummary.close_date >= datetime_util.get_now_us_eastern_date(),
                ),
                # Ensure we haven't already sent a closing reminder
                ~exists().where(
                    and_(
                        UserOpportunityNotificationLog.user_id == UserSavedOpportunity.user_id,
                        UserOpportunityNotificationLog.opportunity_id
                        == UserSavedOpportunity.opportunity_id,
                        UserOpportunityNotificationLog.created_at
                        >= OpportunitySummary.close_date - timedelta(days=days_ago),
                        # TODO Add this to the table
                        # UserOpportunityNotificationLog.notification_reason
                        # == NotificationReason.CLOSING_DATE_REMINDER
                    )
                ),
                ~exists().where(
                    and_(
                        SuppressedEmail.email == LinkExternalUser.email,
                        LinkExternalUser.user_id == UserSavedOpportunity.user_id,
                    )
                ),
            )
        )

        results = self.db_session.execute(stmt).scalars().all()
        user_saved_opportunities: dict[UUID, list[UserSavedOpportunity]] = {}

        for result in results:
            user_saved_opportunities.setdefault(result.user_id, []).append(result)

        users_email_notifications: list[UserEmailNotification] = []

        for user_id, saved_items in user_saved_opportunities.items():
            user_email: str = saved_items[0].user.email if saved_items[0].user.email else ""

            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            closing_opportunities: list = []
            for saved_opportunity in saved_items:
                opportunity = saved_opportunity.opportunity
                close_date = (
                    opportunity.current_opportunity_summary.opportunity_summary.close_date
                    if opportunity.current_opportunity_summary
                    else None
                )
                if close_date is None:
                    logger.warning(
                        "No close date found for opportunity",
                        extra={"opportunity_id": opportunity.opportunity_id},
                    )
                    continue

                closing_opportunities.append(
                    {
                        "opportunity_id": opportunity.opportunity_id,
                        "opportunity_title": opportunity.opportunity_title,
                        "close_date": close_date,
                    }
                )

            if closing_opportunities:
                message = self._build_notification_message(closing_opportunities)

                logger.info(
                    "Created closing date email notification",
                    extra={"user_id": user_id, "closing_opp_count": len(closing_opportunities)},
                )
                subject = (
                    "Applications for your bookmarked funding opportunity are due soon"
                    if len(closing_opportunities) == 1
                    else "Applications for your bookmarked funding opportunities are due soon"
                )
                users_email_notifications.append(
                    UserEmailNotification(
                        user_id=user_id,
                        user_email=user_email,
                        subject=subject,
                        content=message,
                        notification_reason=NotificationReason.CLOSING_DATE_REMINDER,
                        notified_object_ids=[
                            opp["opportunity_id"] for opp in closing_opportunities
                        ],
                        is_notified=False,  # Default to False, update on success
                    )
                )
        logger.info(
            "Collected closing date opportunities for notification",
            extra={
                "user_count": len(users_email_notifications),
                "total_closing_opportunities": sum(
                    len(n.notified_object_ids) for n in users_email_notifications
                ),
            },
        )

        return users_email_notifications

    def _build_notification_message(self, closing_opportunities: list) -> str:
        has_multiple_grants = len(closing_opportunities) > 1

        message = (
            "Applications for the following funding opportunities are due in two weeks:\n\n"
            if has_multiple_grants
            else "Applications for your bookmarked funding opportunity are due soon\n\n"
        )

        for closing_opp in closing_opportunities:
            message += (
                f"<a href='{self.notification_config.frontend_base_url}/opportunity/{closing_opp["opportunity_id"]}{UTM_TAG}' target='_blank'>{closing_opp["opportunity_title"]}</a>\n"
                f"Application due date: {closing_opp["close_date"].strftime('%B %d, %Y')}\n\n"
            )

        if has_multiple_grants:
            message += (
                "Please carefully review the opportunity listings for all requirements and deadlines.\n\n"
                f"<a href='{self.notification_config.frontend_base_url}/saved-opportunities{UTM_TAG}' target='_blank'>To unsubscribe from email notifications for an opportunity, delete it from your bookmarked funding opportunities.</a>\n\n"
                "<b>Questions?</b>\n"
                "If you have questions about an opportunity"
            )
        else:
            message += (
                "Please carefully review the opportunity listing for all requirements and deadlines.\n\n"
                f"<a href='{self.notification_config.frontend_base_url}/saved-opportunities{UTM_TAG}' target='_blank'>To unsubscribe from email notifications for this opportunity, delete it from your bookmarked funding opportunities.</a>\n\n"
                "<b>Questions?</b>\n"
                "If you have questions about the opportunity"
            )
        message += PLEASE_CAREFULLY_REVIEW_MSG
        message += CONTACT_INFO

        return message.replace("\n", "<br/>")

    def post_notifications_process(self, user_notifications: list[UserEmailNotification]) -> None:
        for user_notification in user_notifications:
            if user_notification.is_notified:
                # Update UserSavedOpportunity
                user_id = user_notification.user_id
                opportunity_ids = user_notification.notified_object_ids
                self.db_session.execute(
                    update(UserSavedOpportunity)
                    .where(
                        UserSavedOpportunity.user_id == user_notification.user_id,
                        UserSavedOpportunity.opportunity_id.in_(opportunity_ids),
                    )
                    .values(last_notified_at=datetime_util.utcnow())
                )

                # Create notification log entry
                for opp_id in opportunity_ids:
                    opp_notification_log = UserOpportunityNotificationLog(
                        user_id=user_id,
                        opportunity_id=opp_id,
                    )
                    self.db_session.add(opp_notification_log)

                logger.info(
                    "Updated notification log",
                    extra={
                        "user_id": user_id,
                        "opportunity_ids": opportunity_ids,
                        "notification_reason": user_notification.notification_reason,
                    },
                )

                self.increment(
                    self.Metrics.CLOSING_SOON_OPPORTUNITIES_TRACKED,
                    len(user_notification.notified_object_ids),
                )
