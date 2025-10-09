import itertools
import logging
import time
import zipfile
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import StrEnum
from typing import IO, Sequence

from sqlalchemy import select

import src.adapters.db as db
from src.constants.lookup_constants import (
    SamGovExtractType,
    SamGovImportType,
    SamGovProcessingStatus,
)
from src.db.models.entity_models import SamGovEntity, SamGovEntityImportType
from src.db.models.sam_extract_models import SamExtractFile
from src.task.task import Task
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig
from src.util.input_sanitizer import InputValidationError, sanitize_delimited_line, sanitize_string

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
    ueis_skipped: set[str] = field(default_factory=set)

    deactivated_ueis: list[str] = field(default_factory=list)
    expired_ueis: list[str] = field(default_factory=list)


class ProcessSamExtractsConfig(PydanticBaseEnvConfig):
    process_sam_extracts_upsert_batch_size: int = 10000


class ProcessSamExtractsTask(Task):

    def __init__(self, db_session: db.Session):
        super().__init__(db_session)
        self.config = ProcessSamExtractsConfig()

    class Metrics(StrEnum):

        ROWS_PROCESSED_COUNT = "rows_processed_count"
        ROWS_SKIPPED_COUNT = "rows_skipped_count"
        DEACTIVATED_SKIPPED_COUNT = "deactivated_skipped_count"
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

        SKIPPED_UEI_NOT_PROCESSED_COUNT = "skipped_uei_not_processed_count"

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
            start = time.perf_counter()
            self.process_extract(sam_extract_file, extract_log_extra)

            # Record the time that extract took to complete
            end = time.perf_counter()
            duration = round((end - start), 3)
            logger.info(
                "Finished processing sam.gov extract",
                extra=extract_log_extra | {"extract_process_duration_sec": duration},
            )

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

    def process_extract(self, sam_extract_file: SamExtractFile, extract_log_extra: dict) -> None:
        """Process a sam.gov FOUO entity extract file, parsing and loading the file to our sam.gov entity table"""
        sam_gov_entity_container = self.parse_extract_file(sam_extract_file, extract_log_extra)

        self.load_sam_gov_entities_to_db(
            sam_gov_entity_container, sam_extract_file, extract_log_extra
        )

        # Process all of the deactivations/expired in one transaction as they're usually fairly small.
        with self.db_session.begin():
            # Handle deactivated sam.gov entity records
            existing_deactivated_entities = self.get_existing_entities(
                sam_gov_entity_container.deactivated_ueis
            )
            for uei in sam_gov_entity_container.deactivated_ueis:
                self.handle_deactivated_entity(
                    uei, existing_deactivated_entities, sam_extract_file, extract_log_extra
                )

            # Handle expired sam.gov entity records
            existing_expired_entities = self.get_existing_entities(
                sam_gov_entity_container.expired_ueis
            )
            for uei in sam_gov_entity_container.expired_ueis:
                self.handle_expired_entity(
                    uei, existing_expired_entities, sam_extract_file, extract_log_extra
                )

            # Verify that the records we skipped due to non-empty EFT indicator all got processed
            # in one of the above sections.
            self.verify_skipped_entities_have_processed_row(
                sam_gov_entity_container, extract_log_extra
            )

            logger.info(
                "Finished loading records to DB for Sam.gov extract", extra=extract_log_extra
            )

            # Mark extract as processed
            # Have to add to the session as it was fetched in a different transaction
            self.db_session.add(sam_extract_file)
            sam_extract_file.processing_status = SamGovProcessingStatus.COMPLETED

    def parse_extract_file(
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

                with extract_zip.open(files_in_zip[0]) as dat_file:
                    return self.process_dat(dat_file, extract_log_extra)

    def process_dat(self, dat_file: IO[bytes], extract_log_extra: dict) -> SamGovEntityContainer:
        """Process the dat file from the sam.gov extract"""
        container = SamGovEntityContainer()

        for raw_line in dat_file:
            try:
                # Safely decode the line with error handling
                line = raw_line.decode("utf-8", errors="replace").strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Validate line length to prevent memory issues
                if len(line) > 100000:  # Reasonable limit for SAM.gov lines
                    logger.warning("Skipping extremely long line", extra=extract_log_extra)
                    self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                    continue
                
                # Sanitize the line for basic security
                line = sanitize_string(line, max_length=100000, allow_html=False)
                
            except UnicodeDecodeError:
                logger.warning("Failed to decode line, skipping", extra=extract_log_extra)
                self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                continue
            except InputValidationError as e:
                logger.warning(f"Line validation failed: {e}", extra=extract_log_extra)
                self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                continue
            
            # The header and footer are formatted as
            # BOF/EOF FOUO V2 STARTDATE ENDDATE RECORD_COUNT SEQUENCE_NUMBER
            # For example:
            # BOF FOUO V2 20250726 20250726 0001234 0001000
            #
            # The start date seems to always match the end date for daily extracts
            # For monthly extracts the start date is all zeroes
            #
            # Sequence number just increments by 1 every day
            if line.startswith("BOF") or line.startswith("EOF"):
                try:
                    tokens = line.split()
                    if len(tokens) != 7:
                        logger.warning("Unexpected format for header/footer", extra=extract_log_extra)
                        continue
                    sequence_num, record_count = tokens[-1], tokens[-2]
                    
                    # Validate that sequence_num and record_count are numeric
                    if not sequence_num.isdigit() or not record_count.isdigit():
                        logger.warning("Invalid sequence number or record count in header/footer", extra=extract_log_extra)
                        continue
                        
                    logger.info(
                        "Processing header/footer of dat file",
                        extra=extract_log_extra
                        | {"sequence_number": sequence_num, "record_count": record_count},
                    )
                except Exception as e:
                    logger.warning(f"Error processing header/footer: {e}", extra=extract_log_extra)
                continue

            try:
                # Safely parse the delimited line
                tokens = sanitize_delimited_line(
                    line, 
                    delimiter="|", 
                    expected_fields=None,  # Let the schema handle field count validation
                    max_field_length=10000
                )
            except InputValidationError as e:
                logger.warning(f"Line parsing failed: {e}", extra=extract_log_extra)
                self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                continue
            
            self.increment(self.Metrics.ROWS_PROCESSED_COUNT)

            try:
                uei = get_token_value(tokens, ExtractIndex.UEI)
                eft_indicator = get_token_value(tokens, ExtractIndex.ENTITY_EFT_INDICATOR)
                extract_code = get_token_value(tokens, ExtractIndex.SAM_EXTRACT_CODE)
            except (ValueError, IndexError) as e:
                logger.warning(f"Failed to extract required fields: {e}", extra=extract_log_extra)
                self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                continue
                
            log_extra = {"uei": uei, "extract_code": extract_code} | extract_log_extra

            # We can receive multiple rows for a given UEI in an extract
            # In sam.gov if your UEI has multiple bank accounts associated
            # then each comes through as a separate record, BUT as the FOUO
            # information doesn't have that, they are for our purposes duplicates.
            # These records are separated by the "EFT Indicator" and we will
            # assume that every UEI has one null/empty EFT indicator record that we'll use.
            if len(eft_indicator) > 0:
                # If the extract_code is to deactivate a record, AND has an eft indicator
                # then it's saying to deactivate that particular EFT indicator record on a UEI
                # Since we don't consume any non-empty EFT indicator records, we have nothing
                # to deactivate and shouldn't expect it to be present.
                # If the entire UEI was deactivated, we'd receive the empty EFT indicator record itself
                if extract_code == "1":
                    logger.info(
                        "EFT Indicator is not empty, but record is marked for deactivation, skipping entirely",
                        extra=log_extra,
                    )
                    self.increment(self.Metrics.DEACTIVATED_SKIPPED_COUNT)
                    continue

                logger.info(
                    "EFT Indicator is not empty, skipping assuming to be a duplicate",
                    extra=log_extra,
                )
                container.ueis_skipped.add(uei)
                self.increment(self.Metrics.ROWS_SKIPPED_COUNT)
                continue

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

    def get_existing_entities(self, ueis: list[str]) -> dict[str, SamGovEntity]:
        """Fetch all passed in sam.gov entities by UEI"""
        all_entities = self.db_session.execute(
            select(SamGovEntity).where(SamGovEntity.uei.in_(ueis))
        ).scalars()
        entity_map = {}
        for entity in all_entities:
            entity_map[entity.uei] = entity

        return entity_map

    def load_sam_gov_entities_to_db(
        self,
        sam_gov_entity_container: SamGovEntityContainer,
        sam_extract_file: SamExtractFile,
        extract_log_extra: dict,
    ) -> None:
        """Load sam.gov entities to the DB in batches"""
        total_to_process = len(sam_gov_entity_container.processed_entities)
        total_processed = 0
        for batch in itertools.batched(
            sam_gov_entity_container.processed_entities,
            n=self.config.process_sam_extracts_upsert_batch_size,
            strict=False,
        ):
            # Process each of these batches as a separate DB transaction/commit to save memory
            with self.db_session.begin():
                logger.info(
                    f"Processing a batch, processed {total_processed} / {total_to_process}",
                    extra=extract_log_extra,
                )

                entity_map = self.get_existing_entities([entity.uei for entity in batch])

                # Process updated/new sam.gov entity records
                for sam_gov_entity in batch:
                    self.load_sam_gov_entity_to_db(
                        sam_gov_entity, entity_map, sam_extract_file.extract_type, extract_log_extra
                    )

                total_processed += len(batch)

            # Clear the SQLAlchemy cache between batches
            self.db_session.expunge_all()

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

    def verify_skipped_entities_have_processed_row(
        self, sam_gov_entity_container: SamGovEntityContainer, extract_log_extra: dict
    ) -> None:
        """Verify that any entities skipped for having the EFT indicator set
        had a row that we actually processed

        This is just validating an assumption that we have in the data
        that if an entity receives an update and has multiple EFT indicators,
        we'll always receive all of the different EFT indicators, including an "empty" one.
        """
        logger.info("Validating that skipped UEIs were processed", extra=extract_log_extra)
        ueis_processed = {entity.uei for entity in sam_gov_entity_container.processed_entities}
        ueis_processed.update(sam_gov_entity_container.deactivated_ueis)
        ueis_processed.update(sam_gov_entity_container.expired_ueis)

        unprocessed_ueis = sam_gov_entity_container.ueis_skipped.difference(ueis_processed)
        for unprocessed_uei in unprocessed_ueis:
            logger.error(
                "A UEI we skipped did not have a non-empty EFT indicator in extract file",
                extra=extract_log_extra | {"uei": unprocessed_uei},
            )
            self.increment(self.Metrics.SKIPPED_UEI_NOT_PROCESSED_COUNT)

        if len(unprocessed_ueis) == 0:
            logger.info(
                "All UEIs we skipped were processed via another row", extra=extract_log_extra
            )


def build_sam_gov_entity(tokens: list[str]) -> SamGovEntity:
    uei = get_token_value(tokens, ExtractIndex.UEI, can_be_blank=False)
    legal_business_name = get_token_value(
        tokens, ExtractIndex.LEGAL_BUSINESS_NAME, can_be_blank=False
    )
    registration_expiration_date = get_token_value(
        tokens, ExtractIndex.REGISTRATION_EXPIRATION_DATE, can_be_blank=False
    )
    # NOTE: Email can be null in rare cases
    # We lowercase the email so it can later be joined with our user table
    # to setup organizations. Sam.gov stores emails with whatever case the user entered.
    ebiz_poc_email = get_token_value(tokens, ExtractIndex.EBIZ_POC_EMAIL).lower()
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
    if not isinstance(tokens, list):
        raise ValueError("Tokens must be a list")
    
    if not isinstance(index, int) or index < 1:
        raise ValueError("Index must be a positive integer starting from 1")
    
    actual_index = index - 1

    if actual_index >= len(tokens):
        raise ValueError(f"Line contains fewer values than expected ({len(tokens)}), cannot access index {index}")

    value = tokens[actual_index]
    
    # Validate that value is a string
    if not isinstance(value, str):
        raise ValueError(f"Expected string value at index {index}, got {type(value)}")

    # Check for maximum field length to prevent memory issues
    if len(value) > 10000:  # Reasonable limit for SAM.gov fields
        raise ValueError(f"Field at index {index} exceeds maximum length of 10000 characters")
    
    # Remove null bytes and dangerous control characters
    value = value.replace('\x00', '')
    
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
