"""A series of ETL functions to export data from GitHub."""
import shlex
import subprocess
from pathlib import Path


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
    command = f"gh project item-list {project} --format json --owner {owner} -L 1000"
    pipe_command_output_to_file(command, output_file)


def export_issue_data(owner: str, repo: str, output_file: str) -> None:
    """Export and write GitHub issue data to a JSON file."""
    print(f"Exporting issue data from {owner}/{repo} to {output_file}")
    command = (
        f"gh issue list --json number,createdAt,closedAt,labels,title "
        f"-R {owner}/{repo} -L 1000 --state all"
    )
    pipe_command_output_to_file(command, output_file)
