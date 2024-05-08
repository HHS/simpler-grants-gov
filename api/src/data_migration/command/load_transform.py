#
# Entrypoint to load and transform data from the legacy database into our database.
#

import logging

import click

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
@click.option("--load/--no-load", default=True, help="run LoadOracleDataTask")
@click.option("--transform/--no-transform", default=True, help="run TransformOracleDataTask")
@click.option(
    "--set-current/--no-set-current", default=True, help="run SetCurrentOpportunitiesTask"
)
@flask_db.with_db_session()
def load_transform(db_session: db.Session, load: bool, transform: bool, set_current: bool) -> None:
    logger.info("load and transform start")

    foreign_tables = {t.name: t for t in src.db.foreign.metadata.tables.values()}
    staging_tables = {t.name: t for t in src.db.models.staging.metadata.tables.values()}

    if load:
        LoadOracleDataTask(db_session, foreign_tables, staging_tables).run()
    if transform:
        TransformOracleDataTask(db_session).run()
    if set_current:
        SetCurrentOpportunitiesTask(db_session).run()

    logger.info("load and transform complete")
