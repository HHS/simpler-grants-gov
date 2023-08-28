import shlex
import subprocess


def pipe_command_to_file(command: str, output_file: str):
    with open(output_file, "w") as f:
        subprocess.call(shlex.split(command), stdout=f)


def export_project_data(owner: str, project: int, output_file: str) -> None:
    """Exports and writes GitHub project data to a JSON file"""
    command = f"gh project item-list {project} --format json --owner {owner} -L 1000"
    pipe_command_to_file(command, output_file)


def export_issue_data(repo: str, output_file: str) -> None:
    """Exports and writes GitHub issue data to a JSON file"""
    command = (
        f"gh issue list --json number,createdAt,closedAt -R {repo} -L 1000 --state all"
    )
    pipe_command_to_file(command, output_file)
