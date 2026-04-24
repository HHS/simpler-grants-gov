import logging
import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import AwardRecommendationAuditEvent, Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)
from src.services.award_recommendations.utils import get_validated_submissions

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
    # Get and verify access to the award recommendation
    award_recommendation = get_award_recommendation_and_verify_access(
        db_session, user, award_recommendation_id
    )

    # Verify update permission
    agency = award_recommendation.opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    # Get all submission IDs to update
    submission_ids = list(update_data.keys())
    if not submission_ids:
        return []

    # Get validated submissions with eager loading, returning a dictionary for easier lookups
    submissions_map = get_validated_submissions(
        db_session,
        award_recommendation_id,
        submission_ids,
        eager_load=True,
        return_dict=True,
    )

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
