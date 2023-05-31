from pathlib import Path

import jinja2
import yaml

from milestone_cli.schemas import MilestoneSummary


def load_milestones_from_yaml_file(file_path: Path) -> MilestoneSummary:
    """Load a yaml file and parse the contents into a MilestoneSummary object"""
    with open(file_path) as f:
        contents = yaml.safe_load(f)
    return MilestoneSummary(**contents)


def render_milestone_template(template_path: Path, params: str) -> str:
    """"""
    with open(template_path) as f:
        template = jinja2.Template(f.read())
    return template.render(params=params)
