from pathlib import Path

import typer

from milestone_cli.utils import (
    load_milestones_from_yaml_file,
    render_milestone_template,
    create_or_replace_file,
    MilestoneSummary,
)

# path to root of the repository
REPO_ROOT_DIR = Path(__file__).absolute().parent.parent.parent

# path to project directories and files
PROJECT_ROOT = REPO_ROOT_DIR / "milestone-cli"
TEMPLATE_DIR = PROJECT_ROOT / "milestone_cli" / "templates"
DIAGRAM_TEMPLATE = TEMPLATE_DIR / "milestone-diagram.mmd"
SUMMARY_TEMPLATE = TEMPLATE_DIR / "milestone-summary.md"

# external directories and files
MILESTONE_DIR = REPO_ROOT_DIR / "documentation" / "milestones"
MILESTONE_FILE = MILESTONE_DIR / "milestone-summaries.yaml"


app = typer.Typer(name="Milestone CLI")


@app.command(name="hello")
def hello_world(name: str | None = None):
    """Say hello to a given name or Hello World by default"""
    print(f"Hello {name if name else 'world'}")


@app.command(name="validate")
def validate_yaml_file_contents(
    yaml_file: str | None = None,
) -> MilestoneSummary:
    """Loads MilestoneSummary from yaml file and validates contents"""
    if not yaml_file:
        file_path = MILESTONE_FILE
    else:
        file_path = Path(yaml_file).absolute()
    if not file_path.exists():
        print(f"No file found at {file_path}")
        return
    if file_path.suffix not in (".yaml", ".yml"):
        print(f"{file_path} is not a path to a yaml file")
        return
    milestones = load_milestones_from_yaml_file(file_path)
    print("Everything looks good")
    return milestones


@app.command(name="populate")
def populate_output_file(
    kind: str,
    output_file: str,
    yaml_file: str | None = None,
) -> None:
    """Populate either the diagram or the summary file"""
    if kind == "diagram":
        template_path = DIAGRAM_TEMPLATE
    elif kind == "summary":
        template_path = SUMMARY_TEMPLATE
    else:
        print("Command must either be 'populate summary' or 'populate diagram'")
    # load milestones and get output path
    milestones = validate_yaml_file_contents(yaml_file)
    file_path = Path(output_file).absolute()
    print(f"Writing {kind} to {file_path}")
    # create or replace output file with rendered template
    create_or_replace_file(
        file_path=file_path,
        new_contents=render_milestone_template(
            template_path,
            milestones.export_jinja_params(),
        ),
    )
