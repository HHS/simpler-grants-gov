"""Tests the code in extracts/load_opportunity_data."""

import os
import pathlib

import pytest
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.load_opportunity_data import (
    extract_copy_opportunity_data,
)
from analytics.integrations.extracts.s3_config import S3Config
from sqlalchemy import text

test_folder_path = (
    pathlib.Path(__file__).parent.resolve() / "opportunity_tables_test_files"
)


### Uploads test files
@pytest.fixture
def upload_opportunity_tables_s3(mock_s3):

    s3_config = S3Config()
    s3_bucket = s3_config.s3_opportunity_bucket

    s3_resource = mock_s3

    # Create the S3 bucket for local-opportunity
    s3_resource.create_bucket(Bucket=s3_bucket)
    bucket = s3_resource.Bucket(s3_bucket)

    for root, _, files in os.walk(test_folder_path):
        root_path = pathlib.Path(root)
        for file in files:
            file_path = root_path / file
            object_key = (
                f"{os.getenv("S3_OPPORTUNITY_FILE_PATH_PREFIX")}"
                f"/{os.path.relpath(file_path, test_folder_path)}"
            )
            with open(file_path, "rb") as data:
                bucket.upload_fileobj(data, object_key)

    s3_files = list(bucket.objects.all())
    yield len(s3_files)


def test_extract_copy_opportunity_data(
    create_test_db: EtlDb,
    upload_opportunity_tables_s3,
):
    """Should upload all test files to mock s3 and have all records inserted into test database schema."""

    extract_copy_opportunity_data(etldb_conn=create_test_db, schema="test_schema")
    conn = create_test_db.connection()

    # Verify that the data was inserted into the database
    with conn.begin():

        result = conn.execute(
            text("SELECT opportunity_id FROM test_schema.opportunity ;"),
        )
        rows = result.fetchall()


        assert upload_opportunity_tables_s3 == 5
        assert len(rows) == 37
