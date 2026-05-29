import uuid

import grants_shared.adapters.db as db
from sqlalchemy import select

from src.api.route_utils import raise_flask_error
from src.db.models.award_recommendation_models import AwardRecommendationAttachment
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)


def get_award_recommendation_attachment(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> AwardRecommendationAttachment:
    """Fetch a non-deleted attachment belonging to the given award recommendation."""
    attachment = db_session.execute(
        select(AwardRecommendationAttachment).where(
            AwardRecommendationAttachment.award_recommendation_attachment_id
            == award_recommendation_attachment_id,
            AwardRecommendationAttachment.award_recommendation_id == award_recommendation_id,
            AwardRecommendationAttachment.is_deleted.isnot(True),
        )
    ).scalar_one_or_none()

    if attachment is None:
        raise_flask_error(
            404,
            message=(
                f"Could not find Award Recommendation Attachment with ID "
                f"{award_recommendation_attachment_id}"
            ),
        )

    return attachment


def get_award_recommendation_attachment_for_update(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> AwardRecommendationAttachment:
    """Fetch an attachment after verifying the user can update the award recommendation."""
    get_award_recommendation_for_update(db_session, user, award_recommendation_id)

    return get_award_recommendation_attachment(
        db_session, award_recommendation_id, award_recommendation_attachment_id
    )
