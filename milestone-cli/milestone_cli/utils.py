from pathlib import Path

import jinja2
import yaml

from milestone_cli.schemas import MilestoneSummary


def load_milestones_from_yaml_file(file_path: Path) -> MilestoneSummary:
    """Load a yaml file and parse the contents into a MilestoneSummary object"""
    with open(file_path) as f:
        contents = yaml.safe_load(f)
    return MilestoneSummary(**contents)


def render_milestone_template(template_path: Path, params: dict) -> str:
    """Load and populate a milestone template with the parameters provided"""
    template = jinja2.Template(template_path.read_text())
    return template.render(params=params)


def create_or_replace_file(file_path: Path, new_contents: str) -> None:
    """Create or replace a file with the contents provided"""
    # create file and parent directory
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.touch(exist_ok=True)
    # overwrite contents of the file
    file_path.write_text(new_contents)
