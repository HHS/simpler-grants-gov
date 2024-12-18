# ruff: noqa: T201
# pylint: disable=C0415
"""Expose a series of CLI entrypoints for the analytics package."""

import logging
import logging.config
from datetime import datetime
from pathlib import Path
from typing import Annotated

import typer
from slack_sdk import WebClient
from sqlalchemy import text

from analytics.datasets.etl_dataset import EtlDataset
from analytics.datasets.issues import GitHubIssues
from analytics.etl.github import GitHubProjectConfig, GitHubProjectETL
from analytics.etl.utils import load_config
from analytics.integrations import etldb, slack
from analytics.integrations.db import PostgresDbClient
from analytics.integrations.extracts.load_opportunity_data import (
    extract_copy_opportunity_data,
)
from analytics.logs import init as init_logging
from analytics.logs.app_logger import init_app
from analytics.logs.ecs_background_task import ecs_background_task
from analytics.metrics.base import BaseMetric, Unit
from analytics.metrics.burndown import SprintBurndown
from analytics.metrics.burnup import SprintBurnup
from analytics.metrics.percent_complete import DeliverablePercentComplete

logger = logging.getLogger(__name__)

# fmt: off
# Instantiate typer options with help text for the commands below
CONFIG_FILE_ARG = typer.Option(help="Path to JSON file with configurations for this entrypoint")
ISSUE_FILE_ARG = typer.Option(help="Path to file with exported issue data")
OUTPUT_FILE_ARG = typer.Option(help="Path to file where exported data will be saved")
OUTPUT_DIR_ARG = typer.Option(help="Path to directory where output files will be saved")
TMP_DIR_ARG = typer.Option(help="Path to directory where intermediate files will be saved")
SPRINT_ARG = typer.Option(help="Name of the sprint for which we're calculating burndown")
UNIT_ARG = typer.Option(help="Whether to calculate completion by 'points' or 'tickets'")
OWNER_ARG = typer.Option(help="Name of the GitHub project owner, e.g. HHS")
PROJECT_ARG = typer.Option(help="Number of the GitHub project, e.g. 13")
SHOW_RESULTS_ARG = typer.Option(help="Display a chart of the results in a browser")
POST_RESULTS_ARG = typer.Option(help="Post the results to slack")
STATUS_ARG = typer.Option(
    help="Deliverable status to include in report, can be passed multiple times",
)
EFFECTIVE_DATE_ARG = typer.Option(help="YYYY-MM-DD effective date to apply to each imported row")
# fmt: on

# instantiate the main CLI entrypoint
app = typer.Typer()
# instantiate sub-commands for exporting data and calculating metrics
export_app = typer.Typer()
metrics_app = typer.Typer()
import_app = typer.Typer()
etl_app = typer.Typer()
# add sub-commands to main entrypoint
app.add_typer(export_app, name="export", help="Export data needed to calculate metrics")
app.add_typer(metrics_app, name="calculate", help="Calculate key project metrics")
app.add_typer(import_app, name="import", help="Import data into the database")
app.add_typer(etl_app, name="etl", help="Transform and load local file")


def init() -> None:
    """Shared init function for all scripts."""
    # Setup logging
    init_logging(__package__)
    init_app(logging.root)


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
# Calculate commands
# ===========================================================


@metrics_app.command(name="sprint_burndown")
def calculate_sprint_burndown(
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    sprint: Annotated[str, SPRINT_ARG],
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    *,  # makes the following args keyword only
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
    output_dir: Annotated[str, OUTPUT_DIR_ARG] = "data",
    owner: Annotated[str, OWNER_ARG] = "HHS",
    project: Annotated[int, PROJECT_ARG] = 13,
) -> None:
    """Calculate the burndown for a particular sprint."""
    # load the input data
    sprint_data = GitHubIssues.from_json(issue_file)
    # calculate burndown
    burndown = SprintBurndown(
        sprint_data,
        sprint=sprint,
        unit=unit,
        project=project,
        owner=owner,
    )
    show_and_or_post_results(
        metric=burndown,
        show_results=show_results,
        post_results=post_results,
        output_dir=output_dir,
    )


