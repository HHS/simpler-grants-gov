import logging
import uuid
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import (
    AwardRecommendationAuditEvent,
    AwardRecommendationType,
    Privilege,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
    AwardRecommendationSubmissionDetail,
)
from src.db.models.competition_models import Application, ApplicationSubmission
from src.db.models.entity_models import Organization
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)

logger = logging.getLogger(__name__)


def update_award_recommendation_submissions(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    update_data: Dict[uuid.UUID, Dict],
) -> List[AwardRecommendationApplicationSubmission]:  # Return actual models like list endpoint
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
    try:
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
            # If no submissions provided, return empty list
            return []

        # Query all submission records that match the IDs and are part of this award recommendation
        submissions_query = (
            db_session.query(AwardRecommendationApplicationSubmission)
            .filter(
                AwardRecommendationApplicationSubmission.award_recommendation_id
                == award_recommendation_id,
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
                    submission_ids
                ),
            )
            .all()
        )

        # Build a mapping of submission ID to submission object for quick lookup
        submissions_map = {
            str(sub.award_recommendation_application_submission_id): sub
            for sub in submissions_query
        }

        # Process updates for each submission in the request
        updated_submissions = []
        for submission_id_str, submission_data in update_data.items():
            submission_id = uuid.UUID(str(submission_id_str))

            # Skip if submission not found in query results
            if str(submission_id) not in submissions_map:
                continue

            submission = submissions_map[str(submission_id)]
            submission_detail = submission.award_recommendation_submission_detail

            # Update all fields in the submission detail
            if "recommended_amount" in submission_data:
                submission_detail.recommended_amount = submission_data.get("recommended_amount")

            if "scoring_comment" in submission_data:
                submission_detail.scoring_comment = submission_data.get("scoring_comment")

            if "general_comment" in submission_data:
                submission_detail.general_comment = submission_data.get("general_comment")

            if "award_recommendation_type" in submission_data:
                award_type = submission_data.get("award_recommendation_type")
                # Handle both string enum names and actual enum objects
                if isinstance(award_type, str):
                    try:
                        submission_detail.award_recommendation_type = AwardRecommendationType[
                            award_type
                        ]
                    except (KeyError, ValueError):
                        # If string doesn't match enum value, try using it directly
                        submission_detail.award_recommendation_type = award_type
                else:
                    submission_detail.award_recommendation_type = award_type

            if "has_exception" in submission_data:
                submission_detail.has_exception = submission_data.get("has_exception")

            if "exception_detail" in submission_data:
                submission_detail.exception_detail = submission_data.get("exception_detail")

            # Add audit entry for this update
            award_recommendation.award_recommendation_audit_events.append(
                AwardRecommendationAudit(
                    user=user,
                    award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED,
                    award_recommendation_application_submission=submission,
                    audit_metadata={
                        "submission_id": str(submission_id),
                        "updated_fields": list(submission_data.keys()),
                    },
                )
            )

            db_session.add(submission_detail)
            updated_submissions.append(submission)

        db_session.flush()

        if updated_submissions:
            logger.info(
                "Successfully updated award recommendation submissions",
                extra={
                    "award_recommendation_id": str(award_recommendation_id),
                    "submission_count": len(updated_submissions),
                },
            )

            stmt = (
                select(AwardRecommendationApplicationSubmission)
                .where(
                    AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
                        [
                            sub.award_recommendation_application_submission_id
                            for sub in updated_submissions
                        ]
                    )
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

            return db_session.execute(stmt).scalars().all()

        return []

    except Exception as e:
        logger.error(
            f"Error updating award recommendation submissions: {str(e)}",
            extra={
                "award_recommendation_id": str(award_recommendation_id),
                "error": str(e),
            },
            exc_info=True,
        )
        raise
