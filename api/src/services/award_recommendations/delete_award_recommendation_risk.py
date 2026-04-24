from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.award_recommendation_models import AwardRecommendation, AwardRecommendationRisk
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User


def _get_award_recommendation_risk_for_update(
    db_session: db.Session,
    user: User,
    award_recommendation_id: UUID,
    award_recommendation_risk_id: UUID,
) -> AwardRecommendationRisk:
    stmt = (
        select(AwardRecommendationRisk)
        .where(
            AwardRecommendationRisk.award_recommendation_risk_id == award_recommendation_risk_id,
            AwardRecommendationRisk.award_recommendation_id == award_recommendation_id,
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
            message=f"Could not find Award Recommendation Risk with ID {award_recommendation_risk_id} and Award Recommendation ID {award_recommendation_id}",
        )

    agency = risk.award_recommendation.opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    return risk


def delete_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: UUID,
    award_recommendation_risk_id: UUID,
) -> None:
    risk = _get_award_recommendation_risk_for_update(
        db_session,
        user,
        award_recommendation_id,
        award_recommendation_risk_id,
    )

    risk.is_deleted = True
