import logging
import zipfile
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import StrEnum
from typing import Sequence

from sqlalchemy import select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.constants.lookup_constants import (
    SamGovExtractType,
    SamGovImportType,
    SamGovProcessingStatus,
)
from src.db.models.entity_models import SamGovEntity, SamGovEntityImportType
from src.db.models.sam_extract_models import SamExtractFile
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import file_util

logger = logging.getLogger(__name__)


# Indexes in the sam.gov extracts start counting from 1
# To keep these numbers matching those in the doc, we also
# start counting from 1 for all of these, use the below
# get_token_value method for pulling values out.
class ExtractIndex:
    UEI = 1
    SAM_EXTRACT_CODE = 6
    LEGAL_BUSINESS_NAME = 12
    REGISTRATION_EXPIRATION_DATE = 9
    EBIZ_POC_EMAIL = 129
    EBIZ_POC_FIRST_NAME = 114
    EBIZ_POC_LAST_NAME = 116
    DEBT_SUBJECT_TO_OFFSET = 265
    EXCLUSION_STATUS_FLAG = 266
    ENTITY_EFT_INDICATOR = 3
    INITIAL_REGISTRATION_DATE = 8
    LAST_UPDATE_DATE = 10


@dataclass
class SamGovEntityContainer:
    processed_entities: list[SamGovEntity] = field(default_factory=list)

    deactivated_ueis: list[str] = field(default_factory=list)
    expired_ueis: list[str] = field(default_factory=list)


