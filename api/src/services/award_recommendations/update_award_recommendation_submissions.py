import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import AwardRecommendationAuditEvent, Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
)
from src.db.models.competition_models import Application, ApplicationSubmission
from src.db.models.entity_models import Organization
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)
from src.services.award_recommendations.utils import validate_all_submissions_exist

logger = logging.getLogger(__name__)


def update_award_recommendation_submissions(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    update_data: dict[uuid.UUID, dict],
) -> list[AwardRecommendationApplicationSubmission]:  # Return actual models like list endpoint
    """
    Batch update award recommendation submission details with the provided data.

    This function handles updating multiple submission details in a single transaction.
    It validates that all submissions belong to the specified award recommendation.

    Args:
        db_session: The database session
        user: The authenticated user
        award_recommendation_id: The ID of the award recommendation
        update_data: Dictionary mapping award_recommendation_application_submission_id to update data

    Returns:
        List of updated award recommendation application submissions
    """
    award_recommendation = get_award_recommendation_and_verify_access(
        db_session, user, award_recommendation_id
    )

    agency = award_recommendation.opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    submission_ids = list(update_data.keys())

    stmt = (
        select(AwardRecommendationApplicationSubmission)
        .where(
            AwardRecommendationApplicationSubmission.award_recommendation_id
            == award_recommendation_id,
            AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
                submission_ids
            ),
        )
        .options(
            selectinload(
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail
            ),
            selectinload(AwardRecommendationApplicationSubmission.application_submission)
            .selectinload(ApplicationSubmission.application)
            .selectinload(Application.organization)
            .selectinload(Organization.sam_gov_entity),
        )
    )
    submissions = list(db_session.execute(stmt).scalars().all())

    validate_all_submissions_exist(submission_ids, submissions)

    submissions_map = {
        submission.award_recommendation_application_submission_id: submission
        for submission in submissions
    }

    updated_submissions = []
    for submission_id, submission_data in update_data.items():
        submission = submissions_map[submission_id]
        submission_detail = submission.award_recommendation_submission_detail

        for field, value in submission_data.items():
            setattr(submission_detail, field, value)

        # Add audit entry for this update
        award_recommendation.award_recommendation_audit_events.append(
            AwardRecommendationAudit(
                user=user,
                award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED,
                award_recommendation_application_submission=submission,
                audit_metadata={
                    "updated_fields": list(submission_data.keys()),
                },
            )
        )

        db_session.add(submission_detail)
        updated_submissions.append(submission)

    db_session.flush()

    logger.info(
        "Successfully updated award recommendation submissions",
        extra={
            "award_recommendation_id": str(award_recommendation_id),
            "submission_count": len(updated_submissions),
        },
    )
    return updated_submissions
