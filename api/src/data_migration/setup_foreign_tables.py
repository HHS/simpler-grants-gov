import logging

from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class Column:

    column_name: str
    postgres_type: str

    is_nullable: bool = False
    is_primary_key: bool = False

class Constants:
    OPTIONS = "SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TOPPORTUNITY')" # TODO - format for table name

    OPPORTUNITY_COLUMNS: list[Column] = [
        Column("OPPORTUNITY_ID", "numeric(20)", is_nullable=False, is_primary_key=True),
        Column("OPPNUMBER", "character varying (40)"),
        Column("REVISION_NUMBER", "numeric(20)"),
        Column("OPPTITLE", "character varying (40)"),
        Column("OWNINGAGENCY", "character varying (40)"),
        Column("PUBLISHERUID", "character varying (40)"),
        Column("LISTED", "character varying (40)"),
        Column("OPPCATEGORY", "character varying (40)"),
        Column("INITIAL_OPPORTUNITY_ID", "character varying (40)"),
        Column("MODIFIED_COMMENTS", "character varying (40)"),
        Column("CREATED_DATE", "character varying (40)"),
        Column("LAST_UPD_DATE", "character varying (40)"),
        Column("CREATOR_ID", "character varying (40)"),
        Column("LAST_UPD_ID", "character varying (40)"),
        Column("FLAG_2006", "character varying (40)"),
        Column("OPPNUMBER", "character varying (40)"),
        Column("OPPNUMBER", "character varying (40)"),
    ]

    # TODO - the options bit
    OPPORTUNITY_COLUMNS = """(
          OPPORTUNITY_ID          numeric(20)            OPTIONS (key 'true')  NOT NULL,
          OPPNUMBER               character varying (40),
          REVISION_NUMBER         numeric(20),
          OPPTITLE                character varying (255),
          OWNINGAGENCY            character varying (255),
          PUBLISHERUID            character varying (255),
          LISTED                  CHAR(1),
          OPPCATEGORY             CHAR(1),
          INITIAL_OPPORTUNITY_ID  numeric(20),
          MODIFIED_COMMENTS       character varying (2000),
          CREATED_DATE            DATE,
          LAST_UPD_DATE           DATE,
          CREATOR_ID              character varying (50),
          LAST_UPD_ID             character varying (50),
          FLAG_2006               CHAR(1),
          CATEGORY_EXPLANATION    character varying (255),
          PUBLISHER_PROFILE_ID    numeric(20),
          IS_DRAFT                character varying (1)  
          )
    """

@data_migration_blueprint.cli.command(
    "setup-foreign-tables", help="Setup the foreign tables for connecting to the Oracle database"
)
@flask_db.with_db_session()
def setup_foreign_tables(db_session: db.Session) -> None:
    logger.info("Beginning setup of foreign Oracle tables")

    with db_session.begin():
        _run_create_table_commands(db_session)

    logger.info("Successfully ran setup-foreign-tables")


def build_sql(table_name: str, column_sql: str) -> str:

    # Foreign keys are specified differently in foreign data wrappers, so fix it
    col_sql = column_sql.replace("OPTIONS (key 'true')", f"CONSTRAINT {table_name}_pkey PRIMARY KEY")

    return f"CREATE TABLE IF NOT EXISTS foreign_{table_name.lower()} {col_sql}"

def _run_create_table_commands(db_session: db.Session) -> None:
    db_session.execute(text(build_sql("TOPPORTUNITY", Constants.OPPORTUNITY_COLUMNS)))

