import logging
import uuid

import grants_shared.adapters.db as db

from src.constants.lookup_constants import AwardRecommendationAuditEvent
from src.db.models.award_recommendation_models import AwardRecommendationAudit
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)
from src.services.award_recommendations.get_award_recommendation_attachment import (
    get_award_recommendation_attachment,
)
from src.util import file_util

logger = logging.getLogger(__name__)


def delete_award_recommendation_attachment(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> None:
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    attachment = get_award_recommendation_attachment(
        db_session, award_recommendation_id, award_recommendation_attachment_id
    )

    logger.info("Deleting award recommendation attachment from s3")
    file_util.delete_file(attachment.file_location)

    attachment.is_deleted = True
    attachment.file_location = "DELETED"

    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.ATTACHMENT_DELETED,
            award_recommendation_attachment=attachment,
        )
    )

    logger.info(
        "Successfully deleted award recommendation attachment",
        extra={
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_attachment_id": award_recommendation_attachment_id,
        },
    )
