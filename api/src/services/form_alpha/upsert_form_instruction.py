import logging
import uuid

from werkzeug.datastructures import FileStorage

import src.adapters.db as db
import src.util.file_util as file_util
from src.adapters.aws import S3Config
from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import SubmissionIssue
from src.db.models.competition_models import FormInstruction

logger = logging.getLogger(__name__)


def upsert_form_instruction(
    db_session: db.Session,
    form_id: uuid.UUID,
    form_instruction_id: uuid.UUID,
    file_obj: FileStorage,
) -> FormInstruction:
    """
    Upsert a form instruction.
    If the form instruction exists, update it.
    If not, create it.
    Upload the file to S3.
    """
    if file_obj.filename is None:
        logger.info(
            "Invalid file name, cannot parse",
        )
        raise_flask_error(422, "Invalid file name, cannot parse")

    secure_file_name = file_util.get_secure_file_name(file_obj.filename)

    # Check if form instruction exists
    form_instruction = db_session.get(FormInstruction, form_instruction_id)

    if not form_instruction:
        form_instruction = FormInstruction(
            form_instruction_id=form_instruction_id,
            file_name=file_util.get_file_name(file_obj.filename),
        )
        db_session.add(form_instruction)

    # Construct S3 path
    # s3://{public_files_bucket_path}/forms/{form_id}/instructions/{file_name}
    s3_config = S3Config()
    base_path = s3_config.public_files_bucket_path

    new_s3_location = file_util.join(
        base_path, "forms", str(form_id), "instructions", secure_file_name
    )

    # If updating, check if we need to delete old file
    if form_instruction.file_location and form_instruction.file_location != new_s3_location:
        # Delete old file
        logger.info(
            "Deleting old form instruction file",
            extra={"old_file_location": form_instruction.file_location},
        )
        try:
            file_util.delete_file(form_instruction.file_location)
        except Exception:
            logger.exception(
                "Failed to delete old form instruction file",
                extra={"old_file_location": form_instruction.file_location},
            )

    # Upload to S3
    with file_util.open_stream(
        new_s3_location, mode="wb", content_type=file_obj.mimetype
    ) as writefile:
        file_obj.save(writefile)

    form_instruction.file_location = new_s3_location
    form_instruction.file_name = file_util.get_file_name(file_obj.filename)

    return form_instruction
