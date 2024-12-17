"""Tests the code in extracts/load_opportunity_data."""

# pylint: disable=W0613,W0621

import os
import pathlib

import boto3
import pytest
import logging

from sqlalchemy import text  # isort: skip
from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.load_opportunity_data import (
    extract_copy_opportunity_data,
)

logger = logging.getLogger(__name__)

test_folder_path = (
    pathlib.Path(__file__).parent.resolve() / "opportunity_tables_test_files"
)

@pytest.fixture(autouse=True)
def delete_opportunity_table_records(create_test_db, test_schema) -> None:
    """Delete opportunity table records from all opportunity tables."""
    conn = create_test_db.connection()

    with conn.begin():
        query = f"""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '{test_schema}'
        """
        truncate_stmts=[]
        table_names = conn.execute(text(query)).fetchall()
        for table in table_names:
            table_name = table[0]
            truncate_stmts.append(
            f"TRUNCATE TABLE {test_schema}.{table_name} CASCADE"
            )
        for stmt in truncate_stmts:
            conn.execute(text(stmt))

    logger.info("Truncated all records from all tables")

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
    mock_s3_bucket: str
):
    """Test files are uploaded to mocks3 and all records are in test schema."""
    monkeypatch.setenv("DB_SCHEMA", test_schema)
    monkeypatch_session.setenv(
        "LOAD_OPPORTUNITY_DATA_FILE_PATH",
        f"S3://{mock_s3_bucket}/public-extracts",
    )
    test_db_conn = create_test_db
    extract_copy_opportunity_data()
    conn = test_db_conn.connection()

    # Verify that the data was inserted into the database
    with conn.begin():
        lk_opp_sts_result = conn.execute(
            text("SELECT COUNT(*) FROM lk_opportunity_status ;"),
        )
        lk_opp_ctgry_result = conn.execute(
            text("SELECT COUNT(*) FROM lk_opportunity_category ;"),
        )
        opp_result = conn.execute(
            text("SELECT COUNT(*) FROM opportunity ;"),
        )
        opp_smry_result = conn.execute(
            text("SELECT COUNT(*) FROM opportunity_summary ;"),
        )

        curr_opp_smry_result = conn.execute(
            text("SELECT COUNT(*) FROM current_opportunity_summary ;"),
        )

        # test all test_files were upload to mocks3 bucket
        assert upload_opportunity_tables_s3 == 5

        # test table records were inserted for each table
        assert lk_opp_sts_result.fetchone()[0] == 4
        assert lk_opp_ctgry_result.fetchone()[0] == 5
        assert opp_result.fetchone()[0] == 37
        assert opp_smry_result.fetchone()[0] == 32
        assert curr_opp_smry_result.fetchone()[0] == 32


def test_extract_copy_opportunity_data_2(
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
        "LOAD_OPPORTUNITY_DATA_FILE_PATH",
        f"S3://{mock_s3_bucket}/public-extracts",
    )

    extract_copy_opportunity_data()
    conn = create_test_db.connection()

    # Verify that the data was inserted into the database
    with conn.begin():
        lk_opp_sts_result = conn.execute(
            text("SELECT COUNT(*) FROM lk_opportunity_status ;"),
        )
        lk_opp_ctgry_result = conn.execute(
            text("SELECT COUNT(*) FROM lk_opportunity_category ;"),
        )
        opp_result = conn.execute(
            text("SELECT COUNT(*) FROM opportunity ;"),
        )
        opp_smry_result = conn.execute(
            text("SELECT COUNT(*) FROM opportunity_summary ;"),
        )

        curr_opp_smry_result = conn.execute(
            text("SELECT COUNT(*) FROM current_opportunity_summary ;"),
        )

        # test all test_files were upload to mocks3 bucket
        assert upload_opportunity_tables_s3 == 5

        # test table records were inserted for each table
        assert lk_opp_sts_result.fetchone()[0] == 4
        assert lk_opp_ctgry_result.fetchone()[0] == 5
        assert opp_result.fetchone()[0] == 37
        assert opp_smry_result.fetchone()[0] == 32
        assert curr_opp_smry_result.fetchone()[0] == 32
