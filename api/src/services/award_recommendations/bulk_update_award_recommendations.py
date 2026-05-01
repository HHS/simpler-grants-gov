import logging
import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import AwardRecommendationAuditEvent, Privilege
from src.db.models.award_recommendation_models import (
    AwardRecommendation,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_and_verify_access,
)

logger = logging.getLogger(__name__)


BULK_UPDATE_ALLOWED_FIELDS = {
    "award_selection_method",
    "additional_info",
    "funding_strategy",
    "selection_method_detail",
    "other_key_information",
}


def bulk_update_award_recommendations(
    db_session: db.Session,
    user: User,
    award_recommendation_ids: list[uuid.UUID],
    update_data: dict,
) -> list[AwardRecommendation]:
    """
    Bulk update award recommendations.

    Omitted fields are left unchanged.
    Fields explicitly provided as None are cleared.
    """

    unexpected_fields = set(update_data.keys()) - BULK_UPDATE_ALLOWED_FIELDS
    if unexpected_fields:
        raise ValueError(f"Unexpected update fields: {sorted(unexpected_fields)}")

    updated_award_recommendations: list[AwardRecommendation] = []

    for award_recommendation_id in award_recommendation_ids:
        award_recommendation = get_award_recommendation_and_verify_access(
            db_session,
            user,
            award_recommendation_id,
        )

        agency = award_recommendation.opportunity.agency_record
        verify_access(
            user,
            {Privilege.UPDATE_AWARD_RECOMMENDATION},
            agency,
        )

        for field_name, value in update_data.items():
            setattr(award_recommendation, field_name, value)

        award_recommendation.award_recommendation_audit_events.append(
            AwardRecommendationAudit(
                user=user,
                award_recommendation_audit_event=(
                    AwardRecommendationAuditEvent.AWARD_RECOMMENDATION_UPDATED
                ),
            )
        )

        db_session.add(award_recommendation)
        updated_award_recommendations.append(award_recommendation)

    db_session.flush()

    logger.info(
        "Bulk updated award recommendations",
        extra={
            "award_recommendation_ids": [
                str(award_recommendation_id)
                for award_recommendation_id in award_recommendation_ids
            ],
            "updated_fields": list(update_data.keys()),
            "record_count": len(updated_award_recommendations),
        },
    )

    return updated_award_recommendations