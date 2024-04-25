import logging

from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.constants.schema import Schemas
from src.data_migration.data_migration_blueprint import data_migration_blueprint

logger = logging.getLogger(__name__)


class SqlCommands:
    """
    Constants class for holding all of the commands we run below
    so that the code itself doesn't need to contain these massive walls of text
    """

    #################################
    # TOPPORTUNITY queries
    #################################

    OPPORTUNITY_DELETE_QUERY = """
        delete from {}.transfer_topportunity
    """
    OPPORTUNITY_INSERT_QUERY = """
        insert into {}.transfer_topportunity
            select
                opportunity_id,
                oppnumber,
                opptitle,
                owningagency,
                oppcategory,
                category_explanation,
                is_draft,
                revision_number,
                modified_comments,
                publisheruid,
                publisher_profile_id,
                last_upd_id,
                last_upd_date,
                creator_id,
                created_date
            from {}.topportunity
            where is_draft = 'N'
    """


@data_migration_blueprint.cli.command(
    "copy-oracle-data", help="Copy data form the legacy Oracle data to the new Postgres database"
)
@flask_db.with_db_session()
def copy_oracle_data(db_session: db.Session) -> None:
    logger.info("Beginning copy of data from Oracle database")

    try:
        with db_session.begin():
            _run_copy_commands(db_session, Schemas.API, Schemas.LEGACY)
    except Exception:
        logger.exception("Failed to run copy-oracle-data command")
        raise

    logger.info("Successfully ran copy-oracle-data")


def _run_copy_commands(db_session: db.Session, api_schema: str, foreign_schema: str) -> None:
    logger.info("Running copy commands for TOPPORTUNITY")

    db_session.execute(text(SqlCommands.OPPORTUNITY_DELETE_QUERY.format(api_schema)))
    db_session.execute(
        text(SqlCommands.OPPORTUNITY_INSERT_QUERY.format(api_schema, foreign_schema))
    )
    count = db_session.scalar(
        text(f"SELECT count(*) from {api_schema}.transfer_topportunity")  # nosec
    )
    logger.info(f"Loaded {count} records into {api_schema}.transfer_topportunity")
