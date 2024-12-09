
import os
from email.utils import decode_rfc2231

from sqlalchemy import text

import logging

from src.adapters import db
from src.adapters.db import flask_db, PostgresDBClient
from src.constants.schema import Schemas
from src.data_migration import data_migration_blueprint



logger = logging.getLogger(__name__)


class SqlCommands:
    SELECT = """
        select * from {schema}.{table}
    """

# Function that Fetch data from source db
def _fetch_data(source_db_session, source_table,  source_schema=Schemas.PUBLIC):
    try:
        with source_db_session.begin():
            sql_query = SqlCommands.SELECT.format(schema=source_schema, table=source_table)
            result = source_db_session.execute(text(sql_query))
            data = result.mappings().all()

            # filtered_data = [
            #     {key: value for key, value in d.items() if key not in ['created_at', 'updated_at']}
            #     for d in data
            # ]

            filtered_data = [dict(d) for d in data]
            return filtered_data
    except Exception:
        logger.exception(f"Failed to run _fetch_data from {source_table}")

# Function that Insert data into target db
def _insert_data(target_db_session, data, target_table, target_schema=Schemas.PUBLIC):
    try:
        with target_db_session.begin():
            for row in data:
                columns = ", ".join(row.keys())
                values = ", ".join([f":{col}" for col in row.keys()])

                query = f"INSERT INTO {target_schema}.{target_table} ({columns}) VALUES ({values})"

                target_db_session.execute(
                    text(query),
                    row,
                )
            count = target_db_session.scalar(text(f"SELECT count(*) FROM {f"{target_schema}." if target_schema else ''}{target_table}"))
            logger.info(f"Loaded {count} records into {target_table}")
    except Exception:
        logger.exception(f"Failed to run _insert_data into {target_table} ")

@data_migration_blueprint.cli.command(
    "copy-data-from-grants-db-to-analytics-db", help="Copy tables frm grants_db to grants_analytics_db"
)
@flask_db.with_db_session()
def copy_data_from_grants_db_to_s3(db_session: db.Session) -> None:
    logger.info("Beginning copy of data from grants_db database")

    grants_db_session = db_session
    analytics_db_config = db.PostgresDBConfig(
        DB_HOST=os.getenv("ANALYTICS_DB_HOST"),
        DB_NAME=os.getenv("ANALYTICS_DB_NAME"),
        DB_USER=os.getenv("ANALYTICS_DB_USER"),
        DB_PASSWORD=os.getenv("ANALYTICS_DB_PASSWORD"),
        DB_PORT=5433,
        DB_CHECK_CONNECTION_ON_INIT=True
    )

    analytics_db_client = PostgresDBClient(db_config=analytics_db_config)
    analytics_db_session = analytics_db_client.get_session()

    # List of tables to copy over
    tables = ["lk_opportunity_status", "lk_opportunity_category", "opportunity", "opportunity_summary", "current_opportunity_summary"]

    for table in tables:
        # Grab data from grants db
        data = _fetch_data(grants_db_session, table, Schemas.API)

        # Insert data into analytics db
        _insert_data(analytics_db_session, data, table)

    logger.info("Successfully copied data from grants_db to analytics_db")





