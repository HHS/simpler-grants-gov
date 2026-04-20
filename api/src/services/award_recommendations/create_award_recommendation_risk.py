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
from src.validation.validation_constants import ValidationErrorType


def _get_award_recommendation_for_update(
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

    alphabet = string.ascii_uppercase + string.digits
    while True:
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


def _get_validated_submissions(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    submission_ids: list[uuid.UUID],
) -> list[AwardRecommendationApplicationSubmission]:
    stmt = select(AwardRecommendationApplicationSubmission).where(
        AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
            submission_ids
        ),
        AwardRecommendationApplicationSubmission.award_recommendation_id == award_recommendation_id,
    )

    submissions = list(db_session.execute(stmt).scalars().all())

    if len(submissions) != len(submission_ids):
        found_ids = {s.award_recommendation_application_submission_id for s in submissions}
        missing_ids = [sid for sid in submission_ids if sid not in found_ids]

        validation_errors = []
        for missing_id in missing_ids:
            validation_errors.append(
                ValidationErrorDetail(
                    type=ValidationErrorType.APPLICATION_SUBMISSION_NOT_FOUND,
                    message=f"Could not find Award Recommendation Application Submission with ID {missing_id}",
                    field="award_recommendation_application_submission_ids",
                    value=str(missing_id),
                )
            )

        raise_flask_error(
            404,
            message="Could not find one or more Award Recommendation Application Submissions",
            validation_issues=validation_errors,
        )

    return submissions


def create_award_recommendation_risk(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request_data: dict,
) -> AwardRecommendationRisk:
    award_recommendation = _get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    agency = award_recommendation.opportunity.agency_record
    if agency is None:
        raise Exception("Agency not found for award recommendation")
    agency_code = agency.agency_code

    submission_ids = request_data["award_recommendation_application_submission_ids"]
    submissions = _get_validated_submissions(db_session, award_recommendation_id, submission_ids)

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