class ProcessSamExtractsTask(Task):

    class Metrics(StrEnum):

        ROWS_PROCESSED_COUNT = "rows_processed_count"
        DEACTIVATED_ROWS_COUNT = "deactivated_rows_count"
        EXPIRED_ROWS_COUNT = "expired_rows_count"
        ROWS_CONVERTED_COUNT = "rows_converted_count"
        ENTITY_ERROR_COUNT = "entity_error_count"

        ENTITY_INSERTED_COUNT = "entity_inserted_count"
        ENTITY_UPDATED_COUNT = "entity_updated_count"
        ENTITY_NO_OP_COUNT = "entity_no_op_count"

        ENTITY_DEACTIVATED_COUNT = "entity_deactivated_count"
        ENTITY_DEACTIVATED_MISSING_COUNT = "entity_deactivated_missing_count"
        ALREADY_DEACTIVATED_COUNT = "already_deactivated_count"

        ENTITY_EXPIRED_COUNT = "entity_expired_count"
        ENTITY_EXPIRED_MISSING_COUNT = "entity_expired_missing_count"
        ENTITY_EXPIRED_MISMATCH_COUNT = "entity_expired_mismatch_count"

        EXTRACTS_PROCESSED_COUNT = "extracts_processed_count"
        MONTHLY_EXTRACT_PROCESSED_COUNT = "monthly_extract_processed_count"
        DAILY_EXTRACT_PROCESSED_COUNT = "daily_extract_processed_count"

    def run_task(self) -> None:
        with self.db_session.begin():
            # Determine which extracts to process
            extracts_to_process = self.get_extracts_to_process()

        # For each extract, process them in a separate DB transaction
        # that way if we're processing multiple files, and one fails,
        # any that succeeded before it will still have been committed.
        # On most days, we'll only be processing at most one file, but
        # useful if we're ever backfilling.
        for sam_extract_file in extracts_to_process:
            extract_log_extra = {
                "sam_extract_file_id": sam_extract_file.sam_extract_file_id,
                "s3_path": sam_extract_file.s3_path,
                "extract_date": sam_extract_file.extract_date,
                "extract_type": sam_extract_file.extract_type,
            }
            with self.db_session.begin():
                # process the extract
                sam_gov_entity_container = self.process_extract(sam_extract_file, extract_log_extra)

                # Fetch all existing sam.gov records, this is several magnitudes
                # faster than individually fetching them as we process them below.
                all_entities = self.db_session.execute(select(SamGovEntity)).scalars()
                entity_map = {}
                for entity in all_entities:
                    entity_map[entity.uei] = entity

                # Process updated/new sam.gov entity records
                for sam_gov_entity in sam_gov_entity_container.processed_entities:
                    self.load_sam_gov_entity_to_db(
                        sam_gov_entity, entity_map, sam_extract_file.extract_type, extract_log_extra
                    )

                # Handle deactivated sam.gov entity records
                for uei in sam_gov_entity_container.deactivated_ueis:
                    self.handle_deactivated_entity(
                        uei, entity_map, sam_extract_file, extract_log_extra
                    )

                # Handle expired sam.gov entity records
                for uei in sam_gov_entity_container.expired_ueis:
                    self.handle_expired_entity(uei, entity_map, sam_extract_file, extract_log_extra)

                logger.info(
                    "Finished loading records to DB for Sam.gov extract", extra=extract_log_extra
                )

                # Mark extract as processed
                sam_extract_file.processing_status = SamGovProcessingStatus.COMPLETED

    def get_extracts_to_process(self) -> Sequence[SamExtractFile]:
        """Fetch all the sam.gov extract files in ascending order"""
        return (
            self.db_session.execute(
                select(SamExtractFile)
                .where(SamExtractFile.processing_status == SamGovProcessingStatus.PENDING)
                .order_by(SamExtractFile.extract_date.asc())
            )
            .scalars()
            .all()
        )

    def process_extract(
        self, sam_extract_file: SamExtractFile, extract_log_extra: dict
    ) -> SamGovEntityContainer:
        """Process an extract file from sam.gov, pulling all entities out of it"""

        logger.info("Processing sam.gov extract file", extra=extract_log_extra)
        self.increment(self.Metrics.EXTRACTS_PROCESSED_COUNT)
        if sam_extract_file.extract_type == SamGovExtractType.MONTHLY:
            self.increment(self.Metrics.MONTHLY_EXTRACT_PROCESSED_COUNT)
        else:
            self.increment(self.Metrics.DAILY_EXTRACT_PROCESSED_COUNT)

        with file_util.open_stream(sam_extract_file.s3_path, mode="rb") as extract_file:
            with zipfile.ZipFile(extract_file) as extract_zip:

                files_in_zip = extract_zip.namelist()
                if len(files_in_zip) != 1:
                    raise Exception(
                        f"Expected exactly one file in sam.gov extract zip, found: {','.join(files_in_zip)}"
                    )

                file_bytes = extract_zip.read(files_in_zip[0])
                return self.process_dat(file_bytes.decode("utf-8"), extract_log_extra)

    def process_dat(self, dat_text: str, extract_log_extra: dict) -> SamGovEntityContainer:
        """Process the text of the dat file from the sam.gov extract"""
        container = SamGovEntityContainer()
        lines = dat_text.split("\n")

        # We need at least two lines (header/footer) for the file to be valid
        if len(lines) < 2:
            raise Exception("Invalid DAT file, doesn't contain any records")

        # The first and last line of the file are a header + footer
        # with some counts - so skip those and parse the others.
        for line in lines[1:-1]:
            self.increment(self.Metrics.ROWS_PROCESSED_COUNT)
            tokens = line.split("|")

            uei = get_token_value(tokens, ExtractIndex.UEI)
            extract_code = get_token_value(tokens, ExtractIndex.SAM_EXTRACT_CODE)
            log_extra = {"uei": uei, "extract_code": extract_code} | extract_log_extra

            """
            The SAM Extract code can have a few different values depending on whether
            we're parsing the monthly or daily extract file. Copying directly from the
            SAM extract mapping document, the possible values are below. Effectively,
            as long as it's not a daily extract with a 1 or a 4, we want to pull in
            the record. If it is deleted or deactivated, we'll process those differently
            as the values won't all be set.

            Monthly File:
            A - Active - Send the Complete Record.
            E - Expired - Send the Complete Record.

            Daily File:
            1 - Deleted/Deactivated Record - Send UEI(SAM), EFT INDICATOR, CAGE Code, DODAAC, SAM Extract Code, Purpose of Registration
            2 - New Active Record - Send the Complete Record.
            3 - Updated Active Record - Send the Complete Record.
            4 - Expired Record - Send UEI(SAM), EFT INDICATOR, CAGE Code, DODAAC, SAM Extract Code, Purpose of Registration
            """
            if extract_code == "1":
                logger.info(
                    "Record marked as deactivated - skipping parsing of row", extra=log_extra
                )
                self.increment(self.Metrics.DEACTIVATED_ROWS_COUNT)
                container.deactivated_ueis.append(uei)
                continue
            if extract_code == "4":
                logger.info("Record marked as expired - skipping parsing of row", extra=log_extra)
                self.increment(self.Metrics.EXPIRED_ROWS_COUNT)
                container.expired_ueis.append(uei)
                continue

            try:
                logger.info("Processing sam.gov entity record", extra=log_extra)
                sam_gov_entity = build_sam_gov_entity(tokens)
                self.increment(self.Metrics.ROWS_CONVERTED_COUNT)
                container.processed_entities.append(sam_gov_entity)
            except ValueError:
                logger.exception(
                    "Failed to convert sam.gov entity record into DB model", extra=log_extra
                )
                self.increment(self.Metrics.ENTITY_ERROR_COUNT)

        return container

    def load_sam_gov_entity_to_db(
        self,
        sam_gov_entity: SamGovEntity,
        entity_map: dict[str, SamGovEntity],
        extract_file_type: SamGovExtractType,
        extract_log_extra: dict,
    ) -> None:
        """Load the sam.gov entity record to the DB"""
        existing_sam_gov_entity = entity_map.get(sam_gov_entity.uei, None)

        log_extra = {
            "uei": sam_gov_entity.uei,
            "last_update_date": sam_gov_entity.last_update_date,
            "last_update_date_in_existing_record": (
                existing_sam_gov_entity.last_update_date if existing_sam_gov_entity else None
            ),
        } | extract_log_extra

        import_type = (
            SamGovImportType.MONTHLY_EXTRACT
            if extract_file_type == SamGovExtractType.MONTHLY
            else SamGovImportType.DAILY_EXTRACT
        )

        # If the sam.gov entity is new, just add it
        # If it's not new, we'll only update it if
        # actual has a more recent last_update_date
        # just in case we ever accidentally process files out of order.
        if existing_sam_gov_entity is None:
            logger.info("Inserting sam.gov entity to DB", extra=log_extra)
            self.increment(self.Metrics.ENTITY_INSERTED_COUNT)
            self.db_session.add(sam_gov_entity)

            import_log_record = SamGovEntityImportType(
                sam_gov_entity=sam_gov_entity, sam_gov_import_type=import_type
            )
            self.db_session.add(import_log_record)

        elif sam_gov_entity.last_update_date > existing_sam_gov_entity.last_update_date:
            logger.info("Updating sam.gov entity in DB", extra=log_extra)
            self.increment(self.Metrics.ENTITY_UPDATED_COUNT)

            # no_autoflush prevents SQLAlchemy from flushing for each of the DB operations
            # here when we already have anything relevant loaded. This massively improves
            # performance (about 1/10th the processing time).
            with self.db_session.no_autoflush:
                sam_gov_entity.sam_gov_entity_id = existing_sam_gov_entity.sam_gov_entity_id
                self.db_session.merge(sam_gov_entity)

                import_log_record = SamGovEntityImportType(
                    sam_gov_entity_id=sam_gov_entity.sam_gov_entity_id,
                    sam_gov_import_type=import_type,
                )
                self.db_session.add(import_log_record)
        else:
            # If there is no update - also don't create an import log record
            logger.info("No update necessary for sam.gov entity", extra=log_extra)
            self.increment(self.Metrics.ENTITY_NO_OP_COUNT)

    def handle_deactivated_entity(
        self,
        uei: str,
        entity_map: dict[str, SamGovEntity],
        sam_extract_file: SamExtractFile,
        extract_log_extra: dict,
    ) -> None:
        """Handle marking deleted/deactivated records in the DB"""
        existing_sam_gov_entity = entity_map.get(uei, None)

        log_extra = {"uei": uei} | extract_log_extra

        # If we don't have the entity, do nothing. In theory
        # this could happen if a record was created and deleted
        # in the same day, so don't think it's a major issue?
        if not existing_sam_gov_entity:
            self.increment(self.Metrics.ENTITY_DEACTIVATED_MISSING_COUNT)
            logger.info("Unknown UEI marked as deactivated", extra=log_extra)
            return

        # If it's already marked inactive, do nothing
        if existing_sam_gov_entity.is_inactive:
            self.increment(self.Metrics.ALREADY_DEACTIVATED_COUNT)
            logger.info("UEI is already deactivated", extra=log_extra)
            return

        # Otherwise we need to mark the entity as inactive
        self.increment(self.Metrics.ENTITY_DEACTIVATED_COUNT)
        logger.info("Deactivating sam.gov entity record", extra=log_extra)
        existing_sam_gov_entity.is_inactive = True
        existing_sam_gov_entity.inactivated_at = sam_extract_file.extract_date

        import_type = (
            SamGovImportType.MONTHLY_EXTRACT
            if sam_extract_file.extract_type == SamGovExtractType.MONTHLY
            else SamGovImportType.DAILY_EXTRACT
        )

        import_log_record = SamGovEntityImportType(
            sam_gov_entity=existing_sam_gov_entity,
            sam_gov_import_type=import_type,
        )
        self.db_session.add(import_log_record)

    def handle_expired_entity(
        self,
        uei: str,
        entity_map: dict[str, SamGovEntity],
        sam_extract_file: SamExtractFile,
        extract_log_extra: dict,
    ) -> None:
        """Handle expired entities

        At this time we do nothing beyond logging
        as our assumption is that we would have reached the
        expiration date by the time this happens.
        """
        existing_sam_gov_entity = entity_map.get(uei, None)

        log_extra = {"uei": uei} | extract_log_extra

        if not existing_sam_gov_entity:
            self.increment(self.Metrics.ENTITY_EXPIRED_MISSING_COUNT)
            logger.info("Unknown UEI marked as expired", extra=log_extra)
            return

        # We aren't sure if this is possible, but if an entity is marked as expired
        # it should have already reached the date from the extract, if not log a warning
        # as it probably means our assumption here is wrong.
        if existing_sam_gov_entity.expiration_date > sam_extract_file.extract_date:
            self.increment(self.Metrics.ENTITY_EXPIRED_MISMATCH_COUNT)
            logger.warning(
                "Sam.gov entity marked as expired, but our expiration date has not been reached",
                extra=log_extra | {"expiration_date": existing_sam_gov_entity.expiration_date},
            )
            return

        # If it's just expired, we'll note it, but do nothing for now
        self.increment(self.Metrics.ENTITY_EXPIRED_COUNT)
        logger.info("Sam.gov entity is marked as expired", extra=log_extra)


