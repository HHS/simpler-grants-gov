import logging
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import OpportunityChangeAudit
from src.db.models.user_models import UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.constants import Metrics, NotificationReason, UserEmailNotification
from src.util import datetime_util

logger = logging.getLogger(__name__)


class OpportunityNotification(BaseNotificationTask):
    def __init__(self, db_session: db.Session):
        super().__init__(
            db_session,
        )

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed opportunities that users are tracking"""
        stmt = (
            select(UserSavedOpportunity)
            .options(selectinload(UserSavedOpportunity.user))
            .join(
                OpportunityChangeAudit,
                OpportunityChangeAudit.opportunity_id == UserSavedOpportunity.opportunity_id,
            )
            .where(OpportunityChangeAudit.updated_at > UserSavedOpportunity.last_notified_at)
            .distinct()
        )

        results = self.db_session.execute(stmt).scalars().all()
        changed_saved_opportunities: dict[UUID, list[UserSavedOpportunity]] = {}

        for result in results:
            user_id = result.user_id
            changed_saved_opportunities.setdefault(user_id, []).append(result)

        users_email_notifications: list[UserEmailNotification] = []

        for user_id, saved_items in changed_saved_opportunities.items():
            user_email: str = saved_items[0].user.email if saved_items[0].user.email else ""

            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue
            message = f"You have updates to {len(saved_items)} saved opportunities"

            logger.info(
                "Created changed opportunity email notifications",
                extra={"user_id": user_id, "changed_opportunities_count": len(saved_items)},
            )

            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user_email,
                    subject="Updates to Your Saved Opportunities",
                    content=message,
                    notification_reason=NotificationReason.OPPORTUNITY_UPDATES,
                    notified_object_ids=[opp.opportunity_id for opp in saved_items],
                    is_notified=False,  # Default to False, update on success
                )
            )

        logger.info(
            "Collected updated opportunity notifications",
            extra={
                "user_count": len(changed_saved_opportunities),
                "total_opportunities_count": sum(
                    len(changed_opportunity)
                    for changed_opportunity in changed_saved_opportunities.values()
                ),
            },
        )

        return users_email_notifications

    def post_notifications_process(self, user_notifications: list[UserEmailNotification]) -> None:
        for user_notification in user_notifications:
            if user_notification.is_notified:
                self.db_session.execute(
                    update(UserSavedOpportunity)
                    .where(
                        UserSavedOpportunity.user_id == user_notification.user_id,
                        UserSavedOpportunity.opportunity_id.in_(
                            user_notification.notified_object_ids
                        ),
                    )
                    .values(last_notified_at=datetime_util.utcnow())
                )

                logger.info(
                    "Updated notification log",
                    extra={
                        "user_id": user_notification.user_id,
                        "opportunity_ids": user_notification.notified_object_ids,
                        "notification_reason": user_notification.notification_reason,
                    },
                )

                self.increment(
                    Metrics.OPPORTUNITIES_TRACKED, len(user_notification.notified_object_ids)
                )
