"""Tests the code in extracts/load_opportunity_data."""

# pylint: disable=W0613,W0621
import os
import pathlib

import boto3
import pytest

from sqlalchemy import text  # isort: skip
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.load_opportunity_data import (
    extract_copy_opportunity_data,
)

test_folder_path = (
    pathlib.Path(__file__).parent.resolve() / "opportunity_tables_test_files"
)


@pytest.fixture
def upload_opportunity_tables_s3(
    mock_s3_bucket_resource: boto3.resource("s3").Bucket,
) -> int:
    """Upload test files to mockS3."""
    for root, _, files in os.walk(test_folder_path):
        root_path = pathlib.Path(root)
        for file in files:
            file_path = root_path / file
            object_key = (
                f"public-extracts/{os.path.relpath(file_path, test_folder_path)}"
            )
            with open(file_path, "rb") as data:
                mock_s3_bucket_resource.upload_fileobj(data, object_key)

    s3_files = list(mock_s3_bucket_resource.objects.all())

    return len(s3_files)


def test_extract_copy_opportunity_data(
    create_test_db: EtlDb,
    test_schema: str,
    upload_opportunity_tables_s3: int,
    monkeypatch: pytest.MonkeyPatch,
    monkeypatch_session: pytest.MonkeyPatch,
    mock_s3_bucket: str,
):
    """Test files are uploaded to mocks3 and all records are in test schema."""
    monkeypatch.setenv("DB_SCHEMA", test_schema)
    monkeypatch_session.setenv(
        "API_ANALYTICS_DB_EXTRACTS_PATH",
        f"S3://{mock_s3_bucket}/public-extracts",
    )
    test_db_conn = create_test_db
    extract_copy_opportunity_data()
    conn = test_db_conn.connection()

    # Verify that the data was inserted into the database
    with conn.begin():
        # test all test_files were upload to mocks3 bucket
        assert upload_opportunity_tables_s3 == 8

        # test table records were inserted for each table
        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM lk_opportunity_status ;"),
            ).fetchone()[0]
            == 4
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM lk_opportunity_category ;"),
            ).fetchone()[0]
            == 5
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM opportunity ;"),
            ).fetchone()[0]
            == 146
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM opportunity_summary ;"),
            ).fetchone()[0]
            == 141
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM current_opportunity_summary ;"),
            ).fetchone()[0]
            == 141
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM user_saved_opportunity ;"),
            ).fetchone()[0]
            == 25
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM user_saved_search ;"),
            ).fetchone()[0]
            == 25
        )

        assert (
            conn.execute(
                text("SELECT COUNT(*) FROM user_data ;"),
            ).fetchone()[0]
            == 7
        )

    # running again to verify that it does not break on the next call
    extract_copy_opportunity_data()
