import logging

from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.data_migration.data_migration_blueprint import data_migration_blueprint

logger = logging.getLogger(__name__)


@data_migration_blueprint.cli.command("copy-oracle-data", help="Copy data form the legacy Oracle data to the new Postgres database")
@flask_db.with_db_session()
def copy_oracle_data(db_session: db.Session) -> None:
    logger.info("Beginning copy of data from Oracle database")

    # TODO - in a follow-up ticket we'll implement the actual SQL commands
    # we want to run for copying data - likely building out a few reusable utilities
    with db_session.begin():
        count = db_session.scalar(text("SELECT count(*) from transfer_topportunity"))
        logger.info(f"Found {count} records in transfer_topportunity")

    logger.info("Successfully ran copy-oracle-data")
