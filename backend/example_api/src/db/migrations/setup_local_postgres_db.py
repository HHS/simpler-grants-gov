import logging

import grants_shared.logs
import sqlalchemy
from grants_shared.adapters import db
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def setup_local_postgres_db() -> None:
    with grants_shared.logs.init(__package__):
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_connection() as conn, conn.begin():
            # TODO - need a way for us to define the schemas
            _create_schema(conn, "example")


def _create_schema(conn: db.Connection, schema_name: str) -> None:
    logger.info("Creating schema %s if it does not already exist", schema_name)
    conn.execute(sqlalchemy.schema.CreateSchema(schema_name, if_not_exists=True))
