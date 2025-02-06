"""Integrate with GitHub to read and write data from projects and repos."""

import json
import shlex
import subprocess
from pathlib import Path

PARENT_DIR = Path(__file__).resolve().parent


def pipe_command_output_to_file(command: str, output_file: str) -> None:
    """Write the command line output to a file."""
    # make sure the output file's directory exists
    file_path = Path(output_file)
    file_path.parent.mkdir(exist_ok=True, parents=True)
    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(shlex.split(command), stdout=f)  # noqa: S603


def export_sprint_data_to_object(
    owner: str,
    project: int,
    sprint_field: str,
    points_field: str,
) -> list[dict]:
    """Export the issue and project data from a Sprint Board."""
    # get the subprocess command
    command = get_sprint_export_command(owner, project, sprint_field, points_field)

    # invoke the subprocess command and capture the output
    result = subprocess.run(command, capture_output=True, text=True, check=True) # noqa: S603

    # convert the output to a JSON object
    return json.loads(result.stdout)


def export_sprint_data_to_file(
    owner: str,
    project: int,
    sprint_field: str,
    points_field: str,
    output_file: str,
) -> None:
    """Export the issue and project data from a Sprint Board."""
    # get the subprocess command
    command = get_sprint_export_command(owner, project, sprint_field, points_field)

    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(command, stdout=f)  # noqa: S603


def get_sprint_export_command(
    owner: str,
    project: int,
    sprint_field: str,
    points_field: str,
) -> list[str]:
    """
    Generate the command for exporting issue and project data from a Sprint Board.

    TODO(widal001): 2024-10-25 - Replace this with a direct call to the GraphQL API
    https://github.com/HHS/simpler-grants-gov/issues/2590
    """
    # Get the path script and the GraphQL query
    script = PARENT_DIR / "make-graphql-query.sh"
    query_path = PARENT_DIR / "getSprintData.graphql"
    # Load the query
    with open(query_path) as f:
        query = f.read()
    # Create the post-pagination transform jq
    jq = f"""
[
    # iterate through each project item
    .[] |
    # reformat each item
    {{
        project_owner: \"{owner}\",
        project_number: {project},
        issue_title: .content.title,
        issue_url: .content.url,
        issue_parent: .content.parent.url,
        issue_type: .content.issueType.name,
        issue_status: .status.name,
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
    }} |
    # filter for task-level issues
    select(.issue_type != \"Deliverable\")
]
"""
    # Make the command
    command: list[str] = [
        str(script),
        "--batch", "100",
        "--field", f"login={owner}",
        "--field", f"project={project}",
        "--field", f"sprintField='{sprint_field}'",
        "--field", f"pointsField='{points_field}'",
        "--query", f"{query}",
        "--paginate-jq", "'.data.organization.projectV2.items.nodes'",
        "--transform-jq", jq,
    ]

    return command


def export_roadmap_data_to_object(
    owner: str,
    project: int,
    quad_field: str,
    pillar_field: str,
) -> list[dict]:
    """Export deliverable and epic data from GitHub."""
    # get subprocess command
    command = get_roadmap_export_command(owner, project, quad_field, pillar_field)

    # invoke the subprocess command and capture the output
    result = subprocess.run(command, capture_output=True, text=True, check=True) # noqa: S603

    # convert the output to a JSON object
    return json.loads(result.stdout)


def export_roadmap_data_to_file(
    owner: str,
    project: int,
    quad_field: str,
    pillar_field: str,
    output_file: str,
) -> None:
    """Export deliverable and epic data from GitHub."""
    # get subprocess command
    command = get_roadmap_export_command(owner, project, quad_field, pillar_field)

    # invoke the command via a subprocess and write the output to a file
    with open(output_file, "w", encoding="utf-8") as f:
        subprocess.call(command, stdout=f)  # noqa: S603


def get_roadmap_export_command(
    owner: str,
    project: int,
    quad_field: str,
    pillar_field: str,
) -> list[str]:
    """
    Generate the command for exporting deliverable and epic data from GitHub.

    TODO(widal001): 2024-10-25 - Replace this with a direct call to the GraphQL API
    https://github.com/HHS/simpler-grants-gov/issues/2590
    """
    # Get the path script and the GraphQL query
    script = PARENT_DIR / "make-graphql-query.sh"
    query_path = PARENT_DIR / "getRoadmapData.graphql"
    # Load the query
    with open(query_path) as f:
        query = f.read()
    # Create the post-pagination transform jq
    jq = f"""
[
    # iterate through each project item
    .[] |
    # reformat each item
    {{
        project_owner: \"{owner}\",
        project_number: {project},
        issue_title: .content.title,
        issue_url: .content.url,
        issue_parent: .content.parent.url,
        issue_type: .content.issueType.name,
        issue_status: .status.name,
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
    }}

]
"""
    # Make the command
    command: list[str] = [
        str(script),
        "--batch", "100",
        "--field", f"login={owner}",
        "--field", f"project={project}",
        "--field", f"quadField='{quad_field}'",
        "--field", f"pillarField='{pillar_field}'",
        "--query", f"{query}",
        "--paginate-jq", "'.data.organization.projectV2.items.nodes'",
        "--transform-jq", jq,
    ]

    return command
