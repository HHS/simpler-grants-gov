"""Integrate with GitHub to read and write data from projects and repos."""

import shlex
import subprocess
from pathlib import Path

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
