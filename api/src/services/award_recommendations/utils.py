"""Utility functions for award recommendation services."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.award_recommendation_models import AwardRecommendationApplicationSubmission
from src.db.models.competition_models import Application, ApplicationSubmission
from src.db.models.entity_models import Organization
from src.validation.validation_constants import ValidationErrorType


def get_validated_submissions(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    submission_ids: list[uuid.UUID] | set[uuid.UUID],
    eager_load: bool = False,
    return_dict: bool = False,
) -> (
    list[AwardRecommendationApplicationSubmission]
    | dict[uuid.UUID, AwardRecommendationApplicationSubmission]
):
    """
    Validate that all requested submission IDs exist and belong to the award recommendation.

    Args:
        db_session: The database session
        award_recommendation_id: The ID of the award recommendation
        submission_ids: Collection of submission IDs to validate
        eager_load: Whether to eager load related entities
        return_dict: If True, returns a dict mapping IDs to submissions, otherwise returns a list

    Returns:
        Either a list of submission objects or a dictionary mapping IDs to submission objects

    Raises:
        Flask error with 404 status if any submissions are not found
    """
    # Convert to set to deduplicate
    submission_ids_set = set(submission_ids)

    # Build the query
    if eager_load:
        # Use query style with eager loading
        query = (
            db_session.query(AwardRecommendationApplicationSubmission)
            .filter(
                AwardRecommendationApplicationSubmission.award_recommendation_id
                == award_recommendation_id,
                AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
                    submission_ids_set
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
        submissions = query.all()
    else:
        # Use select style without eager loading
        stmt = select(AwardRecommendationApplicationSubmission).where(
            AwardRecommendationApplicationSubmission.award_recommendation_id
            == award_recommendation_id,
            AwardRecommendationApplicationSubmission.award_recommendation_application_submission_id.in_(
                submission_ids_set
            ),
        )
        submissions = list(db_session.execute(stmt).scalars().all())

    # Check if all IDs were found
    if len(submissions) != len(submission_ids_set):
        found_ids = {s.award_recommendation_application_submission_id for s in submissions}
        missing_ids = [sid for sid in submission_ids_set if sid not in found_ids]

        # Create structured validation errors
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

    # Return in the requested format
    if return_dict:
        return {s.award_recommendation_application_submission_id: s for s in submissions}

    return submissions
