import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.adapters.aws import S3Config
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util import file_util
from sqlalchemy import select

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import CompetitionInstruction
from src.db.models.user_models import User
from src.services.competition_alpha.competition_instruction_util import (
    get_s3_competition_instruction_path,
)
from src.services.competition_alpha.get_competition import get_competition
from src.services.files.pending_file_handling_domain_specific import (
    fetch_and_validate_scan_complete_file,
    move_pending_file_to_destination,
)
from src.services.opportunities_grantor_v1.get_opportunity import get_opportunity_for_grantors
from src.services.opportunities_grantor_v1.opportunity_utils import (
    validate_opportunity_created_in_simpler_grants,
)

logger = logging.getLogger(__name__)


def upload_competition_instruction(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    competition_id: uuid.UUID,
    pending_file_id: uuid.UUID,
) -> CompetitionInstruction:
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

    pending_file = fetch_and_validate_scan_complete_file(db_session, pending_file_id, user)

    # Process the file
    s3_config = S3Config()
    instruction_id = uuid.uuid4()
    secure_file_name = file_util.get_secure_file_name(pending_file.file_name)

    file_path = get_s3_competition_instruction_path(
        file_name=secure_file_name,
        competition_instruction_id=instruction_id,
        competition=competition,
        s3_config=s3_config,
    )

    # Create the instruction record
    instruction = CompetitionInstruction(
        competition_instruction_id=instruction_id,
        competition_id=competition_id,
        file_location=file_path,
        file_name=pending_file.file_name,
        legacy_competition_id=None,
    )
    db_session.add(instruction)

    move_pending_file_to_destination(pending_file, file_path)

    logger.info(
        "Added instruction to competition",
        extra={
            "competition_id": competition_id,
            "opportunity_id": opportunity_id,
            "competition_instruction_id": instruction_id,
            "file_name": pending_file.file_name,
        },
    )

    return instruction


def delete_competition_instruction(
    db_session: db.Session,
    user: User,
    opportunity_id: uuid.UUID,
    competition_id: uuid.UUID,
    competition_instruction_id: uuid.UUID,
) -> None:
    """Delete an instruction file from a competition"""
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

    # Find the instruction
    instruction = db_session.execute(
        select(CompetitionInstruction).where(
            CompetitionInstruction.competition_id == competition_id,
            CompetitionInstruction.competition_instruction_id == competition_instruction_id,
        )
    ).scalar_one_or_none()

    if not instruction:
        raise_flask_error(404, "Instruction not found")

    # Delete from database
    db_session.delete(instruction)

    # Delete from S3
    file_util.delete_file(instruction.file_location)

    logger.info(
        "Deleted competition instruction",
        extra={
            "opportunity_id": opportunity_id,
            "competition_id": competition_id,
            "competition_instruction_id": competition_instruction_id,
        },
    )
