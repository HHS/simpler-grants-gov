import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.award_recommendation_models import AwardRecommendation
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.db.models.user_models import User


def _get_award_recommendation(
    db_session: db.Session, award_recommendation_id: uuid.UUID
) -> AwardRecommendation | None:
    stmt = (
        select(AwardRecommendation)
        .where(
            AwardRecommendation.award_recommendation_id == award_recommendation_id,
            AwardRecommendation.is_deleted.isnot(True),
        )
        .options(
            selectinload(AwardRecommendation.opportunity).selectinload(Opportunity.agency_record),
            selectinload(AwardRecommendation.opportunity)
            .selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary),
        )
    )

    return db_session.execute(stmt).scalar_one_or_none()


def get_award_recommendation_and_verify_access(
    db_session: db.Session, user: User, award_recommendation_id: uuid.UUID
) -> AwardRecommendation:
    award_recommendation = _get_award_recommendation(db_session, award_recommendation_id)
    if award_recommendation is None:
        raise_flask_error(
            404,
            message=f"Could not find Award Recommendation with ID {award_recommendation_id}",
        )

    agency = award_recommendation.opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(user, {Privilege.VIEW_AWARD_RECOMMENDATION}, agency)

    return award_recommendation
