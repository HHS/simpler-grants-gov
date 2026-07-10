import re
import uuid

from grants_shared.adapters.aws import S3Config
from grants_shared.util import file_util

from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity


def get_s3_attachment_path(
    file_name: str,
    opportunity_attachment_id: uuid.UUID,
    opportunity: Opportunity,
    s3_config: S3Config,
) -> str:
    """Construct a path to the attachments on s3

    Will be formatted like:

        s3://<bucket>/opportunities/<opportunity_id>/attachments/<attachment_id>/<file_name>

    Note that we store the files under a "folder" with the attachment ID as
    the legacy system doesn't guarantee file names are unique within an opportunity.
    """

    base_path = (
        s3_config.draft_files_bucket_path
        if opportunity.is_draft
        else s3_config.public_files_bucket_path
    )

    return file_util.join(
        base_path,
        "opportunities",
        str(opportunity.opportunity_id),
        "attachments",
        str(opportunity_attachment_id),
        file_name,
    )


def get_s3_competition_instruction_path(
    file_name: str,
    competition_instruction_id: uuid.UUID,
    competition: Competition,
    s3_config: S3Config,
) -> str:
    """Construct a path to the competition instructions on s3

    Will be formatted like:

        s3://<bucket>/opportunities/<opportunity_id>/competitions/<competition_id>/instructions/<instruction_id>/<file_name>

    Note that we store the files under a "folder" with the instruction ID as
    the legacy system doesn't guarantee file names are unique within a competition.
    """

    # Competition instructions should go in draft bucket if opportunity is draft
    base_path = (
        s3_config.draft_files_bucket_path
        if competition.opportunity.is_draft
        else s3_config.public_files_bucket_path
    )

    return file_util.join(
        base_path,
        "opportunities",
        str(competition.opportunity_id),
        "competitions",
        str(competition.competition_id),
        "instructions",
        str(competition_instruction_id),
        file_name,
    )


def adjust_legacy_file_name(existing_file_name: str) -> str:
    """Correct the file names to remove any characters problematic for URL/s3 processing.

    We only keep the following characters:
    * A-Z
    * a-z
    * 0-9
    * _
    * -
    * ~
    * .

    Whitespace will be replaced with underscores.

    All other characters will be removed.
    """

    # Replace one-or-more whitespace with a single underscore
    file_name = re.sub(r"\s+", "_", existing_file_name)

    # Remove all non-accepted characters
    file_name = re.sub(r"[^a-zA-Z0-9_.\-~]", "", file_name)

    return file_name
