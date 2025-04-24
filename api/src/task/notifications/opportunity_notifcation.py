import logging
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import joinedload

import src.adapters.search as search
from src.adapters import db
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.user_models import UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotification
from src.task.notifications.constants import Metrics, NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)


class OpportunityNotification(BaseNotification):
    def __init__(self, db_session: db.Session, search_client: search.SearchClient):
        super().__init__(
            db_session,
            search_client,
        )
        self.collected_data: dict[UUID, list[UserSavedOpportunity]] = {}

    def collect_notifications(self) -> None:
        """Collect notifications for changed opportunities that users are tracking"""
        stmt = (
            select(UserSavedOpportunity)
            .options(joinedload(UserSavedOpportunity.user))
            .join(
                OpportunityChangeAudit,
                OpportunityChangeAudit.opportunity_id == UserSavedOpportunity.opportunity_id,
            )
            .where(OpportunityChangeAudit.updated_at > UserSavedOpportunity.last_notified_at)
            .distinct()
        )

        results = self.db_session.execute(stmt).scalars().all()
        if not results:
            return

        for result in results:
            user_id = result.user_id
            self.collected_data.setdefault(user_id, []).append(result)
            self.collected_opportunity_ids = result.opportunity_id

        logger.info(
            "Collected opportunity notifications",
            extra={"user_count": len(self.collected_data), "total_notifications": len(results)},
        )

    def prepare_notification(self) -> list[UserEmailNotification]:
        users_email_notifications: list[UserEmailNotification] = []
        if not self.collected_data:
            return users_email_notifications

        for user_id, saved_items in self.collected_data.items():
            user = saved_items[0].user
            if not user.email:
                logger.warning("No email found for user", extra={"user_id": user.user_id})
                continue

            message = f"You have updates to {len(saved_items)} saved opportunities"

            logger.info(
                "Created update email notification",
                extra={"user_id": user_id, "opportunity_count": len(saved_items)},
            )

            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user.email,
                    subject="Updates to Your Saved Opportunities",
                    content=message,
                    notification_reason=NotificationReason.OPPORTUNITY_UPDATES,
                )
            )
        return users_email_notifications

    def update_last_notified_timestamp(self, user_id: UUID) -> None:
        opportunity_ids = [
            saved_opp.opportunity_id for saved_opp in self.collected_data.get(user_id, [])
        ]
        self.db_session.execute(
            update(UserSavedOpportunity)
            .where(
                UserSavedOpportunity.user_id == user_id,
                UserSavedOpportunity.opportunity_id.in_(opportunity_ids),
            )
            .values(last_notified_at=datetime_util.utcnow())
        )
        self.increment(Metrics.OPPORTUNITIES_TRACKED, len(opportunity_ids))
        self.increment(Metrics.USERS_NOTIFIED)

    def run_task(self) -> None:
        """Override to define the task logic"""
        prepared_notification = self.notification_data()
        if prepared_notification:
            self.send_notifications(prepared_notification)
