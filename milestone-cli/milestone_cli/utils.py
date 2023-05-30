from pathlib import Path

import yaml

from milestone_cli.schemas import MilestoneSummary


def load_milestones_from_yaml_file(file_path: Path) -> MilestoneSummary:
    with open(file_path) as f:
        contents = yaml.safe_load(f)
    return MilestoneSummary(**contents)
