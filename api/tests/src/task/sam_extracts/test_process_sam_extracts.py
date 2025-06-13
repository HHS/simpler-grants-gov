from src.task.sam_extracts.process_sam_extracts import ProcessSamExtractsTask
from tests.src.db.models.factories import SamExtractFileFactory


def test_thing(db_session, enable_factory_create):
    sam_extract = SamExtractFileFactory.create(s3_path="/Users/michaelchouinard/workspace/data/SAM_FOUO_MONTHLY.zip")
    task = ProcessSamExtractsTask(db_session)

    task.process_extract(sam_extract)