import uuid

import grants_shared.adapters.db as db
from sqlalchemy import case, func, select
from sqlalchemy.sql.elements import Label

from src.constants.lookup_constants import AwardRecommendationType
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationSubmissionDetail,
)
from src.services.award_recommendations.award_recommendation_summary_data import (
    AwardRecommendationSummaryData,
)


def _get_coalesced_count_for_type(
    award_recommendation_type: AwardRecommendationType,
    label: str,
) -> Label[int]:
    return func.coalesce(
        func.sum(
            case(
                (
                    AwardRecommendationSubmissionDetail.award_recommendation_type
                    == award_recommendation_type,
                    1,
                ),
                else_=0,
            )
        ),
        0,
    ).label(label)


def get_award_recommendation_summary(
    db_session: db.Session, award_recommendation_id: uuid.UUID
) -> AwardRecommendationSummaryData:
    """Aggregate submission counts and recommended amounts for an award recommendation."""
    stmt = (
        select(
            func.count(
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id
            ).label("total_received_count"),
            _get_coalesced_count_for_type(
                AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
                "recommended_for_funding_count",
            ),
            _get_coalesced_count_for_type(
                AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING,
                "recommended_without_funding_count",
            ),
            _get_coalesced_count_for_type(
                AwardRecommendationType.NOT_RECOMMENDED,
                "not_recommended_count",
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            AwardRecommendationSubmissionDetail.award_recommendation_type
                            == AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
                            AwardRecommendationSubmissionDetail.recommended_amount,
                        ),
                        else_=0,
                    )
                ),
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

    return AwardRecommendationSummaryData(
        total_received_count=int(row.total_received_count),
        recommended_for_funding_count=int(row.recommended_for_funding_count),
        recommended_without_funding_count=int(row.recommended_without_funding_count),
        not_recommended_count=int(row.not_recommended_count),
        total_recommended_amount=row.total_recommended_amount,
    )
