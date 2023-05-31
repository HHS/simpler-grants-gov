from pathlib import Path
import pytest
import re

from milestone_cli.utils import (
    load_milestones_from_yaml_file,
    render_milestone_template,
    create_or_replace_file,
    MilestoneSummary,
)
from tests.conftest import TEST_DIR, TEMPLATE_DIR

YAML_PATH = TEST_DIR / "dummy_milestones.yaml"
MARKDOWN_PATH = TEMPLATE_DIR / "milestone-summary.md"
MERMAID_PATH = TEMPLATE_DIR / "milestone-diagram.mmd"


@pytest.fixture(scope="module", name="summary")
def loaded_summary_fixture() -> MilestoneSummary:
    """Load the dummy_milestones.yaml file once for tests in this module"""
    return load_milestones_from_yaml_file(YAML_PATH)


@pytest.fixture(scope="class", name="params")
def jinja_params_fixture(summary: MilestoneSummary) -> dict:
    """Export the summary once for the duration of the class"""
    return summary.export_jinja_params()


class TestLoadMilestonesFromYaml:
    """Tests the load_milestones_from_yaml_file() function"""

    def test_parses_file_correctly(self, summary: MilestoneSummary) -> None:
        """Should return a MilestoneSummary object with correct details"""
        # validation
        assert isinstance(summary, MilestoneSummary)
        assert summary.version == "0.1.0"
        assert len(summary.milestones) == 5

    def test_milestones_order_preserved(self, summary: MilestoneSummary) -> None:
        """Should preserve the order of milestones from the file"""
        # setup
        sections = list(summary.sections.values())
        milestones = list(sections[0].milestones.keys())
        # validation
        assert milestones[0] == "define-goals"
        assert milestones[2] == "measurement-dashboard"


class TestRenderTemplate:
    """Tests the render_milestone_template() function"""

    def test_milestone_summary_markdown(self, params) -> None:
        """Checks that the milestone-summary.md template renders correctly"""
        # execution
        output = render_milestone_template(MARKDOWN_PATH, params)
        print(output)
        # validation - number of sections and milestones
        assert len(re.findall("\n# ", output)) == 3  # 2 sections and appendix
        assert len(re.findall("\n## ", output)) == 6  # 5 milestones and appendix

    def test_milestone_mermaid_diagram(self, params) -> None:
        """Checks that the milestone-diagram.mmd template renders correctly"""
        # execution
        output = render_milestone_template(MERMAID_PATH, params)
        # validation - number of subgraphs and dependencies
        assert len(re.findall("subgraph", output)) == 3  # 2 sections and legend
        assert len(re.findall("--> ", output)) == 6  # 4 milestones and 2 in legend


class TestCreateOrReplaceFile:
    """Tests the create_or_replace_file() function"""

    CONTENTS = """
    # Heading 1
    ### Heading 3
    """

    def test_create_file_if_it_does_not_exist(self, tmp_path: Path):
        """The output file should be created if it does not exist"""
        # setup
        output = tmp_path / "output.md"
        assert output.exists() is False
        # execution
        create_or_replace_file(output, new_contents=self.CONTENTS)
        # validation
        assert output.exists() is True
        assert output.read_text() == self.CONTENTS

    def test_replace_contents_of_existing_file(self, tmp_path: Path):
        """The previous contents of the output file should be replaced"""
        # setup -- create file
        output = tmp_path / "output.md"
        output.touch(exist_ok=True)
        assert output.exists() is True
        # setup -- write contents to be replaced
        old_contents = "Remove this text"
        output.write_text(old_contents)
        output.read_text() == old_contents
        # execution
        create_or_replace_file(output, new_contents=self.CONTENTS)
        # validation
        new_contents = output.read_text()
        assert old_contents not in new_contents
        assert new_contents == self.CONTENTS
