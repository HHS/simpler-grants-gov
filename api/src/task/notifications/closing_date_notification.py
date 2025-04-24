import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import and_, exists, select

import src.adapters.search as search
from src.adapters import db
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.user_models import UserOpportunityNotificationLog, UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotification
from src.task.notifications.constants import NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)

CONTACT_INFO = (
    "mailto:support@grants.gov\n"
    "1-800-518-4726\n"
    "24 hours a day, 7 days a week\n"
    "Closed on federal holidays"
)


class ClosingDateNotification(BaseNotification):

    def __init__(
        self,
        db_session: db.Session,
        search_client: search.SearchClient,
        frontend_base_url: str | None = None,
    ):
        super().__init__(db_session, search_client)
        self.frontend_base_url = frontend_base_url
        self.collected_data: dict[UUID, list[UserSavedOpportunity]] = {}

    def collect_notifications(self) -> None:
        """Collect notifications for opportunities closing in two weeks"""
        two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

        # Find saved opportunities closing in two weeks that haven't been notified
        stmt = (
            select(UserSavedOpportunity)
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
        closing_date_opportunities: dict[UUID, list[UserSavedOpportunity]] = {}

        for result in results:
            user_id = result.user_id
            closing_date_opportunities.setdefault(user_id, []).append(result)

        logger.info(
            "Collected closing date notifications",
            extra={
                "user_count": len(closing_date_opportunities),
                "total_notifications": sum(
                    len(closing_date_opportunities)
                    for container in closing_date_opportunities.values()
                ),
            },
        )
        self.collected_data = closing_date_opportunities

    def prepare_notification(self) -> list[UserEmailNotification]:
        users_email_notifications: list[UserEmailNotification] = []

        for user_id, saved_items in self.collected_data.items():
            user = saved_items[0].user
            if not user.email:
                logger.warning("No email found for user", extra={"user_id": user.user_id})
                continue
            message = ""
            if len(saved_items) == 1:
                # Single opportunity closing
                opportunity = saved_items[0].opportunity
                close_date_stmt = select(OpportunitySummary.close_date).where(
                    OpportunitySummary.opportunity_id == opportunity.opportunity_id
                )
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

                message = (
                    "Applications for the following funding opportunity are due in two weeks:\n\n"
                    f"<a href='{self.frontend_base_url}/opportunity/{opportunity.opportunity_id}' target='_blank'>{opportunity.opportunity_title}</a>\n"
                    f"Application due date: {close_date.strftime('%B %d, %Y')}\n\n"
                    "Please carefully review the opportunity listing for all requirements and deadlines.\n\n"
                    "Sign in to Simpler.Grants.gov to manage or unsubscribe from this bookmarked opportunity.\n\n"
                    "To manage notifications about this opportunity, sign in to Simpler.Grants.gov.\n\n"
                    "If you have questions about the opportunity, please contact the grantor using the contact information on the listing page.\n\n"
                    "If you encounter technical issues while applying on Grants.gov, please reach out to the Contact Center:\n"
                    "{CONTACT_INFO}"
                )

            elif len(saved_items) > 1:
                # Multiple opportunities closing
                message = (
                    "Applications for the following funding opportunities are due in two weeks:\n\n"
                )

                for saved_opportunity in saved_items:
                    opportunity = saved_opportunity.opportunity
                    close_date_stmt = select(OpportunitySummary.close_date).where(
                        OpportunitySummary.opportunity_id == opportunity.opportunity_id
                    )
                    close_date = self.db_session.execute(close_date_stmt).scalar_one_or_none()
                    if close_date:
                        message += (
                            f"[{opportunity.opportunity_title}]\n"
                            f"Application due date: {close_date.strftime('%B %d, %Y')}\n\n"
                        )

                message += (
                    "Please carefully review the opportunity listings for all requirements and deadlines.\n\n"
                    "Sign in to Simpler.Grants.gov to manage your bookmarked opportunities.\n\n"
                    "If you have questions, please contact the Grants.gov Contact Center:\n"
                    "{CONTACT_INFO}"
                )

            logger.info(
                "Created closing date email notification",
                extra={"user_id": user_id, "closing_opp_count": len(saved_items)},
            )

            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user.email,
                    subject="Applications for your bookmarked funding opportunities are due soon",
                    content=message,
                    notification_reason=NotificationReason.CLOSING_DATE_REMINDER,
                )
            )

        return users_email_notifications

    def create_user_opportunity_notification_log(self) -> None:
        if self.collected_data:
            for user_id, saved_items in self.collected_data.items():
                for closing_opportunity in saved_items:
                    # Create notification log entry
                    opp_notification_log = UserOpportunityNotificationLog(
                        user_id=user_id,
                        opportunity_id=closing_opportunity.opportunity_id,
                    )
                    self.db_session.add(opp_notification_log)

                logger.info(
                    "Successfully sent closing date reminder",
                    extra={
                        "user_id": user_id,
                        "opportunity_ids": [opp.opportunity_id for opp in saved_items],
                    },
                )

    def run_task(self) -> None:
        """Override to define the task logic"""
        prepared_notification = self.notification_data()
        if prepared_notification:
            self.send_notifications(prepared_notification)
            self.create_user_opportunity_notification_log()
