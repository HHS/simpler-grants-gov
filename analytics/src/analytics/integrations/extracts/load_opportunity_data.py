import logging
from io import BytesIO
from urllib.parse import urlparse

from analytics.integrations.etldb.etldb import etl_db_connection
from analytics.integrations.extracts.constants import (
    MAP_TABLES_TO_COLS,
    OpportunityTables,
)
from analytics.integrations.extracts.s3_config import S3Config, get_s3_client

logger = logging.getLogger(__name__)


def get_s3_bucket(path):  # if not in env ?
    return urlparse(path).hostname


def _fetch_data(table: str) -> bytes:
    s3_config = S3Config()
    s3_client = get_s3_client(s3_config)
    object_key = f"{s3_config.s3_opportunity_file_path_prefix}/{table}.csv"
    response = s3_client.get_object(
        Bucket=s3_config.s3_opportunity_bucket,
        Key=object_key,
    )

    logger.info("Retrieved data from S3")
    return response["Body"].read()


def _insert_data(cursor, schema: str, table: str, columns: list, data: bytes) -> None:
    if schema:
        table = f"{schema}.{table}"
    with BytesIO(data) as f:
        query = f"""
                    COPY {table} ({', '.join(columns)})
                    FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                """
        with cursor.copy(query) as copy:
            while data := f.read():
                copy.write(data)

        logger.info(f"Successfully loaded data for table: {table}")


@etl_db_connection
def extract_copy_opportunity_data(etldb_conn=None, schema=None) -> None:
    """Extracts opportunity tables from S3 and insert into corresponding tables in the database"""
    conn = etldb_conn.connection()
    with conn.begin():
        cursor = conn.connection.cursor()
        for table in OpportunityTables:
            logger.info(f"Copying data for table: {table}")
            data = _fetch_data(table)
            _insert_data(cursor, schema, table, MAP_TABLES_TO_COLS.get(table, []), data)

    logger.info("Extract opportunity data completed successfully")