def build_sam_gov_entity(tokens: list[str]) -> SamGovEntity:
    uei = get_token_value(tokens, ExtractIndex.UEI, can_be_blank=False)
    legal_business_name = get_token_value(
        tokens, ExtractIndex.LEGAL_BUSINESS_NAME, can_be_blank=False
    )
    registration_expiration_date = get_token_value(
        tokens, ExtractIndex.REGISTRATION_EXPIRATION_DATE, can_be_blank=False
    )
    # NOTE: Email can be null in rare cases
    ebiz_poc_email = get_token_value(tokens, ExtractIndex.EBIZ_POC_EMAIL)
    ebiz_first_name = get_token_value(tokens, ExtractIndex.EBIZ_POC_FIRST_NAME)
    ebiz_last_name = get_token_value(tokens, ExtractIndex.EBIZ_POC_LAST_NAME)
    debt_subject_to_offset = get_token_value(tokens, ExtractIndex.DEBT_SUBJECT_TO_OFFSET)
    exclusion_status_flag = get_token_value(tokens, ExtractIndex.EXCLUSION_STATUS_FLAG)
    entity_eft_indicator = get_token_value(tokens, ExtractIndex.ENTITY_EFT_INDICATOR)
    initial_registration_date = get_token_value(
        tokens, ExtractIndex.INITIAL_REGISTRATION_DATE, can_be_blank=False
    )
    last_update_date = get_token_value(tokens, ExtractIndex.LAST_UPDATE_DATE, can_be_blank=False)

    sam_gov_entity = SamGovEntity(
        uei=uei,
        legal_business_name=legal_business_name,
        expiration_date=convert_date(registration_expiration_date),
        initial_registration_date=convert_date(initial_registration_date),
        last_update_date=convert_date(last_update_date),
        ebiz_poc_email=ebiz_poc_email,
        ebiz_poc_first_name=ebiz_first_name,
        ebiz_poc_last_name=ebiz_last_name,
        has_debt_subject_to_offset=convert_debt_subject_to_offset(debt_subject_to_offset),
        has_exclusion_status=convert_exclusion_status_flag(exclusion_status_flag),
        eft_indicator=entity_eft_indicator if entity_eft_indicator else None,
        # Not sure if it's possible, but if something is inactive in our system
        # we want to set it back to active when we merge this record in.
        is_inactive=False,
        inactivated_at=None,
    )

    return sam_gov_entity


