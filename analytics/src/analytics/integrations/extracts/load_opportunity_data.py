# pylint: disable=invalid-name, line-too-long
"""Loads opportunity tables with opportunity data from S3."""

import logging
import os
from contextlib import ExitStack

import smart_open  # type: ignore[import]
from pydantic import Field
from pydantic_settings import BaseSettings
from sqlalchemy import Connection

from analytics.integrations.etldb.etldb import EtlDb
from analytics.integrations.extracts.constants import (
    MAP_TABLE_TO_FILE_NAME,
    MAP_TABLES_TO_COLS,
    OpportunityTables,
)

logger = logging.getLogger(__name__)


class LoadOpportunityDataFileConfig(BaseSettings):
    """Configure S3 properties for opportunity data."""

    load_opportunity_data_file_path: str | None = Field(
        default=None,
        alias="API_ANALYTICS_DB_EXTRACTS_PATH",
    )


def extract_copy_opportunity_data() -> None:
    """Instantiate Etldb class and call helper funcs to truncate and insert data in one txn."""
    etldb_conn = EtlDb()

    with etldb_conn.connection() as conn, conn.begin():
        _truncate_opportunity_table_records(conn)

        _fetch_insert_opportunity_data(conn)

    logger.info("Extract opportunity data completed successfully")


def _truncate_opportunity_table_records(conn: Connection) -> None:
    """Truncate existing records from all tables."""
    cursor = conn.connection.cursor()
    schema = os.environ["DB_SCHEMA"]
    for table in OpportunityTables:
        stmt_trct = f"TRUNCATE TABLE {schema}.{table} CASCADE"
        cursor.execute(stmt_trct)
    logger.info("Truncated all records from all tables")


def _fetch_insert_opportunity_data(conn: Connection) -> None:
    """Streamlines opportunity tables from S3 and insert into the database."""
    s3_config = LoadOpportunityDataFileConfig()

    cursor = conn.connection.cursor()
    for table in OpportunityTables:
        logger.info("Copying data for table: %s", table)

        columns = MAP_TABLES_TO_COLS.get(table, ())
        query = f"""
                       COPY {f"{os.getenv("DB_SCHEMA")}.{table} ({', '.join(columns)})"}
                       FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                    """

        # Use custom file name if mapping exists, otherwise use table name
        file_name = MAP_TABLE_TO_FILE_NAME.get(table, table)

        with ExitStack() as stack:
            file = stack.enter_context(
                smart_open.open(
                    f"{s3_config.load_opportunity_data_file_path}/{file_name}.csv",
                    "r",
                ),
            )
            copy = stack.enter_context(cursor.copy(query))

            while data := file.read():
                copy.write(data)

        logger.info("Successfully loaded data for table: %s", table)
