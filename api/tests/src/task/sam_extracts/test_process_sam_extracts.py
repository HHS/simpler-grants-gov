import logging
import zipfile
from datetime import date

import pytest
from sqlalchemy import select

import src.util.file_util as file_util
from src.constants.lookup_constants import SamGovExtractType, SamGovProcessingStatus
from src.db.models.entity_models import SamGovEntity
from src.db.models.sam_extract_models import SamExtractFile
from src.task.sam_extracts.process_sam_extracts import (
    ExtractIndex,
    ProcessSamExtractsTask,
    build_sam_gov_entity,
)
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import SamExtractFileFactory, SamGovEntityFactory


def build_sam_extract_row(
    uei: str,
    extract_code: str = "A",
    legal_business_name: str = "Bob's Business",
    registration_expiration_date: str = "20500101",
    ebiz_poc_email: str = "bob@mail.com",
    ebiz_first_name: str = "Bob",
    ebiz_last_name: str = "Smith",
    debt_subject_to_offset: str = "",
    exclusion_status_flag: str = "N",
    entity_eft_indicator: str = "",
    initial_registration_date: str = "20250101",
    last_update_date: str = "20250601",
):
    raw_data = [""] * 300
    raw_data[ExtractIndex.UEI - 1] = uei
    raw_data[ExtractIndex.SAM_EXTRACT_CODE - 1] = extract_code
    raw_data[ExtractIndex.LEGAL_BUSINESS_NAME - 1] = legal_business_name
    raw_data[ExtractIndex.REGISTRATION_EXPIRATION_DATE - 1] = registration_expiration_date
    raw_data[ExtractIndex.EBIZ_POC_EMAIL - 1] = ebiz_poc_email
    raw_data[ExtractIndex.EBIZ_POC_FIRST_NAME - 1] = ebiz_first_name
    raw_data[ExtractIndex.EBIZ_POC_LAST_NAME - 1] = ebiz_last_name
    raw_data[ExtractIndex.DEBT_SUBJECT_TO_OFFSET - 1] = debt_subject_to_offset
    raw_data[ExtractIndex.EXCLUSION_STATUS_FLAG - 1] = exclusion_status_flag
    raw_data[ExtractIndex.ENTITY_EFT_INDICATOR - 1] = entity_eft_indicator
    raw_data[ExtractIndex.INITIAL_REGISTRATION_DATE - 1] = initial_registration_date
    raw_data[ExtractIndex.LAST_UPDATE_DATE - 1] = last_update_date

    # Every row is | separated, with "!end" tacked onto the end
    return "|".join(raw_data) + "!end"


def build_sam_extract_row_deactivated_or_expired(
    uei: str, extract_code: str = "1", eft_indicator: str = ""
):
    return build_sam_extract_row(
        uei=uei,
        extract_code=extract_code,
        entity_eft_indicator=eft_indicator,
        # All of the below won't be set for deactivated/expired rows
        legal_business_name="",
        registration_expiration_date="",
        ebiz_poc_email="",
        ebiz_first_name="",
        ebiz_last_name="",
        debt_subject_to_offset="",
        exclusion_status_flag="",
        initial_registration_date="",
        last_update_date="",
    )


def build_sam_extract_contents(rows):
    contents = []

    header = "BOF FOUO V2 00000000 20200414 0084875 0005510"
    footer = "EOF FOUO V2 00000000 20200414 0084875 0005510"

    contents.append(header)
    contents.extend(rows)
    contents.append(footer)
    return "\n".join(contents)


def make_zip_on_s3(zip_path, file_contents, extra_file_contents=None):
    with file_util.open_stream(zip_path, "wb") as outfile:
        with zipfile.ZipFile(outfile, "w") as extract_zip:
            extract_zip.writestr("SAM_FOUO_V2_DATE.dat", file_contents)

            # For testing error scenarios
            if extra_file_contents is not None:
                extract_zip.writestr("EXTRA_SAM_FOUO_V2_DATE.dat", extra_file_contents)


