from uuid import UUID

from src.adapters import db
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)


def delete_award_recommendation(
    db_session: db.Session,
    user: User,
    award_recommendation_id: UUID,
) -> None:
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    award_recommendation.is_deleted = True
    db_session.add(award_recommendation)
