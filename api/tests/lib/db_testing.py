"""Helper functions for testing database code."""
import contextlib
import logging
import uuid

from sqlalchemy import text

import src.adapters.db as db
from src.adapters.db.clients.postgres_config import get_db_config
from src.constants.schema import Schemas

logger = logging.getLogger(__name__)


@contextlib.contextmanager
def create_isolated_db(monkeypatch) -> db.DBClient:
    """
    Creates a temporary PostgreSQL schema and creates a database engine
    that connects to that schema. Drops the schema after the context manager
    exits.
    """

    schema_prefix = f"test_{uuid.uuid4().int}_"

    test_schemas = [f"{schema_prefix}{schema}" for schema in Schemas]

    monkeypatch.setenv("SCHEMA_PREFIX_OVERRIDE", schema_prefix)
    monkeypatch.setenv("DB_CHECK_CONNECTION_ON_INIT", "False")

    # To improve test performance, don't check the database connection
    # when initializing the DB client.
    db_client = db.PostgresDBClient()
    with db_client.get_connection() as conn:
        for schema in test_schemas:
            _create_schema(conn, schema)

        try:
            yield db_client

        finally:
            for schema in test_schemas:
                _drop_schema(conn, schema)


def _create_schema(conn: db.Connection, schema_name: str):
    """Create a database schema."""
    db_test_user = get_db_config().username

    with conn.begin():
        conn.execute(
            text(f"CREATE SCHEMA IF NOT EXISTS {schema_name} AUTHORIZATION {db_test_user};")
        )
    logger.info("create schema %s", schema_name)


def _drop_schema(conn: db.Connection, schema_name: str):
    """Drop a database schema."""
    with conn.begin():
        conn.execute(text(f"DROP SCHEMA {schema_name} CASCADE;"))
    logger.info("drop schema %s", schema_name)
