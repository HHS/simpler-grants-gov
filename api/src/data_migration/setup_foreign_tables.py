import logging

import sqlalchemy
from pydantic import Field

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.db.models.foreign
import src.db.models.foreign.dialect
from src.constants.schema import Schemas
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from src.task.ecs_background_task import ecs_background_task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ForeignTableConfig(PydanticBaseEnvConfig):
    is_local_foreign_table: bool = Field(False)
    schema_name: str = Field(Schemas.LEGACY)


@data_migration_blueprint.cli.command(
    "setup-foreign-tables", help="Setup the foreign tables for connecting to the Oracle database"
)
@flask_db.with_db_session()
@ecs_background_task(task_name="setup-foreign-tables")
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

    is_local is True::

        CREATE TABLE IF NOT EXISTS foreign_example_table
        (ID integer CONSTRAINT EXAMPLE_TABLE_pkey PRIMARY KEY NOT NULL,DESCRIPTION text)

    is_local is False::

        CREATE FOREIGN TABLE IF NOT EXISTS foreign_example_table
        (ID integer OPTIONS (key 'true') NOT NULL,DESCRIPTION text)
        SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'EXAMPLE_TABLE')
    """

    create_table = sqlalchemy.schema.CreateTable(table, if_not_exists=True)
    if is_local:
        compiler = create_table.compile(
            dialect=sqlalchemy.dialects.postgresql.dialect(),
            schema_translate_map={Schemas.LEGACY.name: schema_name},
        )
    else:
        compiler = create_table.compile(
            dialect=src.db.models.foreign.dialect.ForeignTableDialect(),
            schema_translate_map={Schemas.LEGACY.name: schema_name},
        )
    return str(compiler).strip()


def _run_create_table_commands(db_session: db.Session, config: ForeignTableConfig) -> None:
    for table in src.db.models.foreign.metadata.tables.values():
        sql = build_sql(table, config.is_local_foreign_table, config.schema_name)
        logger.info("create table", extra={"table": table.name, "sql": sql})
        db_session.execute(sqlalchemy.text(sql))
