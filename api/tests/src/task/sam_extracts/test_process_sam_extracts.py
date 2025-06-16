from src.task.sam_extracts.process_sam_extracts import ExtractIndex, ProcessSamExtractsTask
from tests.src.db.models.factories import SamExtractFileFactory


def build_sam_extract_row(
    uei: str,
    legal_business_name: str,
    registration_expiration_date: str,
    ebiz_poc_email: str,
    ebiz_first_name: str = "Bob",
    ebiz_last_name: str = "Smith",
    debt_subject_to_offset: str = "",
    exclusion_status_flag: str = "N",
    entity_eft_indicator: str = "",
    initial_registration_date: str = "20250101",
    last_update_date: str = "20250601",
):
    raw_data = [""] * 300

    raw_data[ExtractIndex.UEI] = uei


def test_thing(db_session, enable_factory_create):
    sam_extract = SamExtractFileFactory.create(
        s3_path="/Users/michaelchouinard/workspace/data/SAM_FOUO_MONTHLY.zip"
    )
    task = ProcessSamExtractsTask(db_session)

    task.run()

    print(task.metrics)
