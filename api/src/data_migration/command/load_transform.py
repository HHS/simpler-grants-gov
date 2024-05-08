#
# Entrypoint to load and transform data from the legacy database into our database.
#

import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.db.foreign
import src.db.models.staging
from src.task.opportunities.set_current_opportunities_task import SetCurrentOpportunitiesTask

from ..data_migration_blueprint import data_migration_blueprint
from ..load.load_oracle_data_task import LoadOracleDataTask
from ..transformation.transform_oracle_data_task import TransformOracleDataTask

logger = logging.getLogger(__name__)


@data_migration_blueprint.cli.command(
    "load-transform", help="Load and transform data from the legacy database into our database"
)
@flask_db.with_db_session()
def load_transform(db_session: db.Session) -> None:
    logger.info("load and transform start")

    foreign_tables = {t.name: t for t in src.db.foreign.metadata.tables.values()}
    staging_tables = {t.name: t for t in src.db.models.staging.metadata.tables.values()}

    LoadOracleDataTask(db_session, foreign_tables, staging_tables).run()
    TransformOracleDataTask(db_session).run()
    SetCurrentOpportunitiesTask(db_session).run()

    logger.info("load and transform complete")
