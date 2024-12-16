import logging
import os
from io import BytesIO
from urllib.parse import urlparse
import smart_open


from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.constants import (
    MAP_TABLES_TO_COLS,
    OpportunityTables,
)
from analytics.integrations.extracts.s3_config import S3Config, get_s3_client

logger = logging.getLogger(__name__)



def extract_copy_opportunity_data() -> None:
    """Instantiate Etldb class and calls _fetch_insert_opportunity_data with database connection object """
    etldb_conn = EtlDb()
    _fetch_insert_opportunity_data(etldb_conn.connection())

    logger.info("Extract opportunity data completed successfully")



def _fetch_insert_opportunity_data(conn: EtlDb.connection ) -> None:
    """Streamlines opportunity tables from S3 and insert into corresponding tables in the database."""
    s3_config = S3Config()

    with conn.begin():
        cursor = conn.connection.cursor()
        for table in OpportunityTables:
            logger.info(f"Copying data for table: {table}")

            columns = MAP_TABLES_TO_COLS.get(table, [])
            s3_uri = f"s3://{s3_config.s3_opportunity_bucket}/{s3_config.s3_opportunity_file_path_prefix}/{table}.csv"
            query = f"""
                           COPY {f"{os.getenv("DB_SCHEMA")}.{table} ({', '.join(columns)})"}
                           FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                        """
            # Open the S3 object for reading
            with smart_open.open(s3_uri, 'r') as file:
                with cursor.copy(query) as copy:
                    while data := file.read():
                        copy.write(data)

            logger.info(f"Successfully loaded data for table: {table}")
