import secrets
import string
import uuid

from sqlalchemy import exists, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationApplicationSubmission,
    AwardRecommendationRisk,
    AwardRecommendationRiskSubmission,
)
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.award_recommendations.utils import get_validated_submissions
from src.validation.validation_constants import ValidationErrorType


def get_award_recommendation_for_update(
    db_session: db.Session, user: User, award_recommendation_id: uuid.UUID
) -> AwardRecommendation:
    stmt = (
        select(AwardRecommendation)
        .where(
            AwardRecommendation.award_recommendation_id == award_recommendation_id,
            AwardRecommendation.is_deleted.isnot(True),
        )
        .options(
            selectinload(AwardRecommendation.opportunity).selectinload(Opportunity.agency_record),
        )
    )

    award_recommendation = db_session.execute(stmt).scalar_one_or_none()
    if award_recommendation is None:
        raise_flask_error(
            404,
            message=f"Could not find Award Recommendation with ID {award_recommendation_id}",
        )

    agency = award_recommendation.opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    return award_recommendation


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
    submissions = get_validated_submissions(db_session, award_recommendation_id, submission_ids)

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

    return risk
