import logging
from typing import Sequence
from uuid import UUID

from sqlalchemy import and_, desc, func, select, tuple_, update
from sqlalchemy.orm import aliased, selectinload

from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityVersionV1Schema
from src.db.models.opportunity_models import OpportunityVersion
from src.db.models.user_models import UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.constants import (
    ChangedSavedOpportunity,
    Metrics,
    NotificationReason,
    OpportunityVersionChange,
    UserEmailNotification,
)
from src.util import datetime_util

logger = logging.getLogger(__name__)

SCHEMA = OpportunityVersionV1Schema()


class OpportunityNotificationTask(BaseNotificationTask):
    def __init__(self, db_session: db.Session):
        super().__init__(db_session)

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed opportunities that users are tracking"""
        results = self._get_latest_opportunity_versions()

        if not results:
            logger.info("No user-opportunity tracking records found.")
            return []

        changed_saved_opportunities: list[ChangedSavedOpportunity] = []
        user_opportunity_pairs: list = []
        versionless_opportunities: set = set()

        for user_saved_opp, latest_opp_ver in results:
            if latest_opp_ver is None:
                logger.error(
                    "No prior version recorded for this opportunity;",
                    extra={"opportunity_id": user_saved_opp.opportunity_id},
                )
                versionless_opportunities.add(user_saved_opp.opportunity_id)
                continue

            if user_saved_opp.last_notified_at < latest_opp_ver.created_at:
                user_id = user_saved_opp.user_id
                opp_id = user_saved_opp.opportunity_id

                version_change = OpportunityVersionChange(
                    opportunity_id=opp_id, latest=latest_opp_ver, previous=None  # will update later
                )

                saved_opp_exists = False
                for entry in changed_saved_opportunities:
                    if entry.user_id == user_id:
                        entry.opportunities.append(version_change)
                        saved_opp_exists = True
                        break

                if not saved_opp_exists:
                    changed_saved_opportunities.append(
                        ChangedSavedOpportunity(
                            user_id=user_id,
                            email=user_saved_opp.user.email,
                            opportunities=[version_change],
                        )
                    )

                user_opportunity_pairs.append((user_id, opp_id))

        self.increment(Metrics.VERSIONLESS_OPPORTUNITY_COUNT, len(versionless_opportunities))

        # Grab last notified versions.
        prior_notified_versions = self._get_last_notified_versions(user_opportunity_pairs)

        users_email_notifications: list[UserEmailNotification] = []

        for user_changed_opp in changed_saved_opportunities:
            user_id = user_changed_opp.user_id
            user_email = user_changed_opp.email
            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            updated_opps = user_changed_opp.opportunities

            for opp in updated_opps:
                opp.previous = prior_notified_versions.get(
                    (user_changed_opp.user_id, opp.opportunity_id)
                )

            message = f"You have updates to {len(updated_opps)} saved opportunities"

            logger.info(
                "Created changed opportunity email notifications",
                extra={"user_id": user_id, "changed_opportunities_count": len(updated_opps)},
            )
            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user_email,
                    subject="Updates to Your Saved Opportunities",
                    content=message,
                    notification_reason=NotificationReason.OPPORTUNITY_UPDATES,
                    notified_object_ids=[],
                    is_notified=False,  # Default to False, update on success
                )
            )

        logger.info(
            "Collected updated opportunity notifications",
            extra={
                "user_count": len(users_email_notifications),
                "total_opportunities_count": sum(
                    len(opp.opportunities) for opp in changed_saved_opportunities
                ),
            },
        )

        return users_email_notifications

    def _get_latest_opportunity_versions(self) -> Sequence:
        """
        Retrieve the latest OpportunityVersion for each opportunity saved by users.
        """
        # Rank all versions per opportunity_id, by created_at descending
        row_number = (
            func.row_number()
            .over(
                partition_by=OpportunityVersion.opportunity_id,
                order_by=desc(OpportunityVersion.created_at),
            )
            .label("rn")
        )

        # Subquery selecting all OpportunityVersions along with their row number rank
        latest_versions_subq = select(OpportunityVersion, row_number).subquery()

        # Map cols in the subquery back to OpportunityVersion model
        latest_opp_version = aliased(OpportunityVersion, latest_versions_subq)

        # Grab latest version for each UserSavedOpportunity
        stmt = (
            select(UserSavedOpportunity, latest_opp_version)
            .options(selectinload(UserSavedOpportunity.user))
            .outerjoin(
                latest_opp_version,
                and_(
                    UserSavedOpportunity.opportunity_id == latest_opp_version.opportunity_id,
                    latest_versions_subq.c.rn == 1,
                ),
            )
        )

        results = self.db_session.execute(stmt).all()

        return results

    def _get_last_notified_versions(
        self, user_opportunity_pairs: list
    ) -> dict[tuple[UUID, UUID], OpportunityVersion]:
        """
        Given (user_id, opportunity_id) pairs, return the most recent
        OpportunityVersion for each that was created before the user's
        last_notified_at timestamp.
        """
        # Rank all versions per (user, opportunity_id) by created_at desc
        row_number = (
            func.row_number()
            .over(
                partition_by=(UserSavedOpportunity.user_id, OpportunityVersion.opportunity_id),
                order_by=desc(OpportunityVersion.created_at),
            )
            .label("rn")
        )
        # Subquery selecting all OpportunityVersions joined with UserSavedOpportunity,
        # filtered by the given user-opportunity pairs, and versions created before last_notified_at
        subq = (
            select(OpportunityVersion, UserSavedOpportunity.user_id.label("user_id"), row_number)
            .join(
                UserSavedOpportunity,
                UserSavedOpportunity.opportunity_id == OpportunityVersion.opportunity_id,
            )
            .where(
                tuple_(UserSavedOpportunity.user_id, UserSavedOpportunity.opportunity_id).in_(
                    user_opportunity_pairs
                ),  # Filter for the given pairs
                OpportunityVersion.created_at
                < UserSavedOpportunity.last_notified_at,  # Grabs the versions created before the users last notification
            )
            .subquery()
        )

        # Map cols in the subquery back to OpportunityVersion model
        opp_version_from_subq = aliased(OpportunityVersion, subq)

        # Grabs latest version per (user, opportunity_id) pairs
        stmt = select(
            subq.c.user_id,
            subq.c.opportunity_id,
            opp_version_from_subq,  # OpportunityVersion object
        ).where(subq.c.rn == 1)

        results = self.db_session.execute(stmt).all()

        return {(row.user_id, row.opportunity_id): row[2] for row in results}

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
