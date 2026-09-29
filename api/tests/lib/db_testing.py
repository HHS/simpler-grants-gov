"""Helper functions for testing database code."""

import contextlib
import logging

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.db.clients.postgres_config import get_db_config

logger = logging.getLogger(__name__)


@contextlib.contextmanager
def create_isolated_db(monkeypatch, db_schema_prefix) -> db.DBClient:
    """
    Creates a temporary PostgreSQL schema and creates a database engine
    that connects to that schema. Drops the schema after the context manager
    exits.
    """

    # To improve test performance, don't check the database connection
    # when initializing the DB client.
    monkeypatch.setenv("DB_CHECK_CONNECTION_ON_INIT", "False")
    # We set the prefix override here so when the API client creates a DB config
    # it also has the appropriate prefix value for mapping
    monkeypatch.setenv("SCHEMA_PREFIX_OVERRIDE", db_schema_prefix)

    db_config = db.PostgresDBConfig(schema_prefix_override=db_schema_prefix)
    db_client = db.PostgresDBClient(db_config)
    test_schemas = db_config.get_schema_translate_map().values()

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


def cascade_delete_from_db_table(db_session: db.Session, table_model) -> None:
    """Delete all records in a table in a way that cascade-deletes any records configured to do so

    Normally if you were to try to do a "delete all" query against a table which has foreign keys referencing it
    you'd get an error. SQLAlchemy's cascade deletes handle recursively cleaning up anything that would still reference it.

    Note that these types of queries are much slower as it needs to first fetch and then iterate over A LOT
    of models potentially. Before you use this, please make sure you can't write your test in a way that is fine
    with whatever data might exist in a given table.
    """

    db_session.expunge_all()
    with db_session.no_autoflush:
        records = db_session.scalars(select(table_model).options(selectinload("*")))

        for record in records:
            db_session.delete(record)

        db_session.commit()
