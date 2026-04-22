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
    _get_award_recommendation_for_update,
    _get_validated_submissions,
)


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
    new_submission_ids: set[uuid.UUID],
    validated_submissions_by_id: dict[uuid.UUID, AwardRecommendationApplicationSubmission],
) -> None:
    existing_ids = {
        rs.award_recommendation_application_submission_id
        for rs in risk.award_recommendation_risk_submissions
    }

    ids_to_add = new_submission_ids - existing_ids
    ids_to_remove = existing_ids - new_submission_ids

    risk.award_recommendation_risk_submissions = [
        rs
        for rs in risk.award_recommendation_risk_submissions
        if rs.award_recommendation_application_submission_id not in ids_to_remove
    ]

    for sid in ids_to_add:
        risk.award_recommendation_risk_submissions.append(
            AwardRecommendationRiskSubmission(
                award_recommendation_application_submission=validated_submissions_by_id[sid],
            )
        )


def update_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_risk_id: uuid.UUID,
    request_data: dict,
) -> AwardRecommendationRisk:
    _get_award_recommendation_for_update(db_session, user, award_recommendation_id)

    risk = _get_risk_for_update(db_session, award_recommendation_id, award_recommendation_risk_id)

    risk.comment = request_data["comment"]
    risk.award_recommendation_risk_type = request_data["award_recommendation_risk_type"]

    submission_ids = set(request_data["award_recommendation_application_submission_ids"])
    validated_submissions = _get_validated_submissions(
        db_session, award_recommendation_id, submission_ids
    )
    validated_by_id = {
        s.award_recommendation_application_submission_id: s for s in validated_submissions
    }

    _sync_risk_submissions(risk, submission_ids, validated_by_id)

    return risk
