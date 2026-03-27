import logging
import uuid
from collections.abc import Sequence

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
    """Transform a competition instruction from the legacy tinstructions table
    to our competition_instruction table.

    Notable details:
    * The file name isn't directly stored in tinstructions and is calculated
      based on legacy_package_id + an extension, so we have to calculate it
      as we are doing the transformation. Rarely, an extension can be missing,
      and in these cases we skip processing them as they don't function correctly
      on grants.gov anyways.
    * We process batches as the files are stored directly in grants.gov's DB
      table so loading many records into memory is going to hit issues. After
      the initial first time load, this won't matter much. This follows the same
      pattern as transforming an opportunity attachment.
    """

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
            tuple[Tinstructions, CompetitionInstruction | None, Competition | None]
        ] = self.fetch_with_competition(
            source_model=Tinstructions,
            destination_model=CompetitionInstruction,
            join_clause=[Tinstructions.comp_id == CompetitionInstruction.legacy_competition_id],
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
        records: Sequence[tuple[Tinstructions, CompetitionInstruction | None, Competition | None]],
    ) -> int:
        """Process a competition instructions transform, taking in
        * Tinstructions record to transform
        * An existing CompetitionInstruction record (if doing an update)
        * The Competition that the instruction is attached to (nullable to handle deletes, but will error otherwise)
        """
        records_processed = 0
        for source_instruction, target_instruction, competition in records:
            try:
                # We want to increment even if we fail to process so that
                # the batch size is correct.
                records_processed += 1
                self.total_instructions_processed += 1

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
        """Process a transformation for a competition instruction.

        The following scenarios are accounted for (order matters / mutually exclusive)
        1. Deleting an instruction record - includes cleaning up s3
        2. Erroring if the competition does not exist
        3. Skipping instructions missing legacy_package_id or extension (required for generating a filename)
        4. Handling inserts / updates

        If processing is successful, we update the transformed_at at the end
        """
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.COMPETITION_INSTRUCTION,
        )
        extra = transform_util.get_log_extra_competition_instruction(source_instruction)
        logger.info("Processing competition instruction", extra=extra)

        ##########
        # Delete
        ##########
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

        ##########
        # Null Competition
        ##########
        elif competition is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Opportunity instruction cannot be processed as the competition for it does not exist"
            )

        ##########
        # Null filename parameters
        ##########
        elif competition.legacy_package_id is None or source_instruction.extension is None:
            # If the legacy package ID or extension is None
            # we can't copy the file over as we can't determine
            # a file name for it. However, in grants.gov
            # these files also just don't function correctly.
            # Since we can't copy it over, we're instead going to
            # mark it as processed and leave a note.
            self.increment(
                transform_constants.Metrics.TOTAL_INVALID_RECORD_SKIPPED,
                prefix=transform_constants.COMPETITION_INSTRUCTION,
            )
            logger.info(
                "Cannot copy competition instructions, legacy_package_id and extension must both be non-null",
                extra=extra
                | {
                    "legacy_package_id": competition.legacy_package_id,
                    "extension": source_instruction.extension,
                },
            )
            # transformed_at is added after the else below
            source_instruction.transformation_notes = (
                "Competition cannot have name generated due to missing required inputs - skipping"
            )

        ##########
        # Insert / Update
        ##########
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


def build_competition_instruction_file_name(
    source_instruction: Tinstructions, competition: Competition
) -> str:
    """Create the competition instruction file name
    in the same pattern that grants.gov did. They
    take the package ID and add the extension
    from the instruction table together.
    """

    # Note - we shouldn't ever hit these errors
    # as we skip processing the instructions entirely if they're null.
    # This is just to be certain / be type safe.
    # Package ID shouldn't ever be null, we didn't see it null in any env.
    # Extension is rarely null (~70 in prod)
    if competition.legacy_package_id is None:
        raise ValueError("Competition has no legacy package ID, cannot create a file name")
    if source_instruction.extension is None:
        raise ValueError("Competition has no extension, cannot create a file name")

    # While the extension is generally something like pdf or doc
    # sometimes it's ".pdf" or "PDF". We're going to cleanup a bit
    # of the inconsistency and at least make these all lower case
    # and remove the dot. This will result in very slightly different
    # filenames, but "example.pdf" is better than "example..PDF"

    # Lowercase, remove any surrounding white space, and remove a leading '.'
    extension = source_instruction.extension.lower().strip().removeprefix(".")

    return f"{competition.legacy_package_id}.{extension}"


def transform_competition_instruction(
    source_instruction: Tinstructions,
    existing_instruction: CompetitionInstruction | None,
    competition: Competition,
    s3_config: S3Config,
) -> CompetitionInstruction:
    """Transform the Tinstructions record into a CompetitionInstruction one"""
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
        competition=competition,
        file_location=file_location,
        file_name=file_name,
        legacy_competition_id=source_instruction.comp_id,
    )

    transform_util.transform_update_create_timestamp(
        source_instruction, target_instruction, log_extra=log_extra
    )

    return target_instruction


def write_file(
    source_instruction: Tinstructions, destination_instruction: CompetitionInstruction
) -> None:

    if source_instruction.instructions is None:
        raise ValueError("Competition instructions are null, cannot copy")

    with file_util.open_stream(
        destination_instruction.file_location, "wb", content_type=source_instruction.mimetype
    ) as outfile:
        outfile.write(source_instruction.instructions)
