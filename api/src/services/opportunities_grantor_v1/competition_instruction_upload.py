import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.adapters.aws import S3Config
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util import file_util
from werkzeug.datastructures import FileStorage

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import CompetitionInstruction
from src.db.models.user_models import User
from src.services.competition_alpha.competition_instruction_util import (
    get_s3_competition_instruction_path,
)
from src.services.competition_alpha.get_competition import get_competition
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
)
from src.services.opportunity_attachments.attachment_util import adjust_legacy_file_name

logger = logging.getLogger(__name__)


def upload_competition_instruction(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    competition_id: uuid.UUID,
    file_data: FileStorage,
) -> str:
    """Upload an instruction file to a competition"""
    # Get the opportunity and verify it exists
    opportunity = get_opportunity_for_grantors(db_session, user, opportunity_id)

    # Check if user has permission to update opportunities for this agency
    verify_access(user, {Privilege.UPDATE_OPPORTUNITY}, opportunity.agency_record)

    # Verify opportunity was created in Simpler Grants
    validate_opportunity_created_in_simpler_grants(opportunity)

    # Get the competition and verify it exists
    competition = get_competition(db_session, competition_id)

    # Verify competition belongs to the opportunity
    if competition.opportunity_id != opportunity_id:
        raise_flask_error(
            404, message=f"Competition {competition_id} not found for opportunity {opportunity_id}"
        )

    # Process the file
    s3_config = S3Config()
    instruction_id = uuid.uuid4()

    # Extract file metadata
    if not file_data.filename:
        raise_flask_error(422, "File must have a filename")

    file_name = adjust_legacy_file_name(file_data.filename)

    # Create S3 path for the file
    file_path = get_s3_competition_instruction_path(
        file_name=file_name,
        competition_instruction_id=instruction_id,
        competition=competition,
        s3_config=s3_config,
    )

    # Write the file to S3
    mime_type = file_data.mimetype or "application/octet-stream"
    with file_util.open_stream(file_path, "wb", content_type=mime_type) as f:
        file_data.save(f)

    # Create the instruction record
    instruction = CompetitionInstruction(
        competition_instruction_id=instruction_id,
        competition_id=competition_id,
        file_location=file_path,
        file_name=file_name,
        legacy_competition_id=None,
    )

    db_session.add(instruction)

    logger.info(
        "Added instruction to competition",
        extra={
            "competition_id": competition_id,
            "opportunity_id": opportunity_id,
            "competition_instruction_id": instruction_id,
            "file_name": file_name,
        },
    )

    return str(instruction_id)