def get_token_value(tokens: list[str], index: int, can_be_blank: bool = True) -> str:
    """Fetch a value from a list of sam.gov entity tokens

    Indexes passed in are decreased by 1 as sam.gov's docs
    start counting from 1.
    """
    actual_index = index - 1

    if actual_index > len(tokens):
        raise Exception(f"Line contains fewer values than expected ({len(tokens)}), cannot process")

    value = tokens[actual_index]

    if not can_be_blank and value == "":
        raise ValueError(f"Expected field at index {index} to never be blank, and it was")

    return value


def convert_date(date_str: str) -> date:
    """Convert a date string to a date object from format YYYYMMDD"""
    # Note if the text passed in isn't the right format, it will raise a ValueError
    return datetime.strptime(date_str, "%Y%m%d").date()


def convert_debt_subject_to_offset(value_str: str) -> bool:
    """Convert whether the entity has debt subject to offset, details copied from data dictionary

    This flag set to Yes (Y) indicates that the registrant has been determined to have
    a delinquent obligation owed to the U.S. Federal Government as shown by records at the Department of the Treasury.
    No (N) means the Treasury Department found no delinquent obligation.
    A non-entry [-] indicates that the registrant has not yet been verified with the treasury.
    """
    if value_str == "Y":
        return True
    if value_str == "N":
        return False
    if value_str == "":
        return False

    raise ValueError(f"Debt subject to offset has unexpected value: {value_str}")


def convert_exclusion_status_flag(value_str: str) -> bool:
    """Convert the entity exclusion status flag, details copied from extract mapping doc:

    This flag indicates whether the entity has an active exclusion record.
    If this flag is set to “D”, this will indicate that the registrant has an exclusion record.
    A null value indicates that this entity does not have an active exclusion record.
    """
    if value_str == "D":
        return True

    return False


@task_blueprint.cli.command("process-sam-extracts", help="Process sam.gov extracts")
@ecs_background_task("process-sam-extracts")
@flask_db.with_db_session()
def run_process_sam_extracts_task(db_session: db.Session) -> None:
    # Initialize and run the task
    ProcessSamExtractsTask(db_session).run()
