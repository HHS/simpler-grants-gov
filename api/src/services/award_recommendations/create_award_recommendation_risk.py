import secrets
import string
import uuid

from sqlalchemy import exists, select

import src.adapters.db as db
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationRisk,
    AwardRecommendationRiskSubmission,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)
from src.services.award_recommendations.utils import validate_all_submissions_exist


def _generate_risk_number(db_session: db.Session, agency_code: str) -> str:
    if not agency_code:
        raise Exception("agency_code is required to generate a risk number")

    max_attempts = 5
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(max_attempts):
        candidate = agency_code + "".join(secrets.choice(alphabet) for _ in range(10))
        already_exists = db_session.execute(
            select(
                exists().where(
                    AwardRecommendationRisk.award_recommendation_risk_number == candidate
                )
            )
        ).scalar()
        if not already_exists:
            return candidate

    raise Exception(f"Failed to generate a unique risk number after {max_attempts} attempts")


def create_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request_data: dict,
) -> AwardRecommendationRisk:
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    agency = award_recommendation.opportunity.agency_record
    if agency is None:
        raise Exception("Agency not found for award recommendation")
    agency_code = agency.agency_code

    submission_ids = set(request_data["award_recommendation_application_submission_ids"])

    stmt = select(AwardRecommendationApplicationSubmission).where(
        AwardRecommendationApplicationSubmission.award_recommendation_id == award_recommendation_id,
        AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
            submission_ids
        ),
    )
    submissions = list(db_session.execute(stmt).scalars().all())

    validate_all_submissions_exist(submission_ids, submissions)

    risk = AwardRecommendationRisk(
        award_recommendation_risk_id=uuid.uuid4(),
        award_recommendation=award_recommendation,
        award_recommendation_risk_number=_generate_risk_number(db_session, agency_code),
        award_recommendation_risk_type=request_data["award_recommendation_risk_type"],
        comment=request_data["comment"],
    )

    for submission in submissions:
        risk.award_recommendation_risk_submissions.append(
            AwardRecommendationRiskSubmission(
                award_recommendation_application_submission=submission,
            )
        )

    db_session.add(risk)
    db_session.flush()

    # Eagerly load relationships needed for the applications property by accessing them
    for rs in risk.award_recommendation_risk_submissions:
        _ = (
            rs.award_recommendation_application_submission.application_submission.application_submission_number
        )

    return risk
