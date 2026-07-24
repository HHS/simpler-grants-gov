import logging

import grants_shared.adapters.db as db
import grants_shared.logs
import sqlalchemy
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.util.local import error_if_not_local

from src.auth.internal_resource import create_internal_resource
from src.constants.schema import Schemas
from src.db.resource_automation.resource_automation import setup_resource_automation

logger = logging.getLogger(__name__)


def setup_local_postgres_db() -> None:
    with grants_shared.logs.init(__package__):
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_connection() as conn, conn.begin():
            for schema in Schemas:
                _create_schema(conn, schema)


def _create_schema(conn: db.Connection, schema_name: str) -> None:
    logger.info("Creating schema %s if it does not already exist", schema_name)
    conn.execute(sqlalchemy.schema.CreateSchema(schema_name, if_not_exists=True))


def setup_internal_resource() -> None:
    """Create the statically defined internal resource record for local development.

    This runs after migrations (unlike schema creation above, which must run before)
    since it needs the resource tables to exist. It always runs as part of `make init-db`
    and is idempotent, so an existing record is left untouched.
    """
    with grants_shared.logs.init(__package__):
        error_if_not_local()

        db_client = PostgresDBClient()
        setup_resource_automation()

        with db_client.get_session() as db_session, db_session.begin():
            create_internal_resource(db_session)
