import logging

from sqlalchemy import text

import src.adapters.db as db
import src.logging
from src.adapters.db import PostgresDBClient
from src.constants.schema import Schemas
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def setup_local_postgres_db() -> None:
    with src.logging.init(__package__):
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_connection() as conn, conn.begin():
            for schema in Schemas:
                _create_schema(conn, schema)


def _create_schema(conn: db.Connection, schema_name: str) -> None:
    logger.info("Creating schema %s if it does not already exist", schema_name)
    conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
