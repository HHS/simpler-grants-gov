import logging
from dataclasses import dataclass

from pydantic import Field
from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ForeignTableConfig(PydanticBaseEnvConfig):
    is_local_foreign_table: bool = Field(False)


@dataclass
class Column:
    column_name: str
    postgres_type: str

    is_nullable: bool = True
    is_primary_key: bool = False


class Constants:
    OPPORTUNITY_COLUMNS: list[Column] = [
        Column("OPPORTUNITY_ID", "numeric(20)", is_nullable=False, is_primary_key=True),
        Column("OPPNUMBER", "character varying (40)"),
        Column("REVISION_NUMBER", "numeric(20)"),
        Column("OPPTITLE", "character varying (255)"),
        Column("OWNINGAGENCY", "character varying (255)"),
        Column("PUBLISHERUID", "character varying (255)"),
        Column("LISTED", "CHAR(1)"),
        Column("OPPCATEGORY", "CHAR(1)"),
        Column("INITIAL_OPPORTUNITY_ID", "numeric(20)"),
        Column("MODIFIED_COMMENTS", "character varying (2000)"),
        Column("CREATED_DATE", "DATE"),
        Column("LAST_UPD_DATE", "DATE"),
        Column("CREATOR_ID", "character varying (50)"),
        Column("LAST_UPD_ID", "character varying (50)"),
        Column("FLAG_2006", "CHAR(1)"),
        Column("CATEGORY_EXPLANATION", "character varying (255)"),
        Column("PUBLISHER_PROFILE_ID", "numeric(20)"),
        Column("IS_DRAFT", "character varying (1)"),
    ]


@data_migration_blueprint.cli.command(
    "setup-foreign-tables", help="Setup the foreign tables for connecting to the Oracle database"
)
@flask_db.with_db_session()
def setup_foreign_tables(db_session: db.Session) -> None:
    logger.info("Beginning setup of foreign Oracle tables")

    with db_session.begin():
        _run_create_table_commands(db_session)

    logger.info("Successfully ran setup-foreign-tables")


def build_sql(table_name: str, columns: list[Column], is_local: bool) -> str:
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
    for column in columns:
        column_sql = f"{column.column_name} {column.postgres_type}"

        # Primary keys are defined as constraints in a regular table
        # and as options in a foreign data table
        if column.is_primary_key and is_local:
            column_sql += f" CONSTRAINT {table_name}_pkey PRIMARY KEY"
        elif column.is_primary_key and not is_local:
            column_sql += " OPTIONS (key 'true')"

        if not column.is_nullable:
            column_sql += " NOT NULL"

        column_sql_parts.append(column_sql)

    create_table_command = "CREATE FOREIGN TABLE IF NOT EXISTS"
    if is_local:
        # Don't make a foreign table if running locally
        create_table_command = "CREATE TABLE IF NOT EXISTS"

    create_command_suffix = (
        f" SERVER grants OPTIONS (schema 'EGRANTSADMIN', table '{table_name}')"  # noqa: B907
    )
    if is_local:
        # We don't want the config at the end if we're running locally so unset it
        create_command_suffix = ""

    return f"{create_table_command} foreign_{table_name.lower()} ({','.join(column_sql_parts)}){create_command_suffix}"


def _run_create_table_commands(db_session: db.Session) -> None:
    config = ForeignTableConfig()

    db_session.execute(
        text(
            build_sql("TOPPORTUNITY", Constants.OPPORTUNITY_COLUMNS, config.is_local_foreign_table)
        )
    )
