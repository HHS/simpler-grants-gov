import logging
import uuid
from collections.abc import Sequence
from typing import Any, Iterable

from sqlalchemy import select, UnaryExpression, Result
from sqlalchemy.orm import selectinload

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.adapters.aws import S3Config
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.competition_models import Competition, CompetitionInstruction
from src.db.models.staging.instructions import Tinstructions
from src.services.competition_alpha.competition_instruction_util import (
    get_s3_competition_instruction_path,
)
from src.task.task import Task
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class TransformCompetitionInstructionConfig(PydanticBaseEnvConfig):
    # This is just for testing, we want to be able to only
    # import a few attachments when manually testing.
    total_instructions_to_process: int | None = None

    transform_competition_instruction_batch_size: int = 100


class TransformCompetitionInstruction(AbstractTransformSubTask):

    def __init__(self, task: Task, s3_config: S3Config | None = None):
        super().__init__(task)

        if s3_config is None:
            s3_config = S3Config()

        self.s3_config = s3_config

        self.config = TransformCompetitionInstructionConfig()

        self.total_instructions_processed = 0
        self.has_unprocessed_records = True

    def has_more_to_process(self) -> bool:
        return self.has_unprocessed_records

    def transform_records(self) -> None:
        logger.info("Processing competition instructions")

        # Fetch a batch of competition instructions that
        # need to be processed.
        records: Sequence[
            tuple[Tinstructions, Competition | None]
        ] = self.fetch_competition_instructions(
            # We load the instruction files into memory, so need to process very
            # small batches at a time to avoid running out of memory
            batch_size=self.config.transform_competition_instruction_batch_size,
            limit=self.config.transform_competition_instruction_batch_size,
            # Process the latest instructions first
            order_by=Tinstructions.created_date.desc(),
        )

        records_processed = self.process_competition_instruction_group(records)

        # If we have a configured value of instruction files to process
        # then we want to stop processing when we pass that number
        if (
            self.config.total_instructions_to_process is not None
            and self.total_instructions_processed >= self.config.total_instructions_to_process
        ):
            self.has_unprocessed_records = False

        # If the number of records processed doesn't match the batch size
        # we'll assume we've finished processing.
        if records_processed != self.config.transform_competition_instruction_batch_size:
            self.has_unprocessed_records = False

    def process_competition_instruction_group(
        self,
        records: Sequence[tuple[Tinstructions, Competition | None]],
    ) -> int:

        records_processed = 0
        for source_instruction, competition in records:
            try:
                # We want to increment even if we fail to process so that
                # the batch size is correct.
                records_processed += 1
                self.total_instructions_processed += 1

                # Find the existing competition instructions
                # if there are any.
                target_instruction = determine_competition_instruction(source_instruction, competition)
                # Process the competition instructions
                self.process_competition_instruction(
                    source_instruction, target_instruction, competition
                )

            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.COMPETITION_INSTRUCTION,
                )
                logger.exception(
                    "Failed to process competition instruction",
                    extra=transform_util.get_log_extra_competition_instruction(source_instruction),
                )

        return records_processed

    def process_competition_instruction(
        self,
        source_instruction: Tinstructions,
        target_instruction: CompetitionInstruction | None,
        competition: Competition | None,
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.COMPETITION_INSTRUCTION,
        )
        extra = transform_util.get_log_extra_competition_instruction(source_instruction)
        logger.info("Processing competition instruction", extra=extra)

        if source_instruction.is_deleted:
            self._handle_delete(
                source=source_instruction,
                target=target_instruction,
                record_type=transform_constants.COMPETITION_INSTRUCTION,
                extra=extra,
            )

            # Delete the file from s3 as well
            if target_instruction is not None:
                file_util.delete_file(target_instruction.file_location)

        elif competition is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Opportunity instruction cannot be processed as the competition for it does not exist"
            )

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_instruction is None

            prior_instruction_location = (
                target_instruction.file_location if target_instruction else None
            )

            logger.info("Transforming and upserting competition instruction", extra=extra)

            transformed_instruction = transform_competition_instruction(
                source_instruction, target_instruction, competition, self.s3_config
            )

            # Write the file to s3
            write_file(source_instruction, transformed_instruction)

            # If this was an update, and the file path changed
            # we want to cleanup the old file.
            if (
                prior_instruction_location is not None
                and prior_instruction_location != transformed_instruction.file_location
            ):
                file_util.delete_file(prior_instruction_location)

            logger.info("Transforming and upserting competition instruction", extra=extra)

            if is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.COMPETITION_INSTRUCTION,
                )
                self.db_session.add(transformed_instruction)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.COMPETITION_INSTRUCTION,
                )
                self.db_session.merge(transformed_instruction)

        logger.info("Processed competition instruction", extra=extra)
        source_instruction.transformed_at = self.transform_time

    def fetch_competition_instructions(self, batch_size: int, limit: int | None, order_by: UnaryExpression | None = None) -> Sequence[tuple[Tinstructions, Competition]]:
        # Note - this doesn't follow exactly the same pattern
        # as our other fetch functions defined in the base class
        # because the way the instructions are attached needs
        # some special treatment.

        stmt = (
            select(Tinstructions, Competition).join(
                Competition,
                Tinstructions.comp_id == Competition.legacy_competition_id,
                isouter=True,
            )
        ).where(Tinstructions.transformed_at.is_(None).execution_options(yield_per=batch_size))

        if limit is not None:
            stmt = stmt.limit(limit)

        if order_by is not None:
            stmt = stmt.order_by(order_by)

        return self.db_session.execute(stmt)

