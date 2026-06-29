import logging
import uuid
from collections.abc import Sequence

import grants_shared.adapters.db as db
from grants_shared.api.response import ValidationErrorDetail
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import AwardRecommendationAuditEvent, Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationApplicationSubmission,
    AwardRecommendationAudit,
    AwardRecommendationSubmissionDetail,
)
from src.db.models.user_models import User
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def bulk_update_submission_details(
    db_session: db.Session,
    user: User,
    json_data: dict,
) -> Sequence[AwardRecommendationSubmissionDetail]:
    """
    Bulk update award recommendation submission details.

    Applies shared bulk updates to all selected records and individual updates
    to specific records. All records must belong to the same parent Award
    Recommendation Submission.

    Args:
        db_session: Database session
        user: User making the request
        json_data: Request data containing record_ids, bulk_field_updates, individual_updates

    Returns:
        List of updated AwardRecommendationSubmissionDetail records

    Raises:
        404: If any record_id doesn't exist
        422: If records belong to different parents or validation fails
        403: If user lacks required privileges
        401: If user is not authenticated
    """
    record_ids = [
        rid if isinstance(rid, uuid.UUID) else uuid.UUID(rid) for rid in json_data["record_ids"]
    ]
    bulk_updates = json_data["bulk_field_updates"]
    individual_updates = json_data["individual_updates"]

    # Fetch all submission detail records
    stmt = select(AwardRecommendationSubmissionDetail).filter(
        AwardRecommendationSubmissionDetail.award_recommendation_submission_detail_id.in_(
            record_ids
        )
    )
    records = list(db_session.execute(stmt).scalars().all())

    # Validate all records exist
    if len(records) != len(record_ids):
        found_ids = {r.award_recommendation_submission_detail_id for r in records}
        missing_ids = set(record_ids) - found_ids
        raise_flask_error(
            404,
            message=f"One or more Award Recommendation Submission Details not found: {missing_ids}",
        )

    # Get all parent award recommendations by querying application submissions
    # that reference these submission details
    app_submission_stmt = (
        select(AwardRecommendationApplicationSubmission)
        .options(
            selectinload(
                AwardRecommendationApplicationSubmission.award_recommendation
            ).selectinload(AwardRecommendation.opportunity)
        )
        .filter(
            AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id.in_(
                record_ids
            )
        )
    )
    app_submissions = list(db_session.execute(app_submission_stmt).scalars().all())

    if not app_submissions:
        raise_flask_error(
            422,
            message="No award recommendation found for the selected submission details",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.INVALID,
                    message="Submission details are not linked to any award recommendation",
                    field="record_ids",
                )
            ],
        )

    # Validate all records belong to same parent award recommendation
    award_recommendation_ids = {app_sub.award_recommendation_id for app_sub in app_submissions}
    if len(award_recommendation_ids) > 1:
        raise_flask_error(
            422,
            message=f"All records must belong to the same Award Recommendation. Found {len(award_recommendation_ids)} different award recommendations.",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.INVALID,
                    message="Records belong to multiple award recommendations",
                    field="record_ids",
                )
            ],
        )

    # Get the award recommendation and verify authorization
    award_recommendation = app_submissions[0].award_recommendation

    agency = award_recommendation.opportunity.agency_record
    verify_access(user, {Privilege.UPDATE_AWARD_RECOMMENDATION}, agency)

    # Apply bulk updates to all records
    updated_records = []
    for record in records:
        # Apply bulk field updates
        for field, value in bulk_updates.items():
            if value is not None:  # Only update if value is provided
                setattr(record, field, value)

        # Apply individual updates
        individual_data = None
        for key in individual_updates.keys():
            if key == record.award_recommendation_submission_detail_id:
                individual_data = individual_updates[key]
                break

        if individual_data:
            for field, value in individual_data.items():
                if value is not None:
                    setattr(record, field, value)

        db_session.add(record)
        updated_records.append(record)

    # Create audit entry for bulk update
    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_SUBMISSION_UPDATED,
            audit_metadata={
                "bulk_update": True,
                "record_count": len(updated_records),
                "bulk_fields": list(bulk_updates.keys()),
                "submission_detail_ids": [
                    str(r.award_recommendation_submission_detail_id) for r in updated_records
                ],
            },
        )
    )

    db_session.flush()

    logger.info(
        "Successfully bulk updated award recommendation submission details",
        extra={
            "award_recommendation_id": award_recommendation.award_recommendation_id,
            "record_count": len(updated_records),
            "user_id": user.user_id,
        },
    )

    return updated_records
