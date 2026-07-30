import logging
import uuid

import grants_shared.adapters.db as db
import grants_shared.util.file_util as file_util
from grants_shared.adapters.aws import S3Config

from src.constants.lookup_constants import (
    AwardRecommendationAttachmentType,
    AwardRecommendationAuditEvent,
)
from src.db.models.award_recommendation_models import (
    AwardRecommendationAttachment,
    AwardRecommendationAudit,
)
from src.db.models.user_models import User
from src.services.award_recommendations.get_award_recommendation import (
    get_award_recommendation_for_update,
)
from src.services.files.pending_file_handling_domain_specific import (
    fetch_and_validate_scan_complete_file,
    move_pending_file_to_destination,
)

logger = logging.getLogger(__name__)


def create_award_recommendation_attachment(
    db_session: db.Session,
    user: User,
    award_recommendation_id: uuid.UUID,
    request_data: dict,
) -> AwardRecommendationAttachment:
    """Create an award recommendation attachment from a virus-scanned pending file.

    Accepts a ``pending_file_id`` referencing a file uploaded via ``POST /v1/files``
    that has cleared the virus scanner (``FileScanStatus.COMPLETE``). The pending
    file is moved (not copied) into the award recommendation attachments path.
    """
    award_recommendation = get_award_recommendation_for_update(
        db_session, user, award_recommendation_id
    )

    pending_file_id: uuid.UUID = request_data["pending_file_id"]
    attachment_type: AwardRecommendationAttachmentType = request_data[
        "award_recommendation_attachment_type"
    ]
    # Optional override for the pending file's display / path name
    file_name_override: str | None = request_data.get("file_name")

    pending_file = fetch_and_validate_scan_complete_file(db_session, pending_file_id, user)

    raw_file_name = file_name_override or pending_file.file_name
    secure_file_name = file_util.get_secure_file_name(raw_file_name)

    award_recommendation_attachment_id = uuid.uuid4()
    s3_file_location = build_s3_award_recommendation_attachment_path(
        secure_file_name, award_recommendation_id, award_recommendation_attachment_id
    )

    # Persist attachment before moving the file so a DB failure leaves the
    # pending file in its original scanned location.
    user = db_session.merge(user)

    attachment = AwardRecommendationAttachment(
        award_recommendation_attachment_id=award_recommendation_attachment_id,
        award_recommendation=award_recommendation,
        file_location=s3_file_location,
        file_name=file_util.get_file_name(raw_file_name),
        award_recommendation_attachment_type=attachment_type,
        uploading_user=user,
    )
    db_session.add(attachment)

    award_recommendation.award_recommendation_audit_events.append(
        AwardRecommendationAudit(
            user=user,
            award_recommendation_audit_event=AwardRecommendationAuditEvent.ATTACHMENT_CREATED,
            award_recommendation_attachment=attachment,
        )
    )

    # Move (not copy) after DB writes — pending file is consumed and marked PROCESSED.
    move_pending_file_to_destination(pending_file, s3_file_location)

    logger.info(
        "Created award recommendation attachment",
        extra={
            "award_recommendation_id": award_recommendation_id,
            "award_recommendation_attachment_id": award_recommendation_attachment_id,
            "pending_file_id": pending_file_id,
        },
    )
    return attachment


def build_s3_award_recommendation_attachment_path(
    file_name: str,
    award_recommendation_id: uuid.UUID,
    award_recommendation_attachment_id: uuid.UUID,
) -> str:
    """Construct a path to the award recommendation attachments on s3

    Will be formatted like:

        s3://<bucket>/award-recommendations/<award_recommendation_id>/attachments/<attachment_id>/<file_name>

    We store each file in a separate folder as we don't require file names to be unique.
    """
    s3_config = S3Config()
    base_path = s3_config.draft_files_bucket_path

    return file_util.join(
        base_path,
        "award-recommendations",
        str(award_recommendation_id),
        "attachments",
        str(award_recommendation_attachment_id),
        file_name,
    )
