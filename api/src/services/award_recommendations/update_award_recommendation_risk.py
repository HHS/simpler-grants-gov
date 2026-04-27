import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationRisk,
    AwardRecommendationRiskSubmission,
)
from src.db.models.user_models import User
from src.services.award_recommendations.create_award_recommendation_risk import (
    get_award_recommendation_for_update,
)
from src.services.award_recommendations.utils import validate_all_submissions_exist


def _get_risk_for_update(
    db_session: db.Session,
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
            selectinload(AwardRecommendationRisk.award_recommendation_risk_submissions),
        )
    )

    risk = db_session.execute(stmt).scalar_one_or_none()
    if risk is None:
        raise_flask_error(
            404,
            message=f"Could not find Award Recommendation Risk with ID {award_recommendation_risk_id}",
        )

    return risk


def _sync_risk_submissions(
    risk: AwardRecommendationRisk,
    validated_submissions_by_id: dict[uuid.UUID, AwardRecommendationApplicationSubmission],
) -> None:
    existing_ids = {
        rs.award_recommendation_application_submission_id
        for rs in risk.award_recommendation_risk_submissions
    }

    desired_ids = set(validated_submissions_by_id.keys())
    risk.award_recommendation_risk_submissions = [
        rs
        for rs in risk.award_recommendation_risk_submissions
        if rs.award_recommendation_application_submission_id in desired_ids
    ]

    for sid, submission in validated_submissions_by_id.items():
        if sid in existing_ids:
            continue
        risk.award_recommendation_risk_submissions.append(
            AwardRecommendationRiskSubmission(
                award_recommendation_application_submission=submission,
            )
        )


def update_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
    request_data: dict,
) -> AwardRecommendationRisk:
    get_award_recommendation_for_update(db_session, user, award_recommendation_id)

    risk = _get_risk_for_update(db_session, award_recommendation_id, award_recommendation_risk_id)

    risk.comment = request_data["comment"]
    risk.award_recommendation_risk_type = request_data["award_recommendation_risk_type"]

    submission_ids = set(request_data["award_recommendation_application_submission_ids"])

    stmt = select(AwardRecommendationApplicationSubmission).where(
        AwardRecommendationApplicationSubmission.award_recommendation_id == award_recommendation_id,
        AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
            submission_ids
        ),
    )
    submissions = list(db_session.execute(stmt).scalars().all())

    validate_all_submissions_exist(submission_ids, submissions)

    validated_by_id: dict[uuid.UUID, AwardRecommendationApplicationSubmission] = {
        s.award_recommendation_application_submission_id: s for s in submissions
    }

    _sync_risk_submissions(risk, validated_by_id)

    return risk
