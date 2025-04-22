import logging
from typing import List
from uuid import UUID

from sqlalchemy import select

from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.user_models import User, UserSavedOpportunity, UserNotificationLog
from src.task.notifications.BaseNotification import BaseNotification
from src.task.notifications.constants import NotificationConstants, NotificationData, EmailData

logger = logging.getLogger(__name__)


class OpportunityNotification(BaseNotification):
    collected_data: dict | None = None
    def collect_notifications(self) -> dict[UUID, list[UserSavedOpportunity]] | None:
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
        saved_opportunities: dict[UUID, list[UserSavedOpportunity]] = {}

        for result in results:
            user_id = result.user_id
            saved_opportunities.setdefault(user_id, []).append(result)

        logger.info(
            "Collected opportunity notifications",
            extra={"user_count": len(saved_opportunities), "total_notifications": len(results)},
        )

        self.collected_data = saved_opportunities or None

        return saved_opportunities or None

    def prepare_notification(
        self, saved_data: dict[UUID, list[UserSavedOpportunity]]
    ) -> EmailData:

        notification: dict[UUID, str] = {}
        to_address_list: List[str] = []

        for user_id, saved_items in saved_data.items():
            user_email = self.get_user_email(user_id)
            if not user_email:
                continue

            message = f"You have updates to {len(saved_items)} saved opportunities"
            notification[user_id] = message
            to_address_list.append(user_email)

        return EmailData(
            to_addresses=to_address_list,
            subject="Updates to Your Saved Opportunities",
            content=notification,
            notification_reason=NotificationConstants.OPPORTUNITY_UPDATES,
        )
