from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from sqlalchemy.orm import selectinload

def _get_award_recommendation_risk_for_update(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
) -> AwardRecommendationRisk:
    stmt = (
        select(AwardRecommendationRisk)
        .where(
            AwardRecommendationRisk.award_recommendation_risk_id == award_recommendation_risk_id,
            AwardRecommendationRisk.award_recommendation_id == award_recommendation_id,
            AwardRecommendationRisk.is_deleted.isnot(True),
        )
        .options(
            selectinload(AwardRecommendationRisk.award_recommendation)
            .selectinload(AwardRecommendation.opportunity)
            .selectinload(Opportunity.agency_record)
        )
    )

    risk = db_session.execute(stmt).scalar_one_or_none()
    if risk is None:
        raise_flask_error(
            404,
            message=f"Could not find Award Recommendation Risk with ID {award_recommendation_risk_id}",
        )

    agency = risk.award_recommendation.opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    return risk


def delete_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
) -> None:
    risk = _get_award_recommendation_risk_for_update(
        db_session,
        user,
        award_recommendation_id,
        award_recommendation_risk_id,
    )

    risk.is_deleted = True