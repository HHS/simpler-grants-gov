import logging
from datetime import timedelta
from typing import List
from uuid import UUID

from sqlalchemy import select

from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.opportunity_models import OpportunitySummary, Opportunity
from src.db.models.user_models import User, UserSavedOpportunity, UserOpportunityNotificationLog, UserNotificationLog
from src.task.notifications.BaseNotification import BaseNotification
from src.task.notifications.constants import NotificationData, EmailData, NotificationConstants
from src.util import datetime_util
from sqlalchemy import and_, exists, select
logger = logging.getLogger(__name__)

class ClosingDateNotification(BaseNotification):

    def __init__(self, db_session: db.Session, search_client: Optional[SearchClient] = None):
        super().__init__(db_session, search_client)
        self.frontend_base_url = None

    def collect_notifications(self) -> dict[UUID, list[UserSavedOpportunity]] | None:
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
        closing_soon_opportunities: dict[UUID, list[UserSavedOpportunity]] = {}

        for result in results:
            user_id = result.user_id
            closing_soon_opportunities.setdefault(user_id, []).append(result)

        logger.info(
            "Collected closing date notifications",
            extra={
                "user_count": len(closing_soon_opportunities),
                "total_notifications": sum(
                    len(closing_soon_opportunities)
                    for container in closing_soon_opportunities.values()
                ),
            },
        )

        return closing_soon_opportunities if closing_soon_opportunities else None

    def prepare_notification(
        self, closing_date_data: dict[UUID, list[UserSavedOpportunity]]
    ) -> EmailData:

        notification: dict[UUID, str] = {}
        to_address_list: List[str] = []

        for user_id, saved_items in closing_date_data.items():
            if len(saved_items) == 1:
                # Single opportunity closing
                opportunity = saved_items[0]
                close_date_stmt = select(OpportunitySummary.close_date).where(
                    OpportunitySummary.opportunity_id == opportunity.opportunity_id
                )
                close_date = self.db_session.execute(close_date_stmt).scalar_one_or_none()
                if close_date is None:
                    logger.warning(
                        "No close date found for opportunity",
                        extra={"opportunity_id": opportunity.opportunity_id},
                    )
                    continue

                subject = "Applications for your bookmarked funding opportunity are due soon"
                message = (
                    "Applications for the following funding opportunity are due in two weeks:\n\n"
                    f"<a href='{self.frontend_base_url}/opportunity/{opportunity.opportunity_id}' target='_blank'>{opportunity.opportunity.opportunity_title}</a>\n"
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
                subject = "Applications for your bookmarked funding opportunities are due soon"
                message = (
                    "Applications for the following funding opportunities are due in two weeks:\n\n"
                )

                for opportunity in saved_items:
                    close_date_stmt = select(OpportunitySummary.close_date).where(
                        OpportunitySummary.opportunity_id == opportunity.opportunity_id
                    )
                    close_date = self.db_session.execute(close_date_stmt).scalar_one_or_none()
                    if close_date:
                        message += (
                            f"[{opportunity.opportunity.opportunity_title}]\n"
                            f"Application due date: {close_date.strftime('%B %d, %Y')}\n\n"
                        )

                message += (
                    "Please carefully review the opportunity listings for all requirements and deadlines.\n\n"
                    "Sign in to Simpler.Grants.gov to manage your bookmarked opportunities.\n\n"
                    "If you have questions, please contact the Grants.gov Contact Center:\n"
                    "{CONTACT_INFO}"
                )

            if len(saved_items) > 0:
                notification_log = UserNotificationLog(
                    user_id=user_id,
                    notification_reason=NotificationConstants.CLOSING_DATE_REMINDER,
                    notification_sent=False,  # Default to False, update on success
                )
                self.db_session.add(notification_log)


        return EmailData(
            to_addresses=to_address_list,
            subject="Updates to Your Saved Opportunities",
            content=notification,
            notification_reason=NotificationConstants.OPPORTUNITY_UPDATES,
        )


    