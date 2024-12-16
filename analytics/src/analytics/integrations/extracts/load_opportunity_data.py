# pylint: disable=invalid-name, line-too-long
"""Loads opportunity tables with opportunity data from S3."""

import logging
import os
from contextlib import ExitStack

import smart_open

from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.constants import (
    MAP_TABLES_TO_COLS,
    OpportunityTables,
)
from analytics.integrations.extracts.s3_config import S3Config

logger = logging.getLogger(__name__)


def extract_copy_opportunity_data() -> None:
    """Instantiate Etldb class and pass the etldb.connection()."""
    etldb_conn = EtlDb()
    _fetch_insert_opportunity_data(etldb_conn.connection())

    logger.info("Extract opportunity data completed successfully")


def _fetch_insert_opportunity_data(conn: EtlDb.connection) -> None:
    """Streamlines opportunity tables from S3 and insert into the database."""
    s3_config = S3Config()

    with conn.begin():
        cursor = conn.connection.cursor()
        for table in OpportunityTables:
            logger.info("Copying data for table: %s", table)

            columns = MAP_TABLES_TO_COLS.get(table, [])
            s3_uri = f"s3://{s3_config.s3_opportunity_bucket}/{s3_config.s3_opportunity_file_path_prefix}/{table}.csv"
            query = f"""
                           COPY {f"{os.getenv("DB_SCHEMA")}.{table} ({', '.join(columns)})"}
                           FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                        """

            with ExitStack() as stack:
                file = stack.enter_context(smart_open.open(s3_uri, "r"))
                copy = stack.enter_context(cursor.copy(query))

                while data := file.read():
                    copy.write(data)

            logger.info("Successfully loaded data for table: %S", table)
