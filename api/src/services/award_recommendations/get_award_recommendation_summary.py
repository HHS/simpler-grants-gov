import uuid
from decimal import Decimal

from sqlalchemy import case, func, select

import src.adapters.db as db
from src.constants.lookup_constants import AwardRecommendationType
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationSubmissionDetail,
)


def get_award_recommendation_summary(
    db_session: db.Session, award_recommendation_id: uuid.UUID
) -> dict[str, int | Decimal]:
    """Aggregate submission counts and recommended amounts for an award recommendation."""
    funding_type = AwardRecommendationType.RECOMMENDED_FOR_FUNDING
    without_funding_type = AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING
    not_recommended_type = AwardRecommendationType.NOT_RECOMMENDED

    stmt = (
        select(
            func.count(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
            ).label("total_received_count"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            AwardRecommendationSubmissionDetail.award_recommendation_type
                            == funding_type,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("recommended_for_funding_count"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            AwardRecommendationSubmissionDetail.award_recommendation_type
                            == without_funding_type,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("recommended_without_funding_count"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            AwardRecommendationSubmissionDetail.award_recommendation_type
                            == not_recommended_type,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("not_recommended_count"),
            func.coalesce(
                func.sum(AwardRecommendationSubmissionDetail.recommended_amount),
                0,
            ).label("total_recommended_amount"),
        )
        .select_from(AwardRecommendationApplicationSubmission)
        .join(
            AwardRecommendationSubmissionDetail,
            AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
            == AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id,
        )
        .where(
            AwardRecommendationApplicationSubmission.award_recommendation_id
            == award_recommendation_id
        )
    )

    row = db_session.execute(stmt).one()

    return {
        "total_received_count": int(row.total_received_count),
        "recommended_for_funding_count": int(row.recommended_for_funding_count),
        "recommended_without_funding_count": int(row.recommended_without_funding_count),
        "not_recommended_count": int(row.not_recommended_count),
        "total_recommended_amount": row.total_recommended_amount,
    }
