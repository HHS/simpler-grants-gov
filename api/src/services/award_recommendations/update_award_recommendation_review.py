import logging
import uuid

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import AwardRecommendationAuditEvent, Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendationAudit,
    AwardRecommendationReview,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)

logger = logging.getLogger(__name__)


def update_award_recommendation_review(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_review_id: uuid.UUID,
    review_data: dict,
) -> AwardRecommendationReview:
    award_recommendation = get_award_recommendation_and_verify_access(
        db_session, user, award_recommendation_id
    )

    # Verify the user has update privilege (get_award_recommendation_and_verify_access
    # checks VIEW; we additionally need UPDATE)
    agency = award_recommendation.opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    # Find the review on this award recommendation
    review: AwardRecommendationReview | None = None
    for r in award_recommendation.award_recommendation_reviews:
        if r.award_recommendation_review_id == award_recommendation_review_id:
            review = r
            break

    if review is None:
        raise_flask_error(
            404,
            message=f"Could not find Award Recommendation Review with ID {award_recommendation_review_id}",
        )

    review.is_reviewed = review_data["is_reviewed"]

    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.REVIEW_UPDATED,
            award_recommendation_review=review,
        )
    )

    logger.info(
        "Updated award recommendation review",
        extra={
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_review_id": award_recommendation_review_id,
            "is_reviewed": review.is_reviewed,
        },
    )

    return review
