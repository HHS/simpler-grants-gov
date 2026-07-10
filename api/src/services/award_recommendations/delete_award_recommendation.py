import logging
from uuid import UUID

from grants_shared.adapters import db

from src.constants.lookup_constants import AwardRecommendationAuditEvent
from src.db.models.award_recommendation_models import AwardRecommendationAudit
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)

logger = logging.getLogger(__name__)


def delete_award_recommendation(
    db_session: db.Session,
    user: User,
    award_recommendation_id: UUID,
) -> None:
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    award_recommendation.is_deleted = True

    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_DELETED,
        )
    )

    db_session.add(award_recommendation)

    logger.info(
        "Deleted award recommendation",
        extra={
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_number": award_recommendation.award_recommendation_number,
        },
    )
