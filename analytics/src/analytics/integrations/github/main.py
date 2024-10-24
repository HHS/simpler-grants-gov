"""Integrate with GitHub to read and write data from projects and repos."""

import shlex
import subprocess
from pathlib import Path

PARENT_DIR = Path(__file__).resolve().parent
# Set the max number of records to return with CLI commands to 10,000
# NOTE: GitHub exports data in batches of 100 so exporting 10k issues could take over a minute
# TODO(@widal001): 2023-11-29 - Switch to incremental export pattern
#   related issue: https://github.com/HHS/simpler-grants-gov/issues/775
MAX_RECORDS = 10000


def pipe_command_output_to_file(command: str, output_file: str) -> None:
    """Write the command line output to a file."""
    # make sure the output file's directory exists
    file_path = Path(output_file)
    file_path.parent.mkdir(exist_ok=True, parents=True)
    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(shlex.split(command), stdout=f)  # noqa: S603


def export_project_data(owner: str, project: int, output_file: str) -> None:
    """Export and write GitHub project data to a JSON file."""
    print(f"Exporting project data from {owner}/{project} to {output_file}")
    command = (
        f"gh project item-list {project} --format json --owner {owner} -L {MAX_RECORDS}"
    )
    pipe_command_output_to_file(command, output_file)


def export_issue_data(owner: str, repo: str, output_file: str) -> None:
    """Export and write GitHub issue data to a JSON file."""
    print(f"Exporting issue data from {owner}/{repo} to {output_file}")
    command = (
        f"gh issue list --json number,createdAt,closedAt,labels,title "
        f"-R {owner}/{repo} -L {MAX_RECORDS} --state all"
    )
    pipe_command_output_to_file(command, output_file)


def export_sprint_data(
    owner: str,
    project: int,
    sprint_field: str,
    points_field: str,
    output_file: str,
) -> None:
    """Export the issue and project data from a Sprint Board."""
    # Get the path script and the GraphQL query
    script = PARENT_DIR / "make-graphql-query.sh"
    query_path = PARENT_DIR / "getSprintData.graphql"
    # Load the query
    with open(query_path) as f:
        query = f.read()
    # Create the post-pagination transform jq
    jq = """
[
    # iterate through each project item
    .[] |
    # reformat each item
    {
        issue_title: .content.title,
        issue_url: .content.url,
        issue_parent: .content.parent.url,
        issue_type: .content.issueType.name,
        issue_is_closed: .content.closed,
        issue_opened_at: .content.createdAt,
        issue_closed_at: .content.closedAt,
        issue_points: .points.number,
        sprint_id: .sprint.iterationId,
        sprint_name: .sprint.title,
        sprint_start: .sprint.startDate,
        sprint_length: .sprint.duration,
        sprint_end: (
            if .sprint.startDate == null
            then null
            else (
                (.sprint.startDate | strptime(\"%Y-%m-%d\") | mktime)
                + (.sprint.duration * 86400) | strftime(\"%Y-%m-%d\")
            )
            end
        ),
    } |
    # filter for task-level issues
    select(.issue_type != \"Deliverable\")
]
"""
    # Make the command
    # fmt: off
    command = [
        script,
        "--batch", "100",
        "--field", f"login={owner}",
        "--field", f"project={project}",
        "--field", f"sprintField='{sprint_field}'",
        "--field", f"pointsField='{points_field}'",
        "--query", f"{query}",
        "--paginate-jq", "'.data.organization.projectV2.items.nodes'",
        "--transform-jq", jq,
    ]
    # fmt: on
    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(command, stdout=f)  # noqa: S603


def export_roadmap_data(
    owner: str,
    project: int,
    quad_field: str,
    pillar_field: str,
    output_file: str,
) -> None:
    """Export the issue and project data from a Sprint Board."""
    # Get the path script and the GraphQL query
    script = PARENT_DIR / "make-graphql-query.sh"
    query_path = PARENT_DIR / "getRoadmapData.graphql"
    # Load the query
    with open(query_path) as f:
        query = f.read()
    # Create the post-pagination transform jq
    jq = """
[
    # iterate through each project item
    .[] |
    # reformat each item
    {
        issue_title: .content.title,
        issue_url: .content.url,
        issue_parent: .content.parent.url,
        issue_type: .content.issueType.name,
        issue_is_closed: .content.closed,
        issue_opened_at: .content.createdAt,
        issue_closed_at: .content.closedAt,
        deliverable_pillar: .pillar.name,
        quad_id: .quad.iterationId,
        quad_name: .quad.title,
        quad_start: .quad.startDate,
        quad_length: .quad.duration,
        quad_end: (
            if .quad.startDate == null
            then null
            else (
                (.quad.startDate | strptime(\"%Y-%m-%d\") | mktime)
                + (.quad.duration * 86400) | strftime(\"%Y-%m-%d\")
            )
            end
        ),
    }

]
"""
    # Make the command
    # fmt: off
    command = [
        script,
        "--batch", "100",
        "--field", f"login={owner}",
        "--field", f"project={project}",
        "--field", f"quadField='{quad_field}'",
        "--field", f"pillarField='{pillar_field}'",
        "--query", f"{query}",
        "--paginate-jq", "'.data.organization.projectV2.items.nodes'",
        "--transform-jq", jq,
    ]
    # fmt: on
    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(command, stdout=f)  # noqa: S603
