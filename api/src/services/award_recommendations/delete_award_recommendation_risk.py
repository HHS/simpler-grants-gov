from uuid import UUID

from src.adapters import db
from src.db.models.user_models import User
from src.services.award_recommendations.create_award_recommendation_risk import (
    get_award_recommendation_for_update,
)
from src.services.award_recommendations.update_award_recommendation_risk import get_risk_for_update


def delete_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: UUID,
    award_recommendation_risk_id: UUID,
) -> None:
    get_award_recommendation_for_update(db_session, user, award_recommendation_id)

    risk = get_risk_for_update(db_session, award_recommendation_id, award_recommendation_risk_id)

    risk.is_deleted = True
