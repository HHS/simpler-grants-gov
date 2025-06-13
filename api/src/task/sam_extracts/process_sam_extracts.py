import zipfile
from datetime import date, datetime
from enum import StrEnum
import logging
from typing import Sequence

from src.constants.lookup_constants import SamGovProcessingStatus
from src.db.models.entity_models import SamGovEntity
from src.db.models.sam_extract_models import SamExtractFile
from src.task.task import Task
from dataclasses import dataclass, field
from sqlalchemy import select

from src.util import file_util

logger = logging.getLogger(__name__)

# Indexes in the sam.gov extracts start counting from 1
# To keep these numbers matching those in the doc, we also
# start counting from 1 for all of these, use the below
# get_token_value method for pulling values out.
UEI_INDEX = 1
SAM_EXTRACT_CODE_INDEX = 6
LEGAL_BUSINESS_NAME_INDEX = 12
REGISTRATION_EXPIRATION_DATE_INDEX = 9
EBIZ_POC_EMAIL_INDEX = 129
EBIZ_POC_FIRST_NAME_INDEX = 114
EBIZ_POC_LAST_NAME_INDEX = 116
DEBT_SUBJECT_TO_OFFSET_INDEX = 265
EXCLUSION_STATUS_FLAG_INDEX = 266
ENTITY_EFT_INDICATOR_INDEX = 3
INITIAL_REGISTRATION_DATE_INDEX = 8
LAST_UPDATE_DATE_INDEX = 10


@dataclass
class SamGovEntityContainer:
    processed_entities: list[SamGovEntity] = field(default_factory=list)

    deleted_ueis: list[str] = field(default_factory=list)
    expired_ueis: list[str] = field(default_factory=list)

class ProcessSamExtractsTask(Task):

    class Metrics(StrEnum):

        ENTITY_ERROR_COUNT = "entity_error_count"


    def run_task(self) -> None:
        with self.db_session.begin():
            # Determine which extracts to process
            extracts_to_process = self.get_extracts_to_process()


            # TODO - do each of these in a separate DB batch?
            for extract_to_process in extracts_to_process:

                # Get the extract file

                # process extract
                sam_gov_entity_container = self.process_extract(extract_to_process)

                # merge updates in
                # TODO

                # Mark extract as processed
                extracts_to_process.processing_status = SamGovProcessingStatus.COMPLETED

    def get_extracts_to_process(self) -> Sequence[SamExtractFile]:
        """Fetch all the sam.gov extract files in ascending order"""
        return self.db_session.execute(select(SamExtractFile).where(SamExtractFile.processing_status == SamGovProcessingStatus.PENDING).order_by(SamExtractFile.extract_date.asc())).scalars().all()


    def process_extract(self, sam_extract_file: SamExtractFile) -> SamGovEntityContainer:
        extract_log_extra = {
            "sam_extract_file_id": sam_extract_file.sam_extract_file_id,
            "s3_path": sam_extract_file.s3_path,
            "extract_date": sam_extract_file.extract_date,
            "extract_type": sam_extract_file.extract_type,
        }

        logger.info("Processing sam.gov extract file", extra=extract_log_extra)

        with file_util.open_stream(sam_extract_file.s3_path, mode="rb") as extract_file:
            with zipfile.ZipFile(extract_file) as extract_zip:
                # TODO - there should be only one .dat file in here
                for info in extract_zip.infolist():
                    file_bytes = extract_zip.read(info.filename)
                    self.process_dat(file_bytes.decode("utf-8"), extract_log_extra)


    def process_dat(self, dat_text: str, extract_log_extra: dict) -> SamGovEntityContainer:
        container = SamGovEntityContainer()

        lines = dat_text.split("\n")
        # TODO - do something with this regarding validation
        header_line = lines[0]
        footer_line = lines[-1]

        # Iterate over everything but the header and footer
        for line in lines[1:-1]:
            tokens = line.split("|")

            uei = get_token_value(tokens, UEI_INDEX)
            extract_code = get_token_value(tokens, SAM_EXTRACT_CODE_INDEX)
            log_extra = {"uei": uei, "extract_code": extract_code} | extract_log_extra

            # TODO - explain this
            if extract_code in ["1", "4"]:
                # TODO - stuff with deletes/expired needs to be different
                logger.info("TODO - special extract code stuff", extra=log_extra)
                continue

            try:
                logger.info("Processing sam.gov entity record", extra=log_extra)
                sam_gov_entity = build_sam_gov_entity(tokens)

                # TODO - make a ticket to skip any expired sam.gov entities
                # in the org link stuff (easier than figuring out logic here)

                container.processed_entities.append(sam_gov_entity)
            except ValueError:
                logger.exception("Failed to convert sam.gov entity record into DB model", extra=log_extra)
                self.increment(self.Metrics.ENTITY_ERROR_COUNT)



        return container

def build_sam_gov_entity(tokens: list[str]) -> SamGovEntity:
    uei = get_token_value(tokens, UEI_INDEX, can_be_blank=False)
    legal_business_name = get_token_value(tokens, LEGAL_BUSINESS_NAME_INDEX, can_be_blank=False)
    registration_expiration_date = get_token_value(tokens, REGISTRATION_EXPIRATION_DATE_INDEX, can_be_blank=False)
    ebiz_poc_email = get_token_value(tokens, EBIZ_POC_EMAIL_INDEX)
    ebiz_first_name = get_token_value(tokens, EBIZ_POC_FIRST_NAME_INDEX)
    ebiz_last_name = get_token_value(tokens, EBIZ_POC_LAST_NAME_INDEX)
    debt_subject_to_offset = get_token_value(tokens, DEBT_SUBJECT_TO_OFFSET_INDEX)
    exclusion_status_flag = get_token_value(tokens, EXCLUSION_STATUS_FLAG_INDEX)
    entity_eft_indicator = get_token_value(tokens, ENTITY_EFT_INDICATOR_INDEX)
    initial_registration_date = get_token_value(tokens, INITIAL_REGISTRATION_DATE_INDEX, can_be_blank=False)
    last_update_date = get_token_value(tokens, LAST_UPDATE_DATE_INDEX, can_be_blank=False)

    # TODO - types here are a bit iffy
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
        eft_indicator=entity_eft_indicator if entity_eft_indicator else None
    )

    return sam_gov_entity


def get_token_value(tokens: list[str], index: int, can_be_blank: bool = True) -> str:
    actual_index = index - 1

    if actual_index > len(tokens):
        raise Exception("TODO")

    value = tokens[actual_index]

    if not can_be_blank and value == "":
        raise Exception("TODO - blank problem")

    return value

def convert_date(date_str: str) -> date | None:
    if date_str == "":
        return None
    return datetime.strptime(date_str, "%Y%m%d").date()

def convert_debt_subject_to_offset(value_str: str) -> bool:
    if value_str == "Y":
        return True
    if value_str == "N":
        return False
    if value_str == "":
        return False # TODO ???

    raise ValueError(f"Convert debt subject to offset has unexpected value: {value_str}")

def convert_exclusion_status_flag(value_str: str) -> bool | None:
    if value_str == "D":
        return True
    # TODO - document
    return False