class TestProcessSamExtracts:

    @pytest.fixture(autouse=True)
    def cleanup_tables(self, db_session):
        cascade_delete_from_db_table(db_session, SamGovEntity)
        cascade_delete_from_db_table(db_session, SamExtractFile)

    def test_run_task_single_file(self, db_session, enable_factory_create, mock_s3_bucket):
        row1 = build_sam_extract_row(
            uei="AAA111",
            extract_code="A",
            legal_business_name="Sara's Sweets",
            registration_expiration_date="20250101",
            ebiz_poc_email="SARA@example.com",  # will be lowercased when processed
            ebiz_first_name="Sara",
            ebiz_last_name="Smith",
            debt_subject_to_offset="Y",
            exclusion_status_flag="D",
            entity_eft_indicator="",
            initial_registration_date="20200101",
            last_update_date="20241225",
        )
        row2 = build_sam_extract_row(
            uei="BBB222",
            extract_code="E",
            legal_business_name="Joe's Juice",
            registration_expiration_date="20230206",
            ebiz_poc_email="joe@example.com",
            ebiz_first_name="Joe",
            ebiz_last_name="Johnson",
            debt_subject_to_offset="N",
            exclusion_status_flag="",
            entity_eft_indicator="",
            initial_registration_date="19990920",
            last_update_date="20230304",
        )
        row3 = build_sam_extract_row(
            uei="CCC333",
            extract_code="2",
            legal_business_name="Fred's Fruit",
            registration_expiration_date="20300201",
            ebiz_poc_email="fred@example.com",
            ebiz_first_name="Fred",
            ebiz_last_name="Jones",
            debt_subject_to_offset="",
            exclusion_status_flag="",
            entity_eft_indicator="",
            initial_registration_date="20200101",
            last_update_date="20210203",
        )
        # this row won't be updated because it's last_update_date is older than our DB
        row4 = build_sam_extract_row(
            uei="DDD444",
            extract_code="3",
            legal_business_name="A Different Name",
            last_update_date="19900101",
        )
        # These next two rows error due to malformed data
        row5 = build_sam_extract_row(uei="EEE555", registration_expiration_date="not-a-date")
        row6 = build_sam_extract_row(uei="FFF666", legal_business_name="")

        # This record is marked as deactivated
        row7 = build_sam_extract_row_deactivated_or_expired(
            uei="GGG777",
            extract_code="1",
        )
        # This record is marked as expired, which will mostly no-op
        row8 = build_sam_extract_row_deactivated_or_expired(
            uei="HHH888",
            extract_code="4",
        )

        row9 = build_sam_extract_row_deactivated_or_expired(
            uei="III999", extract_code="1", eft_indicator="1234"
        )

        rows = [row1, row2, row3, row4, row5, row6, row7, row8, row9]

        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_1234.zip"
        make_zip_on_s3(s3_path, build_sam_extract_contents(rows))

        sam_extract_file = SamExtractFileFactory.create(
            s3_path=s3_path, extract_date=date(2025, 1, 1)
        )
        # Other extract files aren't picked up as they're not pending
        SamExtractFileFactory.create_batch(
            size=3, processing_status=SamGovProcessingStatus.COMPLETED
        )
        SamExtractFileFactory.create_batch(size=2, processing_status=SamGovProcessingStatus.FAILED)

        # Most of the rows above have existing records that may get updated
        # base on the last_update_date being newer in the data we're parsing
        SamGovEntityFactory.create(uei="BBB222", last_update_date=date(2020, 1, 1))
        SamGovEntityFactory.create(uei="CCC333", last_update_date=date(2020, 1, 1))
        SamGovEntityFactory.create(uei="DDD444", last_update_date=date(2020, 1, 1))

        SamGovEntityFactory.create(uei="GGG777", last_update_date=date(2020, 1, 1))
        SamGovEntityFactory.create(
            uei="HHH888", last_update_date=date(2020, 1, 1), expiration_date=date(2023, 1, 1)
        )

        task = ProcessSamExtractsTask(db_session)
        task.run()

        db_extract_file = db_session.execute(
            select(SamExtractFile).where(
                SamExtractFile.sam_extract_file_id == sam_extract_file.sam_extract_file_id
            )
        ).scalar_one_or_none()
        assert db_extract_file.processing_status == SamGovProcessingStatus.COMPLETED

        sam_gov_entities = db_session.execute(select(SamGovEntity)).scalars().all()
        assert len(sam_gov_entities) == 6
        sam_gov_entities.sort(key=lambda e: e.uei)

        entity1 = sam_gov_entities[0]
        assert entity1.uei == "AAA111"
        assert entity1.legal_business_name == "Sara's Sweets"
        assert entity1.expiration_date == date(2025, 1, 1)
        assert entity1.ebiz_poc_email == "sara@example.com"
        assert entity1.ebiz_poc_first_name == "Sara"
        assert entity1.ebiz_poc_last_name == "Smith"
        assert entity1.has_debt_subject_to_offset is True
        assert entity1.has_exclusion_status is True
        assert entity1.eft_indicator is None
        assert entity1.initial_registration_date == date(2020, 1, 1)
        assert entity1.last_update_date == date(2024, 12, 25)
        assert len(entity1.import_records) == 1

        entity2 = sam_gov_entities[1]
        assert entity2.uei == "BBB222"
        assert entity2.legal_business_name == "Joe's Juice"
        assert entity2.expiration_date == date(2023, 2, 6)
        assert entity2.ebiz_poc_email == "joe@example.com"
        assert entity2.ebiz_poc_first_name == "Joe"
        assert entity2.ebiz_poc_last_name == "Johnson"
        assert entity2.has_debt_subject_to_offset is False
        assert entity2.has_exclusion_status is False
        assert entity2.eft_indicator is None
        assert entity2.initial_registration_date == date(1999, 9, 20)
        assert entity2.last_update_date == date(2023, 3, 4)
        assert len(entity2.import_records) == 1

        entity3 = sam_gov_entities[2]
        assert entity3.uei == "CCC333"
        assert entity3.legal_business_name == "Fred's Fruit"
        assert entity3.expiration_date == date(2030, 2, 1)
        assert entity3.ebiz_poc_email == "fred@example.com"
        assert entity3.ebiz_poc_first_name == "Fred"
        assert entity3.ebiz_poc_last_name == "Jones"
        assert entity3.has_debt_subject_to_offset is False
        assert entity3.has_exclusion_status is False
        assert entity3.eft_indicator is None
        assert entity3.initial_registration_date == date(2020, 1, 1)
        assert entity3.last_update_date == date(2021, 2, 3)
        assert len(entity3.import_records) == 1

        # This record was not updated
        entity4 = sam_gov_entities[3]
        assert entity4.uei == "DDD444"
        assert entity4.legal_business_name != "A Different Name"
        assert entity4.last_update_date == date(2020, 1, 1)
        assert len(entity4.import_records) == 0

        # This record was made inactive
        entity5 = sam_gov_entities[4]
        assert entity5.uei == "GGG777"
        assert entity5.is_inactive is True
        assert entity5.inactivated_at is not None
        assert entity5.last_update_date == date(2020, 1, 1)  # This was not updated
        assert len(entity5.import_records) == 1

        entity6 = sam_gov_entities[5]
        assert entity6.uei == "HHH888"
        assert entity6.last_update_date == date(2020, 1, 1)  # This was not updated
        assert len(entity6.import_records) == 0

        metrics = task.metrics
        assert metrics[task.Metrics.ROWS_PROCESSED_COUNT] == 9
        assert metrics[task.Metrics.ROWS_CONVERTED_COUNT] == 4
        assert metrics[task.Metrics.DEACTIVATED_SKIPPED_COUNT] == 1
        assert metrics[task.Metrics.DEACTIVATED_ROWS_COUNT] == 1
        assert metrics[task.Metrics.EXPIRED_ROWS_COUNT] == 1
        assert metrics[task.Metrics.ROWS_SKIPPED_COUNT] == 0
        assert metrics[task.Metrics.ENTITY_ERROR_COUNT] == 2

        assert metrics[task.Metrics.ENTITY_INSERTED_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_UPDATED_COUNT] == 2
        assert metrics[task.Metrics.ENTITY_NO_OP_COUNT] == 1

        assert metrics[task.Metrics.ENTITY_DEACTIVATED_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_DEACTIVATED_MISSING_COUNT] == 0
        assert metrics[task.Metrics.ALREADY_DEACTIVATED_COUNT] == 0

        assert metrics[task.Metrics.ENTITY_EXPIRED_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_EXPIRED_MISSING_COUNT] == 0
        assert metrics[task.Metrics.ENTITY_EXPIRED_MISMATCH_COUNT] == 0

        assert metrics[task.Metrics.SKIPPED_UEI_NOT_PROCESSED_COUNT] == 0

        assert metrics[task.Metrics.EXTRACTS_PROCESSED_COUNT] == 1

    def test_run_task_multiple_files(self, db_session, enable_factory_create, mock_s3_bucket):
        """We process three files in one job - verify that the latest record is kept

        If the last_update_date is the same between files, then the first file processed
        is the one kept (since our logic assumes that updates for any updates).
        """
        # Row1 will be updated on day 1 and 3, only the day 3 stuff will be kept
        row1_day1 = build_sam_extract_row(uei="AAA111", last_update_date="20250101")
        row1_day3 = build_sam_extract_row(
            uei="AAA111",
            last_update_date="20250102",
            ebiz_poc_email="row1@mail.com",
            legal_business_name="Row 1 & Friends",
        )

        # Row2 will be updated on day 2 and 3, but the last update date is the same, so only day 2 is relevant
        row2_day2 = build_sam_extract_row(
            uei="BBB222",
            last_update_date="20250102",
            ebiz_poc_email="row2@mail.com",
            legal_business_name="Row 2 Enterprises",
        )
        row2_day3 = build_sam_extract_row(uei="BBB222", last_update_date="20250102")

        # Row3 gets updated each day with new info and a new last update date, so the last one is kept
        row3_day1 = build_sam_extract_row(uei="CCC333", last_update_date="20250101")
        row3_day2 = build_sam_extract_row(uei="CCC333", last_update_date="20250102")
        row3_day3 = build_sam_extract_row(
            uei="CCC333",
            last_update_date="20250103",
            ebiz_poc_email="row3@mail.com",
            legal_business_name="Row 3 Incorporated",
        )

        s3_path_day1 = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_1.zip"
        make_zip_on_s3(s3_path_day1, build_sam_extract_contents([row1_day1, row3_day1]))
        day1_extract_file = SamExtractFileFactory.create(
            s3_path=s3_path_day1, extract_date=date(2025, 1, 1)
        )

        s3_path_day2 = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_DAILY_2.zip"
        make_zip_on_s3(s3_path_day2, build_sam_extract_contents([row2_day2, row3_day2]))
        day2_extract_file = SamExtractFileFactory.create(
            s3_path=s3_path_day2,
            extract_date=date(2025, 1, 2),
            extract_type=SamGovExtractType.DAILY,
        )

        s3_path_day3 = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_DAILY_3.zip"
        make_zip_on_s3(s3_path_day3, build_sam_extract_contents([row1_day3, row2_day3, row3_day3]))
        day3_extract_file = SamExtractFileFactory.create(
            s3_path=s3_path_day3,
            extract_date=date(2025, 1, 3),
            extract_type=SamGovExtractType.DAILY,
        )

        task = ProcessSamExtractsTask(db_session)
        task.run()

        db_session.expire_all()  # Expire so the queries actually go to the DB

        db_extract_files = (
            db_session.execute(
                select(SamExtractFile).where(
                    SamExtractFile.sam_extract_file_id.in_(
                        [
                            day1_extract_file.sam_extract_file_id,
                            day2_extract_file.sam_extract_file_id,
                            day3_extract_file.sam_extract_file_id,
                        ]
                    )
                )
            )
            .scalars()
            .all()
        )
        for db_extract_file in db_extract_files:
            assert db_extract_file.processing_status == SamGovProcessingStatus.COMPLETED

        sam_gov_entities = db_session.execute(select(SamGovEntity)).scalars().all()
        assert len(sam_gov_entities) == 3
        sam_gov_entities.sort(key=lambda e: e.uei)

        entity1 = sam_gov_entities[0]
        assert entity1.uei == "AAA111"
        assert entity1.legal_business_name == "Row 1 & Friends"
        assert entity1.ebiz_poc_email == "row1@mail.com"
        assert entity1.last_update_date == date(2025, 1, 2)
        assert len(entity1.import_records) == 2

        entity2 = sam_gov_entities[1]
        assert entity2.uei == "BBB222"
        assert entity2.legal_business_name == "Row 2 Enterprises"
        assert entity2.ebiz_poc_email == "row2@mail.com"
        assert entity2.last_update_date == date(2025, 1, 2)
        assert len(entity2.import_records) == 1

        entity3 = sam_gov_entities[2]
        assert entity3.uei == "CCC333"
        assert entity3.legal_business_name == "Row 3 Incorporated"
        assert entity3.ebiz_poc_email == "row3@mail.com"
        assert entity3.last_update_date == date(2025, 1, 3)
        assert len(entity3.import_records) == 3

        metrics = task.metrics
        assert metrics[task.Metrics.ROWS_PROCESSED_COUNT] == 7
        assert metrics[task.Metrics.ROWS_CONVERTED_COUNT] == 7
        assert metrics[task.Metrics.DEACTIVATED_ROWS_COUNT] == 0
        assert metrics[task.Metrics.EXPIRED_ROWS_COUNT] == 0

        assert metrics[task.Metrics.ENTITY_INSERTED_COUNT] == 3
        assert metrics[task.Metrics.ENTITY_UPDATED_COUNT] == 3
        assert metrics[task.Metrics.ENTITY_NO_OP_COUNT] == 1

        assert metrics[task.Metrics.EXTRACTS_PROCESSED_COUNT] == 3

    def test_run_task_skipped_records(
        self, db_session, enable_factory_create, mock_s3_bucket, caplog
    ):
        row1 = build_sam_extract_row(
            uei="AAA111",
            extract_code="A",
            legal_business_name="Sara's Sweets",
            registration_expiration_date="20250101",
            ebiz_poc_email="sara@example.com",
            ebiz_first_name="Sara",
            ebiz_last_name="Smith",
            debt_subject_to_offset="Y",
            exclusion_status_flag="D",
            entity_eft_indicator="",
            initial_registration_date="20200101",
            last_update_date="20241225",
        )
        row1_dupe = build_sam_extract_row(
            uei="AAA111",
            extract_code="A",
            legal_business_name="Sara's Sweets",
            registration_expiration_date="20250101",
            ebiz_poc_email="sara@example.com",
            ebiz_first_name="Sara",
            ebiz_last_name="Smith",
            debt_subject_to_offset="Y",
            exclusion_status_flag="D",
            entity_eft_indicator="0001",  # The only difference from the above
            initial_registration_date="20200101",
            last_update_date="20241225",
        )

        # This should get flagged as an issue because
        # there is ONLY a row with an entity EFT indicator which is not expected
        row2_dupe = build_sam_extract_row(
            uei="BBB222",
            extract_code="A",
            legal_business_name="Steve's Shovels",
            registration_expiration_date="20250101",
            ebiz_poc_email="steve@example.com",
            ebiz_first_name="Steve",
            ebiz_last_name="Shovelman",
            debt_subject_to_offset="Y",
            exclusion_status_flag="D",
            entity_eft_indicator="0001",
            initial_registration_date="20200101",
            last_update_date="20241225",
        )

        rows = [row1, row1_dupe, row2_dupe]

        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_1234.zip"
        make_zip_on_s3(s3_path, build_sam_extract_contents(rows))

        SamExtractFileFactory.create(s3_path=s3_path, extract_date=date(2025, 1, 1))

        task = ProcessSamExtractsTask(db_session)
        task.run()

        sam_gov_entities = db_session.execute(select(SamGovEntity)).scalars().all()
        # Only the first UEI was made, the second was skipped and alerted
        assert len(sam_gov_entities) == 1

        entity1 = sam_gov_entities[0]
        assert entity1.uei == "AAA111"
        assert entity1.legal_business_name == "Sara's Sweets"
        assert entity1.eft_indicator is None

        # For the second record, verify we did flag that there was an issue
        record = next(
            record
            for record in caplog.records
            if record.message
            == "A UEI we skipped did not have a non-empty EFT indicator in extract file"
        )
        assert record.uei == "BBB222"

        metrics = task.metrics
        assert metrics[task.Metrics.ROWS_PROCESSED_COUNT] == 3
        assert metrics[task.Metrics.ROWS_CONVERTED_COUNT] == 1
        assert metrics[task.Metrics.ROWS_SKIPPED_COUNT] == 2

        assert metrics[task.Metrics.SKIPPED_UEI_NOT_PROCESSED_COUNT] == 1

    def test_run_task_deactivated_records(
        self, db_session, enable_factory_create, mock_s3_bucket, caplog
    ):
        """Test run_task with all deactivated records"""
        caplog.set_level(logging.INFO)
        row1_missing_existing = build_sam_extract_row_deactivated_or_expired("DEACTIVATED1", "1")
        row2_already_deactivated = build_sam_extract_row_deactivated_or_expired("DEACTIVATED2", "1")
        row3_currently_activated = build_sam_extract_row_deactivated_or_expired("DEACTIVATED3", "1")
        rows = [row1_missing_existing, row2_already_deactivated, row3_currently_activated]

        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_DAILY_1234.zip"
        make_zip_on_s3(s3_path, build_sam_extract_contents(rows))
        SamExtractFileFactory.create(s3_path=s3_path, extract_date=date(2025, 6, 1))

        SamGovEntityFactory.create(
            uei="DEACTIVATED2", is_inactive=True, inactivated_at=date(2022, 2, 2)
        )
        SamGovEntityFactory.create(uei="DEACTIVATED3")

        task = ProcessSamExtractsTask(db_session)
        task.run()

        sam_gov_entities = db_session.execute(select(SamGovEntity)).scalars().all()
        assert len(sam_gov_entities) == 2
        sam_gov_entities.sort(key=lambda e: e.uei)

        # For the first record, verify we saw it and logged a message
        record = next(
            record
            for record in caplog.records
            if record.message == "Unknown UEI marked as deactivated"
        )
        assert record.uei == "DEACTIVATED1"

        already_deactivated_entity = sam_gov_entities[0]
        assert already_deactivated_entity.uei == "DEACTIVATED2"
        assert already_deactivated_entity.is_inactive is True
        assert already_deactivated_entity.inactivated_at == date(2022, 2, 2)
        assert len(already_deactivated_entity.import_records) == 0

        newly_deactivated_entity = sam_gov_entities[1]
        assert newly_deactivated_entity.uei == "DEACTIVATED3"
        assert newly_deactivated_entity.is_inactive is True
        assert newly_deactivated_entity.inactivated_at == date(2025, 6, 1)
        assert len(newly_deactivated_entity.import_records) == 1

        metrics = task.metrics
        assert metrics[task.Metrics.ROWS_PROCESSED_COUNT] == 3
        assert metrics[task.Metrics.ROWS_CONVERTED_COUNT] == 0
        assert metrics[task.Metrics.DEACTIVATED_ROWS_COUNT] == 3

        assert metrics[task.Metrics.ENTITY_DEACTIVATED_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_DEACTIVATED_MISSING_COUNT] == 1
        assert metrics[task.Metrics.ALREADY_DEACTIVATED_COUNT] == 1

        assert metrics[task.Metrics.EXTRACTS_PROCESSED_COUNT] == 1

    def test_run_task_expired_records(
        self, db_session, enable_factory_create, mock_s3_bucket, caplog
    ):
        """Test run_task with all deactivated records"""
        caplog.set_level(logging.INFO)
        row1_missing_existing = build_sam_extract_row_deactivated_or_expired("EXPIRED1", "4")
        row2_already_expired = build_sam_extract_row_deactivated_or_expired("EXPIRED2", "4")
        row3_currently_expired = build_sam_extract_row_deactivated_or_expired("EXPIRED3", "4")
        rows = [row1_missing_existing, row2_already_expired, row3_currently_expired]

        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_DAILY_12345678.zip"
        make_zip_on_s3(s3_path, build_sam_extract_contents(rows))
        SamExtractFileFactory.create(s3_path=s3_path, extract_date=date(2025, 6, 1))

        SamGovEntityFactory.create(uei="EXPIRED2", expiration_date=date(2026, 1, 1))
        SamGovEntityFactory.create(uei="EXPIRED3", expiration_date=date(2025, 6, 1))

        task = ProcessSamExtractsTask(db_session)
        task.run()

        sam_gov_entities = db_session.execute(select(SamGovEntity)).scalars().all()
        assert len(sam_gov_entities) == 2
        sam_gov_entities.sort(key=lambda e: e.uei)

        # For the first record, verify we saw it and logged a message
        record = next(
            record for record in caplog.records if record.message == "Unknown UEI marked as expired"
        )
        assert record.uei == "EXPIRED1"

        # The second record logged a different message
        record = next(
            record
            for record in caplog.records
            if record.message
            == "Sam.gov entity marked as expired, but our expiration date has not been reached"
        )
        assert record.uei == "EXPIRED2"

        # The third record logged yet another message
        record = next(
            record
            for record in caplog.records
            if record.message == "Sam.gov entity is marked as expired"
        )
        assert record.uei == "EXPIRED3"

        metrics = task.metrics
        assert metrics[task.Metrics.ROWS_PROCESSED_COUNT] == 3
        assert metrics[task.Metrics.ROWS_CONVERTED_COUNT] == 0
        assert metrics[task.Metrics.EXPIRED_ROWS_COUNT] == 3

        assert metrics[task.Metrics.ENTITY_EXPIRED_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_EXPIRED_MISSING_COUNT] == 1
        assert metrics[task.Metrics.ENTITY_EXPIRED_MISMATCH_COUNT] == 1

        assert metrics[task.Metrics.EXTRACTS_PROCESSED_COUNT] == 1

    def test_run_task_not_a_zip(self, db_session, enable_factory_create, mock_s3_bucket):
        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_12345678.zip"
        with file_util.open_stream(s3_path, "w") as f:
            f.write("some sort of file")

        SamExtractFileFactory.create(s3_path=s3_path)

        task = ProcessSamExtractsTask(db_session)
        with pytest.raises(zipfile.BadZipFile, match="File is not a zip file"):
            task.run()

    def test_run_task_zip_with_too_many_files(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_12345678.zip"
        make_zip_on_s3(s3_path, "text", extra_file_contents="more text")

        SamExtractFileFactory.create(s3_path=s3_path)

        task = ProcessSamExtractsTask(db_session)
        with pytest.raises(Exception, match="Expected exactly one file in sam.gov extract zip"):
            task.run()

    def test_run_task_invalid_header(self, db_session, enable_factory_create, mock_s3_bucket):
        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_12345678.zip"
        make_zip_on_s3(s3_path, "BOF bad header")

        SamExtractFileFactory.create(s3_path=s3_path)

        task = ProcessSamExtractsTask(db_session)
        with pytest.raises(Exception, match="Unexpected format for header/footer"):
            task.run()

    def test_run_task_invalid_file_contents_bad_lines(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        s3_path = f"s3://{mock_s3_bucket}/extracts/SAM_FOUO_MONTHLY_12345678.zip"
        make_zip_on_s3(s3_path, "HEADER\nINVALID LINE\nINVALID LINE\nFOOTER")

        SamExtractFileFactory.create(s3_path=s3_path)

        task = ProcessSamExtractsTask(db_session)
        with pytest.raises(Exception, match="Line contains fewer values than expected"):
            task.run()


@pytest.mark.parametrize(
    "params,expected_error_msg",
    [
        # Fields that can't be blank
        ({"legal_business_name": ""}, "Expected field at index 12 to never be blank"),
        ({"registration_expiration_date": ""}, "Expected field at index 9 to never be blank"),
        ({"initial_registration_date": ""}, "Expected field at index 8 to never be blank"),
        ({"last_update_date": ""}, "Expected field at index 10 to never be blank"),
        # Field formatting
        ({"registration_expiration_date": "123"}, "time data '123' does not match format '%Y%m%d'"),
        ({"debt_subject_to_offset": "X"}, "Debt subject to offset has unexpected value: X"),
        (
            {"initial_registration_date": "XYZ123"},
            "time data 'XYZ123' does not match format '%Y%m%d'",
        ),
        (
            {"initial_registration_date": "2025-01-01"},
            "time data '2025-01-01' does not match format '%Y%m%d'",
        ),
    ],
)
def test_build_sam_gov_entity_error_scenarios(params, expected_error_msg):
    raw_row = build_sam_extract_row(uei="my_uei", **params)
    tokens = raw_row.split("|")
    with pytest.raises(ValueError, match=expected_error_msg):
        build_sam_gov_entity(tokens)
