import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import and_, exists, select, update
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.user_models import UserOpportunityNotificationLog, UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.constants import NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)

CONTACT_INFO = (
    "mailto:support@grants.gov\n"
    "1-800-518-4726\n"
    "24 hours a day, 7 days a week\n"
    "Closed on federal holidays"
)


class ClosingDateNotificationTask(BaseNotificationTask):

    def __init__(
        self,
        db_session: db.Session,
        frontend_base_url: str | None = None,
    ):
        super().__init__(db_session)

        self.frontend_base_url = frontend_base_url

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for opportunities closing in two weeks"""
        two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

        # Find saved opportunities closing in two weeks that haven't been notified
        stmt = (
            select(UserSavedOpportunity)
            .options(selectinload(UserSavedOpportunity.user))
            .join(UserSavedOpportunity.opportunity)
            .join(
                OpportunitySummary, OpportunitySummary.opportunity_id == Opportunity.opportunity_id
            )
            .where(
                # Check if closing date is within 24 hours of two weeks from now
                and_(
                    OpportunitySummary.close_date >= two_weeks_from_now - timedelta(hours=24),
                    OpportunitySummary.close_date <= two_weeks_from_now + timedelta(hours=24),
                ),
                # Ensure we haven't already sent a closing reminder
                ~exists().where(
                    and_(
                        UserOpportunityNotificationLog.user_id == UserSavedOpportunity.user_id,
                        UserOpportunityNotificationLog.opportunity_id
                        == UserSavedOpportunity.opportunity_id,
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
                users_email_notifications.append(
                    UserEmailNotification(
                        user_id=user_id,
                        user_email=user_email,
                        subject="Applications for your bookmarked funding opportunities are due soon",
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
        message = "Applications for the following funding opportunity are due in two weeks:\n\n"
        if len(closing_opportunities) == 1:
            message += (
                f"<a href='{self.frontend_base_url}/opportunity/{closing_opportunities[0]["opportunity_id"]}' target='_blank'>{closing_opportunities[0]["opportunity_title"]}</a>\n"
                f"Application due date: {closing_opportunities[0]["close_date"].strftime('%B %d, %Y')}\n\n"
                "Please carefully review the opportunity listing for all requirements and deadlines.\n\n"
                "Sign in to Simpler.Grants.gov to manage or unsubscribe from this bookmarked opportunity.\n\n"
                "To manage notifications about this opportunity, sign in to Simpler.Grants.gov.\n\n"
                "If you have questions about the opportunity, please contact the grantor using the contact information on the listing page.\n\n"
                "If you encounter technical issues while applying on Grants.gov, please reach out to the Contact Center:\n"
            )
        else:
            for closing_opp in closing_opportunities:
                message += (
                    f"[{closing_opp["opportunity_title"]}]\n"
                    f"Application due date: {closing_opp["close_date"].strftime('%B %d, %Y')}\n\n"
                )
            message += (
                "Please carefully review the opportunity listings for all requirements and deadlines.\n\n"
                "Sign in to Simpler.Grants.gov to manage your bookmarked opportunities.\n\n"
                "If you have questions, please contact the Grants.gov Contact Center:\n"
            )

        message += CONTACT_INFO

        return message

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
