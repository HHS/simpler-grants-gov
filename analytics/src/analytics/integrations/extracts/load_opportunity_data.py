import logging
import os
from io import StringIO, BytesIO
from urllib.parse import urlparse

import boto3

from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.constants import (
    MAP_TABLES_TO_COLS,
    OpportunityTables,
)

logger = logging.getLogger(__name__)


def get_s3_bucket(path):
    return urlparse(path).hostname


def _fetch_data(bucket, object_key):
    s3_client = boto3.client("s3")
    response = s3_client.get_object(Bucket=bucket, Key=object_key)
    logger.info("Retrieved data from S3")
    return response["Body"].read()


def _insert_data(conn, table, columns, data):
    cursor = conn.connection.cursor()
    with (BytesIO(data) as f):
        query = f"""
                    COPY {table} ({', '.join(columns)}) 
                    FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                """
        with cursor.copy(query) as copy:
            while data := f.read():
                copy.write(data)

        logger.info(f"Successfully loaded data for table: {table}")

def extract_copy_opportunity_data():
    # get connection to database
    etldb = EtlDb()

    with etldb.connection() as conn, conn.begin():
        for table in OpportunityTables:
            logger.info(f"Copying data for table: {table}")

            key_prefix=os.getenv("S3_OPPORTUNITY_FILE_PATH")
            bucket = os.getenv("S3_OPPORTUNITY_BUCKET")
            object_key = f"{key_prefix}/{table}.csv"
            data = _fetch_data(bucket, object_key)

            _insert_data(
                conn, table, MAP_TABLES_TO_COLS.get(table, []), data
            )

