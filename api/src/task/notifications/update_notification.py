import logging
from typing import Sequence
from uuid import UUID

from src.adapters import db, search
from src.adapters.aws.pinpoint_adapter import send_pinpoint_email_raw
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.user_models import UserSavedOpportunity, User, UserNotificationLog
from src.task.notifications.generate_notifications import NotificationTask, NotificationContainer, NotificationConstants
from src.task.task import Task
from sqlalchemy import select

logger = logging.getLogger(__name__)

class UpdateNotification(NotificationTask):
    def __init__(self, db_session: db.Session):
        super().__init__(db_session)

    def run(self):
        saved_opportunities =self.collect_opportunity_notifications()
        if saved_opportunities:
            self.send_notifications(saved_opportunities)

    def collect_opportunity_notifications(self) -> dict[UUID, list[UserSavedOpportunity]] | None:
        import pdb; pdb.set_trace()
        """Collect notifications for changed opportunities that users are tracking"""
        stmt = (
            select(UserSavedOpportunity)
            .join(
                OpportunityChangeAudit,
                OpportunityChangeAudit.opportunity_id == UserSavedOpportunity.opportunity_id,
            )
            .where(OpportunityChangeAudit.updated_at > UserSavedOpportunity.last_notified_at)
            .distinct()
        )

        results = self.db_session.execute(stmt).scalars().all()
        saved_opportunities: dict[UUID, list[UserSavedOpportunity]]  = {}
        for result in results:
            user_id = result.user_id
            if user_id not in saved_opportunities:
                saved_opportunities[user_id] = [result]
            else:
                saved_opportunities[user_id].append(result)

        logger.info(
            "Collected opportunity notifications",
            extra={
                "user_count": len(saved_opportunities),
                "total_notifications": len(results)
            },
        )

        return saved_opportunities


    def send_notifications(self, saved_opportunities: dict[UUID, list[UserSavedOpportunity]]) -> None:
        """Send collected notifications to users"""
        import pdb; pdb.set_trace()

        for user_id, saved_opps in saved_opportunities.items():
            user = self.db_session.execute(
                select(User).where(User.user_id == user_id)
            ).scalar_one_or_none()

            if not user.email:
                logger.warning("No email found for user", extra={"user_id": user.user_id})
                continue

            # Send email via Pinpoint
            subject = "Updates to Your Saved Opportunities"
            message = (
                f"You have updates to {len(saved_opps)} saved opportunities"
            )

            logger.info(
                "Sending notification to user",
                extra={
                    "user_id": user.user_id,
                    "opportunity_count": len(saved_opps),
                },
            )

            notification_log = UserNotificationLog(
                user_id=user_id,
                notification_reason=NotificationConstants.OPPORTUNITY_UPDATES,
                notification_sent=False,  # Default to False, update on success
            )
            self.db_session.add(notification_log)

            try:
                send_pinpoint_email_raw(
                    to_address=user.email,
                    subject=subject,
                    message=message,
                    pinpoint_client=self.pinpoint_client,
                    app_id=self.config.app_id,
                )
                notification_log.notification_sent = True
                logger.info(
                    "Successfully sent notification to user",
                    extra={
                        "user_id": user_id,
                        "opportunity_count": len(saved_opps),
                        "search_count": len(saved_opps),
                    },
                )
            except Exception:
                # Notification log will be updated in the finally block
                logger.exception(
                    "Failed to send notification email",
                    extra={"user_id": user_id, "email": user.email},
                )

            self.db_session.add(notification_log)
