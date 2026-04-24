"""Utility functions for award recommendation services."""

import uuid

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.award_recommendation_models import AwardRecommendationApplicationSubmission
from src.validation.validation_constants import ValidationErrorType


def validate_all_submissions_exist(
    requested_ids: list[uuid.UUID] | set[uuid.UUID],
    found_submissions: list[AwardRecommendationApplicationSubmission],
) -> None:
    """
    Validates that all requested submission IDs exist in the found submissions list.

    Args:
        requested_ids: Collection of submission IDs that were requested
        found_submissions: List of submission objects that were found

    Raises:
        Flask error with 404 status if any submissions are not found
    """
    requested_ids_set = set(requested_ids)
    found_ids = {s.award_recommendation_application_submission_id for s in found_submissions}

    if len(found_ids) != len(requested_ids_set):
        missing_ids = [sid for sid in requested_ids_set if sid not in found_ids]
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
