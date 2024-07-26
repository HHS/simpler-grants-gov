# pylint: disable=C0415
"""Expose a series of CLI entrypoints for the analytics package."""
import logging
from pathlib import Path
from typing import Annotated, Optional

import typer
from slack_sdk import WebClient
from sqlalchemy import text

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.datasets.sprint_board import SprintBoard
from analytics.integrations import db, github, slack
from analytics.metrics.base import BaseMetric, Unit
from analytics.metrics.burndown import SprintBurndown
from analytics.metrics.burnup import SprintBurnup
from analytics.metrics.percent_complete import DeliverablePercentComplete

logger = logging.getLogger(__name__)

# fmt: off
# Instantiate typer options with help text for the commands below
SPRINT_FILE_ARG = typer.Option(help="Path to file with exported sprint data")
ISSUE_FILE_ARG = typer.Option(help="Path to file with exported issue data")
ROADMAP_FILE_ARG = typer.Option(help="Path to file with exported roadmap data")
OUTPUT_FILE_ARG = typer.Option(help="Path to file where exported data will be saved")
OUTPUT_DIR_ARG = typer.Option(help="Path to directory where output files will be saved")
OWNER_ARG = typer.Option(help="GitHub handle of the repo or project owner")
REPO_ARG = typer.Option(help="Name of the GitHub repo")
PROJECT_ARG = typer.Option(help="Number of the GitHub project")
SPRINT_ARG = typer.Option(help="Name of the sprint for which we're calculating burndown")
UNIT_ARG = typer.Option(help="Whether to calculate completion by 'points' or 'tickets'")
SHOW_RESULTS_ARG = typer.Option(help="Display a chart of the results in a browser")
POST_RESULTS_ARG = typer.Option(help="Post the results to slack")
STATUS_ARG = typer.Option(
    help="Deliverable status to include in report, can be passed multiple times",
)
# fmt: on

# instantiate the main CLI entrypoint
app = typer.Typer()
# instantiate sub-commands for exporting data and calculating metrics
export_app = typer.Typer()
metrics_app = typer.Typer()
import_app = typer.Typer()
# add sub-commands to main entrypoint
app.add_typer(export_app, name="export", help="Export data needed to calculate metrics")
app.add_typer(metrics_app, name="calculate", help="Calculate key project metrics")
app.add_typer(import_app, name="import", help="Import data into the database")


@app.callback()
def callback() -> None:
    """Analyze data about the Simpler.Grants.gov project."""


@export_app.command(name="gh_project_data")
def export_github_project_data(
    owner: Annotated[str, OWNER_ARG],
    project: Annotated[int, PROJECT_ARG],
    output_file: Annotated[str, OUTPUT_FILE_ARG],
) -> None:
    """Export data about items in a GitHub project and write it to an output file."""
    github.export_project_data(owner, project, output_file)


@export_app.command(name="gh_issue_data")
def export_github_issue_data(
    owner: Annotated[str, OWNER_ARG],
    repo: Annotated[str, REPO_ARG],
    output_file: Annotated[str, OUTPUT_FILE_ARG],
) -> None:
    """Export data about issues a GitHub repo and write it to an output file."""
    github.export_issue_data(owner, repo, output_file)


@metrics_app.command(name="sprint_burndown")
def calculate_sprint_burndown(
    sprint_file: Annotated[str, SPRINT_FILE_ARG],
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    sprint: Annotated[str, SPRINT_ARG],
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    *,  # makes the following args keyword only
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
    output_dir: Annotated[str, OUTPUT_DIR_ARG] = "data",
) -> None:
    """Calculate the burndown for a particular sprint."""
    # load the input data
    sprint_data = SprintBoard.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )
    # calculate burndown
    burndown = SprintBurndown(sprint_data, sprint=sprint, unit=unit)
    show_and_or_post_results(
        metric=burndown,
        show_results=show_results,
        post_results=post_results,
        output_dir=output_dir,
    )


@metrics_app.command(name="sprint_burnup")
def calculate_sprint_burnup(
    sprint_file: Annotated[str, SPRINT_FILE_ARG],
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
    sprint_data = SprintBoard.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )
    # calculate burnup
    burnup = SprintBurnup(sprint_data, sprint=sprint, unit=unit)
    show_and_or_post_results(
        metric=burnup,
        show_results=show_results,
        post_results=post_results,
        output_dir=output_dir,
    )


@import_app.command(name="test_connection")
def test_connection() -> None:
    """Test function that ensures the DB connection works."""
    engine = db.get_db()
    # connection method from sqlalchemy
    connection = engine.connect()

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
def export_json_to_database(
    sprint_file: Annotated[str, SPRINT_FILE_ARG],
    issue_file: Annotated[str, ISSUE_FILE_ARG],
) -> None:
    """Import JSON data to the database."""
    logger.info("Beginning import")

    # Get the database engine and establish a connection
    engine = db.get_db()

    # get data and load from JSON
    deliverable_data = DeliverableTasks.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )

    # Load data from the sprint board
    sprint_data = SprintBoard.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )

    deliverable_data.to_sql(
        output_table="github_project_data",
        engine=engine,
        replace_table=True,
    )  # replace_table=True is the default

    sprint_data.to_sql(
        output_table="github_project_data",
        engine=engine,
        replace_table=True,
    )
    rows = len(sprint_data.to_dict())
    logger.info("Number of rows in table: %s", rows)


@metrics_app.command(name="deliverable_percent_complete")
def calculate_deliverable_percent_complete(
    sprint_file: Annotated[str, SPRINT_FILE_ARG],
    issue_file: Annotated[str, ISSUE_FILE_ARG],
    # Typer uses the Unit enum to validate user inputs from the CLI
    # but the default arg must be a string or the CLI will throw an error
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    *,  # makes the following args keyword only
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
    output_dir: Annotated[str, OUTPUT_DIR_ARG] = "data",
    roadmap_file: Annotated[Optional[str], ROADMAP_FILE_ARG] = None,  # noqa: UP007
    include_status: Annotated[Optional[list[str]], STATUS_ARG] = None,  # noqa: UP007
) -> None:
    """Calculate percentage completion by deliverable."""
    if roadmap_file:
        # load the input data using the new join path with roadmap data
        task_data = DeliverableTasks.load_from_json_files_with_roadmap_data(
            sprint_file=sprint_file,
            issue_file=issue_file,
            roadmap_file=roadmap_file,
        )
    else:
        # load the input data using the original join path without roadmap data
        task_data = DeliverableTasks.load_from_json_files(
            sprint_file=sprint_file,
            issue_file=issue_file,
        )
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
