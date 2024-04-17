import logging
import re

import sqlalchemy
from pydantic import Field
from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.db.foreign
from src.constants.schema import Schemas
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ForeignTableConfig(PydanticBaseEnvConfig):
    is_local_foreign_table: bool = Field(False)
    schema_name: str = Field(Schemas.FOREIGN)


@data_migration_blueprint.cli.command(
    "setup-foreign-tables", help="Setup the foreign tables for connecting to the Oracle database"
)
@flask_db.with_db_session()
def setup_foreign_tables(db_session: db.Session) -> None:
    logger.info("Beginning setup of foreign Oracle tables")

    config = ForeignTableConfig()

    with db_session.begin():
        _run_create_table_commands(db_session, config)

    logger.info("Successfully ran setup-foreign-tables")


def build_sql(table: sqlalchemy.schema.Table, is_local: bool, schema_name: str) -> str:
    """
    Build the SQL for creating a possibly foreign data table. If running
    with is_local, it instead creates a regular table.

    Assume you have a table with two columns, an "ID" primary key column, and a "description" text column,
    you would call this as::

        build_sql("EXAMPLE_TABLE", [Column("ID", "integer", is_nullable=False, is_primary_key=True), Column("DESCRIPTION", "text")], is_local)

    Depending on whether the is_local bool is true or false would give two different outputs.

    is_local is True::

        CREATE TABLE IF NOT EXISTS foreign_example_table (ID integer CONSTRAINT EXAMPLE_TABLE_pkey PRIMARY KEY NOT NULL,DESCRIPTION text)

    is_local is False::

        CREATE FOREIGN TABLE IF NOT EXISTS foreign_example_table (ID integer OPTIONS (key 'true') NOT NULL,DESCRIPTION text) SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'EXAMPLE_TABLE')
    """

    column_sql_parts = []
    for column in table.columns:
        column_sql = str(sqlalchemy.schema.CreateColumn(column))

        # Primary keys are defined as constraints in a regular table
        # and as options in a foreign data table
        if column.primary_key and is_local:
            column_sql += f" CONSTRAINT {table.name}_pkey PRIMARY KEY"
        elif column.primary_key and not is_local:
            column_sql = re.sub(r"^(.*?)( NOT NULL)?$", r"\1 OPTIONS (key 'true')\2", column_sql)

        column_sql_parts.append(column_sql)

    create_table_command = "CREATE FOREIGN TABLE IF NOT EXISTS"
    if is_local:
        # Don't make a foreign table if running locally
        create_table_command = "CREATE TABLE IF NOT EXISTS"

    create_command_suffix = f" SERVER grants OPTIONS (schema 'EGRANTSADMIN', table '{table.name.upper()}')"  # noqa: B907
    if is_local:
        # We don't want the config at the end if we're running locally so unset it
        create_command_suffix = ""

    return f"{create_table_command} {schema_name}.{table.name} ({','.join(column_sql_parts)}){create_command_suffix}"


def _run_create_table_commands(db_session: db.Session, config: ForeignTableConfig) -> None:
    for table in src.db.foreign.metadata.tables.values():
        sql = build_sql(table, config.is_local_foreign_table, config.schema_name)
        logger.info("create table", extra={"table": table.name, "sql": sql})
        db_session.execute(text(sql))