def build_competition_instruction_file_name(source_instruction: Tinstructions, competition: Competition) -> str:
    """Create the competition instruction file name
       in the same pattern that grants.gov did. They
       take the package ID and add the extension
       from the instruction table together.
    """

    # This shouldn't happen, we haven't seen this value null
    # in grants.gov in any environments.
    if competition.legacy_package_id is None:
        raise ValueError("Competition has no legacy package ID, cannot create a file name")

    # While the extension is generally something like pdf or doc
    # sometimes it's ".pdf" or "PDF". We're going to cleanup a bit
    # of the inconsistency.
    # Error if null, this shouldn't happen.
    # TODO - prod alone has like 70 of these
    #        from some quick testing, they don't work on grants.gov
    #        the button does nothing, so do we ignore them?
    if source_instruction.extension is None:
        raise ValueError("Competition has no extension, cannot create a file name")

    # TODO - do we want to deal with white space? "gov 2018.pdf" is a common one
    # probably not?

    # Lowercase, remove any surrounding white space, and remove a leading '.'
    extension = source_instruction.extension.lower().strip().removeprefix(".")

    return f"{competition.legacy_package_id}.{extension}"

def transform_competition_instruction(
    source_instruction: Tinstructions,
    existing_instruction: CompetitionInstruction | None,
    competition: Competition,
    s3_config: S3Config,
) -> CompetitionInstruction:
    log_extra = transform_util.get_log_extra_competition_instruction(source_instruction)

    if existing_instruction is None:
        logger.info("Creating new competition instruction record", extra=log_extra)

    file_name = build_competition_instruction_file_name(source_instruction, competition)

    # Copy the ID if the file already exists
    if existing_instruction:
        instruction_id = existing_instruction.competition_instruction_id
    else:
        instruction_id = uuid.uuid4()

    file_location = get_s3_competition_instruction_path(
        file_name, instruction_id, competition, s3_config
    )

    target_instruction = CompetitionInstruction(
        competition_instruction_id=instruction_id,
        file_location=file_location,
        file_name=file_name,
    )

    transform_util.transform_update_create_timestamp(
        source_instruction, target_instruction, log_extra=log_extra
    )

    return target_instruction

def determine_competition_instruction(source_instruction: Tinstructions, competition: Competition | None) -> CompetitionInstruction | None:
    """Figure out which existing competition instruction
       record we want to copy the source instructions to.

       If there are no existing competition instructions,
       then this will return None.
    """

    # We handle erroring for competition being null
    # later in processing, just skip over it for now
    if competition is None:
        return None

    file_name = build_competition_instruction_file_name(source_instruction, competition)

    # Try to find the competition instruction record we already have
    # Note that this is JUST relying on the file names matching as
    # that's the best we can do to match, grants.gov only ever had
    # a single file per competition, so this should be fine.
    for competition_instruction in competition.competition_instructions:
        if file_name == competition_instruction.file_name:
            return competition_instruction

    return None


def write_file(
    source_instruction: Tinstructions, destination_instruction: CompetitionInstruction
) -> None:

    if source_instruction.instructions is None:
        raise ValueError("Competition instructions are null, cannot copy")

    with file_util.open_stream(
        destination_instruction.file_location, "wb", content_type=source_instruction.mimetype
    ) as outfile:
        outfile.write(source_instruction.instructions)
