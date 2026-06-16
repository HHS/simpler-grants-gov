import logging
import uuid

import grants_shared.adapters.db as db
from sqlalchemy import select

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendationApplicationSubmission,
    AwardRecommendationSubmissionDetail,
)
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def bulk_update_award_recommendation_submission_details(
    db_session: db.Session,
    user: User,
    award_recommendation_submission_detail_ids: list[uuid.UUID],
    bulk_field_updates: dict,
    individual_updates: dict[uuid.UUID, dict],
) -> list[AwardRecommendationSubmissionDetail]:
    """
    Bulk update award recommendation submission details.

    All bulk fields are required and applied to every submission detail record.
    All individual fields are required per submission detail record.
    """

    requested_ids = set(award_recommendation_submission_detail_ids)
    individual_update_ids = set(individual_updates.keys())

    missing_individual_ids = requested_ids - individual_update_ids
    if missing_individual_ids:
        raise ValueError(
            "Missing individual updates for award recommendation submission detail IDs: "
            f"{sorted(str(id_) for id_ in missing_individual_ids)}"
        )

    unexpected_individual_ids = individual_update_ids - requested_ids
    if unexpected_individual_ids:
        raise ValueError(
            "Individual updates provided for records not included in "
            "award_recommendation_submission_detail_ids: "
            f"{sorted(str(id_) for id_ in unexpected_individual_ids)}"
        )

    updated_submission_details: list[AwardRecommendationSubmissionDetail] = []

    for submission_detail_id in award_recommendation_submission_detail_ids:
        xref = db_session.execute(
            select(AwardRecommendationApplicationSubmission).where(
                AwardRecommendationApplicationSubmission.award_recommendation_submission_detail_id
                == submission_detail_id
            )
        ).scalar_one_or_none()

        if xref is None:
            raise ValueError(
                f"Award recommendation submission detail {submission_detail_id} "
                "is not linked to an award recommendation application submission"
            )

        award_recommendation = xref.award_recommendation
        agency = award_recommendation.opportunity.agency_record

        verify_access(
            user,
            {Privilege.UPDATE_AWARD_RECOMMENDATION},
            agency,
        )

        submission_detail = xref.award_recommendation_submission_detail

        submission_detail.award_recommendation_type = (
            bulk_field_updates["award_recommendation_type"]
        )
        submission_detail.has_exception = bulk_field_updates["has_exception"]
        submission_detail.general_comment = bulk_field_updates["general_comment"]
        submission_detail.exception_detail = bulk_field_updates["exception_detail"]
        submission_detail.recommended_amount = individual_updates[
            submission_detail_id
        ]["recommended_amount"]

        db_session.add(submission_detail)
        updated_submission_details.append(submission_detail)

    db_session.flush()

    return updated_submission_details