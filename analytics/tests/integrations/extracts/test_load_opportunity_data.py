"""Tests the code in extracts/load_opportunity_data."""

# pylint: disable=W0613,W0621

import logging
import os
import pathlib

import boto3
import pytest

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
def delete_opportunity_table_records(create_test_db: EtlDb, test_schema: str) -> None:
    """Delete opportunity table records from all opportunity tables."""
    conn = create_test_db.connection()

    with conn.begin():
        query = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = :schema
        """
        truncate_stmts = []
        table_names = conn.execute(text(query), {"schema": test_schema}).fetchall()
        for table in table_names:
            table_name = table[0]
            truncate_stmts.append(f"TRUNCATE TABLE {test_schema}.{table_name} CASCADE")
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