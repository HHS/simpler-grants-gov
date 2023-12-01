# pylint: disable=C0415
"""Expose a series of CLI entrypoints for the analytics package."""
from typing import Annotated

import typer
from slack_sdk import WebClient

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.datasets.sprint_board import SprintBoard
from analytics.etl import github, slack
from analytics.metrics.burndown import SprintBurndown
from analytics.metrics.percent_complete import DeliverablePercentComplete, Unit

# fmt: off
# Instantiate typer options with help text for the commands below
SPRINT_FILE_ARG = typer.Option(help="Path to file with exported sprint data")
ISSUE_FILE_ARG = typer.Option(help="Path to file with exported issue data")
OUTPUT_FILE_ARG = typer.Option(help="Path to file where exported data will be saved")
OWNER_ARG = typer.Option(help="GitHub handle of the repo or project owner")
REPO_ARG = typer.Option(help="Name of the GitHub repo")
PROJECT_ARG = typer.Option(help="Number of the GitHub project")
SPRINT_ARG = typer.Option(help="Name of the sprint for which we're calculating burndown")
UNIT_ARG = typer.Option(help="Whether to calculate completion by 'points' or 'tickets'")
SHOW_RESULTS_ARG = typer.Option(help="Display a chart of the results in a browser")
POST_RESULTS_ARG = typer.Option(help="Post the results to slack")
# fmt: on

# instantiate the main CLI entrypoint
app = typer.Typer()
# instantiate sub-commands for exporting data and calculating metrics
export_app = typer.Typer()
metrics_app = typer.Typer()
# add sub-commands to main entrypoint
app.add_typer(export_app, name="export", help="Export data needed to calculate metrics")
app.add_typer(metrics_app, name="calculate", help="Calculate key project metrics")


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
    *,  # makes the following args keyword only
    unit: Annotated[Unit, UNIT_ARG] = Unit.points.value,  # type: ignore[assignment]
    show_results: Annotated[bool, SHOW_RESULTS_ARG] = False,
    post_results: Annotated[bool, POST_RESULTS_ARG] = False,
) -> None:
    """Calculate the burndown for a particular sprint."""
    # defer load of settings until this command is called
    # this prevents an error if ANALYTICS_SLACK_BOT_TOKEN env var is unset
    from config import settings

    # load the input data
    sprint_data = SprintBoard.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )
    # calculate burndown
    burndown = SprintBurndown(sprint_data, sprint=sprint, unit=unit)
    # optionally display the burndown chart in the browser
    if show_results:
        burndown.show_chart()
    # optionally post the results to slack
    if post_results:
        slackbot = slack.SlackBot(client=WebClient(token=settings.slack_bot_token))
        burndown.post_results_to_slack(
            slackbot=slackbot,
            channel_id=settings.reporting_channel_id,
        )


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
) -> None:
    """Calculate percentage completion by deliverable."""
    # defer load of settings until this command is called
    # this prevents an error if ANALYTICS_SLACK_BOT_TOKEN env var is unset
    from config import settings

    # load the input data
    task_data = DeliverableTasks.load_from_json_files(
        sprint_file=sprint_file,
        issue_file=issue_file,
    )
    # calculate burndown
    pct_complete = DeliverablePercentComplete(task_data, unit=unit)
    # optionally display the burndown chart in the browser
    if show_results:
        pct_complete.show_chart()
    if post_results:
        slackbot = slack.SlackBot(client=WebClient(token=settings.slack_bot_token))
        pct_complete.post_results_to_slack(
            slackbot=slackbot,
            channel_id=settings.reporting_channel_id,
        )
