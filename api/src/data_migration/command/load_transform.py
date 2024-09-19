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

TABLES_TO_LOAD = [
    "topportunity",
    "topportunity_cfda",
    "tsynopsis",
    "tsynopsis_hist",
    "tforecast",
    "tforecast_hist",
    "tapplicanttypes_forecast",
    "tapplicanttypes_forecast_hist",
    "tapplicanttypes_synopsis",
    "tapplicanttypes_synopsis_hist",
    "tfundactcat_forecast",
    "tfundactcat_forecast_hist",
    "tfundactcat_synopsis",
    "tfundactcat_synopsis_hist",
    "tfundinstr_forecast",
    "tfundinstr_forecast_hist",
    "tfundinstr_synopsis",
    "tfundinstr_synopsis_hist",
    # tgroups,  # Want to hold on this until we have permissions
]


@data_migration_blueprint.cli.command(
    "load-transform", help="Load and transform data from the legacy database into our database"
)
@click.option("--load/--no-load", default=True, help="run LoadOracleDataTask")
@click.option("--transform/--no-transform", default=True, help="run TransformOracleDataTask")
@click.option(
    "--set-current/--no-set-current", default=True, help="run SetCurrentOpportunitiesTask"
)
@click.option(
    "--insert-chunk-size", default=4000, help="chunk size for load inserts", show_default=True
)
@click.option("--tables-to-load", "-t", help="table to load", multiple=True)
@flask_db.with_db_session()
def load_transform(
    db_session: db.Session,
    load: bool,
    transform: bool,
    set_current: bool,
    insert_chunk_size: int,
    tables_to_load: list[str],
) -> None:
    logger.info("load and transform start")

    # Allow the user to pass in a list of tables to load
    # and override the defaults specified above
    if tables_to_load is None or len(tables_to_load) == 0:
        tables_to_load = TABLES_TO_LOAD

    foreign_tables = {
        t.name: t for t in src.db.foreign.metadata.tables.values() if t.name in tables_to_load
    }
    staging_tables = {
        t.name: t
        for t in src.db.models.staging.metadata.tables.values()
        if t.name in tables_to_load
    }

    if load:
        LoadOracleDataTask(db_session, foreign_tables, staging_tables, insert_chunk_size).run()
    if transform:
        TransformOracleDataTask(db_session).run()
    if set_current:
        SetCurrentOpportunitiesTask(db_session).run()

    logger.info("load and transform complete")
