#
# Entrypoint to load and transform data from the legacy database into our database.
#

import logging

import click

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.db.models.foreign
import src.db.models.staging
from src.task.ecs_background_task import ecs_background_task
from src.task.opportunities.set_current_opportunities_task import SetCurrentOpportunitiesTask

from ...task.opportunities.store_opportunity_version_task import StoreOpportunityVersionTask
from ...task.opportunities.sync_opportunity_review_status_task import SyncOpportunityReviewStatus
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
@click.option(
    "--insert-chunk-size", default=800, help="chunk size for load inserts", show_default=True
)
@click.option("--tables-to-load", "-t", help="table to load", multiple=True)
@click.option(
    "--store-version/--no-store-version", default=False, help="run StoreOpportunityVersionTask"
)
@click.option(
    "--sync-status/--no-sync-status", default=False, help="run SyncOpportunityReviewStatus"
)
@click.option("--scheduled-job-name", default=None, help="Name of the scheduled job)
@flask_db.with_db_session()
@ecs_background_task(task_name="load-transform")
def load_transform(
    db_session: db.Session,
    load: bool,
    transform: bool,
    set_current: bool,
    store_version: bool,
    sync_status: bool,
    insert_chunk_size: int,
    tables_to_load: list[str],
    scheduled_job_name: str | None,
) -> None:
    logger.info("load and transform start")

    foreign_tables = {t.name: t for t in src.db.models.foreign.metadata.tables.values()}
    staging_tables = {t.name: t for t in src.db.models.staging.metadata.tables.values()}

    if load:
        LoadOracleDataTask(
            db_session, foreign_tables, staging_tables, tables_to_load, insert_chunk_size
        ).run()
    if transform:
        TransformOracleDataTask(db_session).run()
    if set_current:
        SetCurrentOpportunitiesTask(db_session).run()
    if store_version:
        StoreOpportunityVersionTask(db_session).run()
    if sync_status:
        SyncOpportunityReviewStatus(db_session).run()

    logger.info("load and transform complete")
