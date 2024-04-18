import os
from pathlib import Path

import boto3
import pytest

from src.db.models.opportunity_models import (
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.task.opportunities.import_opportunity_csvs import process
from src.util import file_util
from tests.conftest import BaseTestClass


@pytest.fixture()
def test_file_path():
    return Path(__file__).parent / "test_files"


def upload_file_to_s3(file_path, s3_bucket, key):
    s3 = boto3.client("s3")
    s3.upload_file(str(file_path), s3_bucket, key)


def setup_s3_files(directory, s3_bucket, s3_path):
    files_to_upload = os.listdir(directory)

    for f in files_to_upload:
        upload_file_to_s3(file_util.join(directory, f), s3_bucket, s3_path + f)


class TestImportOpportunityCsvs(BaseTestClass):
    def test_process(
        self, db_session, test_file_path, test_api_schema, truncate_opportunities, mock_s3_bucket
    ):
        s3_path = "path/to/"
        setup_s3_files(test_file_path, mock_s3_bucket, s3_path)

        # sanity check that we did in fact upload files to (mock) s3
        s3 = boto3.client("s3")
        s3_files = s3.list_objects_v2(Bucket=mock_s3_bucket)
        assert len(s3_files["Contents"]) == 6

        process(db_session, f"s3://{mock_s3_bucket}/" + s3_path, test_api_schema)

        # This is just a very hacky validation that we did in fact load the files to the tables
        assert len(db_session.query(Opportunity).all()) == 2
        assert len(db_session.query(OpportunityAssistanceListing).all()) == 4
        assert len(db_session.query(OpportunitySummary).all()) == 3
        assert len(db_session.query(LinkOpportunitySummaryFundingInstrument).all()) == 4
        assert len(db_session.query(LinkOpportunitySummaryFundingCategory).all()) == 5
        assert len(db_session.query(LinkOpportunitySummaryApplicantType).all()) == 7
