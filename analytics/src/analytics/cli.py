# ruff: noqa: T201
# pylint: disable=C0415
"""Expose a series of CLI entrypoints for the analytics package."""

import logging
import logging.config
from datetime import datetime
from pathlib import Path
from typing import Annotated

import typer
from sqlalchemy import text

from analytics.datasets.etl_dataset import EtlDataset
from analytics.datasets.issues import GitHubIssues
from analytics.etl.github import GitHubProjectConfig, GitHubProjectETL
from analytics.etl.utils import load_config
from analytics.integrations import etldb
from analytics.integrations.db import PostgresDbClient
from analytics.integrations.extracts.load_opportunity_data import (
    extract_copy_opportunity_data,
)
from analytics.logs import init as init_logging
from analytics.logs.app_logger import init_app
from analytics.logs.ecs_background_task import ecs_background_task

logger = None

# fmt: off
# Instantiate typer options with help text for the commands below
CONFIG_FILE_ARG = typer.Option(help="Path to JSON file with configurations for this entrypoint")
ISSUE_FILE_ARG = typer.Option(help="Path to file with exported issue data")
OUTPUT_FILE_ARG = typer.Option(help="Path to file where exported data will be saved")
OUTPUT_DIR_ARG = typer.Option(help="Path to directory where output files will be saved")
TMP_DIR_ARG = typer.Option(help="Path to directory where intermediate files will be saved")
OWNER_ARG = typer.Option(help="Name of the GitHub project owner, e.g. HHS")
PROJECT_ARG = typer.Option(help="Number of the GitHub project, e.g. 13")
EFFECTIVE_DATE_ARG = typer.Option(help="YYYY-MM-DD effective date to apply to each imported row")
# fmt: on

# instantiate the main CLI entrypoint
app = typer.Typer()
# instantiate sub-commands for exporting data and calculating metrics
export_app = typer.Typer()
import_app = typer.Typer()
etl_app = typer.Typer()
# add sub-commands to main entrypoint
app.add_typer(export_app, name="export", help="Export data needed to calculate metrics")
app.add_typer(import_app, name="import", help="Import data into the database")
app.add_typer(etl_app, name="etl", help="Transform and load local file")


def init() -> None:
    """Shared init function for all scripts."""
    # Setup logging
    initialize_logger()
    init_app(logging.root)


def initialize_logger() -> None:
    global logger
    if logger is None:
        logger = logging.getLogger(__name__)
        init_logging(__package__)


@app.callback()
def callback() -> None:
    """Analyze data about the Simpler.Grants.gov project."""
    # If you override this callback, remember to call init()
    init()


# ===========================================================
# Export commands
# ===========================================================


@export_app.command(name="gh_delivery_data")
def export_github_data(
    config_file: Annotated[str, CONFIG_FILE_ARG],
    output_file: Annotated[str, OUTPUT_FILE_ARG],
    temp_dir: Annotated[str, TMP_DIR_ARG],
) -> None:
    """Export and flatten metadata about GitHub issues used for delivery metrics."""
    # Configure ETL pipeline
    config_path = Path(config_file)
    if not config_path.exists():
        typer.echo(f"Not a path to a valid config file: {config_path}")
    config = load_config(config_path, GitHubProjectConfig)
    config.temp_dir = temp_dir
    config.output_file = output_file
    # Run ETL pipeline
    GitHubProjectETL(config).run()


# ===========================================================
# Diagnostic commands
# ===========================================================


@import_app.command(name="test_connection")
def test_connection() -> None:
    """Test function that ensures the DB connection works."""
    client = PostgresDbClient()
    connection = client.connect()

    # Test INSERT INTO action
    result = connection.execute(
        text(
            "INSERT INTO audit_log (topic,timestamp, end_timestamp, user_id, details)"
            "VALUES('test','2024-06-11 10:41:15','2024-06-11 10:54:15',87654,'test from command');",
        ),
    )
    # Test SELECT action
    result = connection.execute(text("SELECT * FROM audit_log WHERE user_id=87654;"))
    for row in result:
        print(row)
    # commits the transaction to the db
    connection.commit()
    result.close()


# ===========================================================
# Etl commands
# ===========================================================


@etl_app.command(name="db_migrate")
@ecs_background_task("db_migrate")
def migrate_database() -> None:
    """Initialize etl database."""
    initialize_logger() # needed for nontyper entry point
    logger.info("initializing database")
    etldb.migrate_database()
    logger.info("done")


@etl_app.command(name="transform_and_load")
def transform_and_load(
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    effective_date: Annotated[str, EFFECTIVE_DATE_ARG],
) -> None:
    """Transform and load etl data."""
    # validate effective date arg
    datestamp = validate_effective_date(effective_date)
    if datestamp is None:
        logger.error(
            "FATAL ERROR: malformed effective date, expected YYYY-MM-DD format",
        )
        return
    logger.info("running transform and load with effective date %s", datestamp)

    # hydrate a dataset instance from the input data
    dataset = EtlDataset.load_from_json_file(file_path=issue_file)

    # sync data to db
    etldb.sync_data(dataset, datestamp)

    # finish
    logger.info("transform and load is done")


@etl_app.command(name="extract_transform_and_load")
def extract_transform_and_load(
    config_file: Annotated[str, CONFIG_FILE_ARG],
    effective_date: Annotated[str, EFFECTIVE_DATE_ARG],
) -> None:
    """Export data from GitHub, transform it, and load into analytics warehouse."""
    # get configuration
    config_path = Path(config_file)
    if not config_path.exists():
        typer.echo(f"Not a path to a valid config file: {config_path}")
    config = load_config(config_path, GitHubProjectConfig)

    # validate effective date arg
    datestamp = validate_effective_date(effective_date)
    if datestamp is None:
        logger.error(
            "FATAL ERROR: malformed effective date, expected YYYY-MM-DD format",
        )
        return
    logger.info("running transform and load with effective date %s", datestamp)

    # extract data from GitHub
    logger.info("extracting data from GitHub")
    extracted_json = GitHubProjectETL(config).extract_and_transform_in_memory()

    # hydrate a dataset instance from the input data
    logger.info("transforming data")
    dataset = EtlDataset.load_from_json_object(json_data=extracted_json)

    # sync dataset to db
    logger.info("writing to database")
    etldb.sync_data(dataset, datestamp)

    logger.info("workflow is done!")


def validate_effective_date(effective_date: str) -> str | None:
    """Validate that string value conforms to effective date expected format."""
    stamp = None

    try:
        dateformat = "%Y-%m-%d"
        stamp = (
            datetime.strptime(effective_date, dateformat)
            .astimezone()
            .strftime(dateformat)
        )
    except ValueError:
        stamp = None

    return stamp


@etl_app.command(name="opportunity-load")
def load_opportunity_data() -> None:
    """Grabs data from s3 bucket and loads it into opportunity tables."""
    extract_copy_opportunity_data()
