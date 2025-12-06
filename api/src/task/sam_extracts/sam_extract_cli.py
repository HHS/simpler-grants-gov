import logging

import click

import src.adapters.db as db
from src.adapters.db import flask_db
from src.adapters.sam_gov import create_sam_gov_client
from src.task.ecs_background_task import ecs_background_task
from src.task.sam_extracts.cleanup_old_sam_extracts import CleanupOldSamExtractsTask
from src.task.sam_extracts.create_orgs_from_sam_entity import CreateOrgsFromSamEntityTask
from src.task.sam_extracts.fetch_sam_extracts import FetchSamExtractsTask
from src.task.sam_extracts.process_sam_extracts import ProcessSamExtractsTask
from src.task.sam_extracts.setup_lower_env_sam_extracts import SetupLowerEnvSamExtractsTask
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "sam-extracts", help="Fetch SAM.gov daily and monthly extracts, and process them in our system"
)
@click.option("--fetch-extracts/--no-fetch-extracts", default=True, help="run FetchSamExtractsTask")
@click.option(
    "--setup-lower-env/--no-setup-lower-env", default=False, help="run SetupLowerEnvSamExtract"
)
@click.option(
    "--process-extracts/--no-process-extracts", default=True, help="run ProcessSamExtractsTask"
)
@click.option(
    "--create-orgs/--no-create-orgs", default=True, help="run CreateOrgsFromSamEntityTask"
)
@click.option(
    "--cleanup-old-files/--no-cleanup-old-files", default=True, help="run CleanupOldSamExtractsTask"
)
@ecs_background_task("sam-extracts")
@flask_db.with_db_session()
def run_sam_extracts(
    db_session: db.Session,
    fetch_extracts: bool,
    setup_lower_env: bool,
    process_extracts: bool,
    create_orgs: bool,
    cleanup_old_files: bool,
) -> None:
    """Run the SAM.gov extracts task"""
    logger.info("Starting sam-extracts task")

    if fetch_extracts:
        # Create the SAM.gov client using the factory
        sam_gov_client = create_sam_gov_client()
        # Initialize and run the task
        FetchSamExtractsTask(db_session, sam_gov_client).run()

    if setup_lower_env:
        SetupLowerEnvSamExtractsTask(db_session).run()

    if process_extracts:
        ProcessSamExtractsTask(db_session).run()

    if create_orgs:
        CreateOrgsFromSamEntityTask(db_session).run()

    if cleanup_old_files:
        CleanupOldSamExtractsTask(db_session).run()

    logger.info("Completed sam-extracts task")
