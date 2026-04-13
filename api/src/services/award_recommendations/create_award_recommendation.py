import random
import secrets
import string
import uuid

from sqlalchemy import exists, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationReviewType,
    AwardRecommendationStatus,
    AwardRecommendationType,
    Privilege,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
    AwardRecommendationReview,
    AwardRecommendationSubmissionDetail,
)
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.db.models.user_models import User


def _get_opportunity(db_session: db.Session, opportunity_id: uuid.UUID) -> Opportunity | None:
    stmt = (
        select(Opportunity)
        .where(Opportunity.opportunity_id == opportunity_id)
        .options(selectinload(Opportunity.agency_record))
        .options(
            selectinload(Opportunity.current_opportunity_summary).selectinload(
                CurrentOpportunitySummary.opportunity_summary
            )
        )
    )

    return db_session.execute(stmt).scalar_one_or_none()


def _generate_award_recommendation_number(db_session: db.Session, agency_code: str) -> str:
    if not agency_code:
        raise_flask_error(403, message="Forbidden")

    alphabet = string.ascii_uppercase + string.digits
    while True:
        candidate = agency_code + "".join(secrets.choice(alphabet) for _ in range(10))
        already_exists = db_session.execute(
            select(exists().where(AwardRecommendation.award_recommendation_number == candidate))
        ).scalar()
        if not already_exists:
            return candidate


def _get_application_submissions_for_opportunity(
    db_session: db.Session, opportunity_id: uuid.UUID
) -> list[ApplicationSubmission]:
    stmt = (
        select(ApplicationSubmission)
        .join(ApplicationSubmission.application)
        .join(Application.competition)
        .where(Competition.opportunity_id == opportunity_id)
    )

    return db_session.execute(stmt).scalars().all()


def create_award_recommendation(
    db_session: db.Session, user: User, award_recommendation_data: dict
) -> AwardRecommendation:
    opportunity_id = award_recommendation_data["opportunity_id"]
    opportunity = _get_opportunity(db_session, opportunity_id)

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    agency = opportunity.agency_record
    if agency is None:
        raise_flask_error(403, message="Forbidden")

    verify_access(user, {Privilege.CREATE_AWARD_RECOMMENDATION}, agency)

    award_recommendation = AwardRecommendation(
        opportunity=opportunity,
        award_recommendation_number=_generate_award_recommendation_number(
            db_session, agency.agency_code
        ),
        award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
        award_selection_method=award_recommendation_data["award_selection_method"],
        additional_info=award_recommendation_data.get("additional_info"),
        selection_method_detail=award_recommendation_data.get("funding_strategy"),
        other_key_information=award_recommendation_data.get("other_key_information"),
    )

    with db_session.no_autoflush:
        application_submissions = _get_application_submissions_for_opportunity(
            db_session, opportunity_id
        )

    for application_submission in application_submissions:
        submission_detail = AwardRecommendationSubmissionDetail(
            recommended_amount=application_submission.total_requested_amount,
            scoring_comment=str(random.randint(1, 100)),
            award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
        )
        award_recommendation.award_recommendation_application_submissions.append(
            AwardRecommendationApplicationSubmission(
                application_submission=application_submission,
                award_recommendation_submission_detail=submission_detail,
            )
        )

    for review_type in AwardRecommendationReviewType:
        award_recommendation.award_recommendation_reviews.append(
            AwardRecommendationReview(
                award_recommendation_review_type=review_type,
                is_reviewed=False,
            )
        )

    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_CREATED,
        )
    )

    db_session.add(award_recommendation)
    db_session.flush()

    award_recommendation_id = award_recommendation.award_recommendation_id

    stmt = (
        select(AwardRecommendation)
        .where(AwardRecommendation.award_recommendation_id == award_recommendation_id)
        .options(selectinload(AwardRecommendation.award_recommendation_attachments))
        .options(selectinload(AwardRecommendation.award_recommendation_reviews))
        .options(selectinload(AwardRecommendation.award_recommendation_application_submissions))
        .options(selectinload(AwardRecommendation.award_recommendation_audit_events))
    )
    return db_session.execute(stmt).scalar_one()
