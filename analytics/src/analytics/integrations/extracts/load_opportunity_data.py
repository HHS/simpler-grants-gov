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
from analytics.integrations.extracts.s3_config import get_s3_client, S3Config

logger = logging.getLogger(__name__)


def get_s3_bucket(path): #if not in env ?
    return urlparse(path).hostname


def _fetch_data(table):
    s3_config = S3Config()
    s3_client = get_s3_client(s3_config)
    object_key = f"{s3_config.s3_opportunity_file_path_prefix}/{table}.csv"
    response = s3_client.get_object(Bucket=s3_config.s3_opportunity_bucket, Key=object_key)
    
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

            data = _fetch_data(table)

            _insert_data(
                conn, table, MAP_TABLES_TO_COLS.get(table, []), data
            )

    logger.info(f"Extract opportunity data completed successfully")

