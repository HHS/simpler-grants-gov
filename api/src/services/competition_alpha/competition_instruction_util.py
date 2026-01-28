import uuid

from src.adapters.aws import S3Config
from src.db.models.competition_models import Competition
from src.util import file_util


def get_s3_competition_instruction_path(
    file_name: str,
    competition_instruction_id: uuid.UUID,
    competition: Competition,
    s3_config: S3Config,
) -> str:
    """Construct a path to the attachments on s3

    Will be formatted like:

        s3://<bucket>/competitions/<competition_id>/instructions/<competition_instruction_id>/<file_name>

    """
    # The base path has to be the draft bucket
    # if the opportunity itself is currently a draft
    base_path = (
        s3_config.draft_files_bucket_path
        if competition.opportunity.is_draft
        else s3_config.public_files_bucket_path
    )

    return file_util.join(
        base_path,
        "competitions",
        str(competition.competition_id),
        "instructions",
        str(competition_instruction_id),
        file_name,
    )