@metrics_app.command(name="sprint_burnup")
def calculate_sprint_burnup(
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    sprint: Annotated[str, SPRINT_ARG],
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    *,  # makes the following args keyword only
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
    output_dir: Annotated[str, OUTPUT_DIR_ARG] = "data",
) -> None:
    """Calculate the burnup of a particular sprint."""
    # load the input data
    sprint_data = GitHubIssues.from_json(issue_file)
    # calculate burnup
    burnup = SprintBurnup(sprint_data, sprint=sprint, unit=unit)
    show_and_or_post_results(
        metric=burnup,
        show_results=show_results,
        post_results=post_results,
        output_dir=output_dir,
    )


@metrics_app.command(name="deliverable_percent_complete")
def calculate_deliverable_percent_complete(
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    # Typer uses the Unit enum to validate user inputs from the CLI
    # but the default arg must be a string or the CLI will throw an error
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    *,  # makes the following args keyword only
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
    output_dir: Annotated[str, OUTPUT_DIR_ARG] = "data",
    include_status: Annotated[list[str] | None, STATUS_ARG] = None,
) -> None:
    """Calculate percentage completion by deliverable."""
    task_data = GitHubIssues.from_json(issue_file)
    # calculate percent complete
    metric = DeliverablePercentComplete(
        dataset=task_data,
        unit=unit,
        statuses_to_include=include_status,
    )
    show_and_or_post_results(
        metric=metric,
        show_results=show_results,
        post_results=post_results,
        output_dir=output_dir,
    )


def show_and_or_post_results(
    metric: BaseMetric,
    *,  # makes the following args keyword only
    show_results: bool,
    post_results: bool,
    output_dir: str,
) -> None:
    """Optionally show the results of a metric and/or post them to slack."""
    # defer load of settings until this command is called
    # this prevents an error if ANALYTICS_SLACK_BOT_TOKEN env var is unset
    from config import get_db_settings

    settings = get_db_settings()

    # optionally display the burndown chart in the browser
    if show_results:
        metric.show_chart()
        print("Slack message:\n")
        print(metric.format_slack_message())
    if post_results:
        slackbot = slack.SlackBot(client=WebClient(token=settings.slack_bot_token))
        metric.post_results_to_slack(
            slackbot=slackbot,
            channel_id=settings.reporting_channel_id,
            output_dir=Path(output_dir),
        )


# ===========================================================
# Import commands
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


@import_app.command(name="db_import")
def export_json_to_database(delivery_file: Annotated[str, ISSUE_FILE_ARG]) -> None:
    """Import JSON data to the database."""
    logger.info("Beginning import")

    # Get the database engine and establish a connection
    client = PostgresDbClient()

    # Load data from the sprint board
    issues = GitHubIssues.from_json(delivery_file)

    issues.to_sql(
        output_table="github_project_data",
        engine=client.engine(),
        replace_table=True,
    )
    rows = len(issues.to_dict())
    logger.info("Number of rows in table: %s", rows)


# ===========================================================
# Etl commands
# ===========================================================


@etl_app.command(name="db_migrate")
@ecs_background_task("db_migrate")
def migrate_database() -> None:
    """Initialize etl database."""
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
    try:
        dateformat = "%Y-%m-%d"
        datestamp = (
            datetime.strptime(effective_date, dateformat)
            .astimezone()
            .strftime(dateformat)
        )
        print(f"running transform and load with effective date {datestamp}")
    except ValueError:
        print("FATAL ERROR: malformed effective date, expected YYYY-MM-DD format")
        return

    # hydrate a dataset instance from the input data
    dataset = EtlDataset.load_from_json_file(file_path=issue_file)

    # sync data to db
    etldb.sync_data(dataset, datestamp)

    # finish
    print("transform and load is done")


@etl_app.command(name="opportunity-load")
def load_opportunity_data() -> None:
    """Grabs data from s3 bucket and loads it into opportunity tables."""
    extract_copy_opportunity_data()
