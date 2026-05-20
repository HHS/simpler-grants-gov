import logging
import uuid

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import AwardRecommendationAuditEvent
from src.db.models.award_recommendation_models import (
    AwardRecommendationAttachment,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)
from src.util import file_util

logger = logging.getLogger(__name__)


def get_attachment_for_update(
    db_session: db.Session,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> AwardRecommendationAttachment:
    stmt = select(AwardRecommendationAttachment).where(
        AwardRecommendationAttachment.award_recommendation_attachment_id
        == award_recommendation_attachment_id,
        AwardRecommendationAttachment.award_recommendation_id == award_recommendation_id,
        AwardRecommendationAttachment.is_deleted.isnot(True),
    )

    attachment = db_session.execute(stmt).scalar_one_or_none()
    if attachment is None:
        raise_flask_error(
            404,
            message=(
                f"Could not find Award Recommendation Attachment with ID "
                f"{award_recommendation_attachment_id}"
            ),
        )

    return attachment


def delete_award_recommendation_attachment(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> None:
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    attachment = get_attachment_for_update(
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
