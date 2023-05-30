import pytest

from milestone_cli.utils import load_milestones_from_yaml_file, MilestoneSummary
from tests.conftest import TEST_DIR

FILE_PATH = TEST_DIR / "dummy_milestones.yaml"


@pytest.fixture(scope="module", name="summary")
def loaded_summary_fixture() -> MilestoneSummary:
    """Load the dummy_milestones.yaml file once for tests in this module"""
    return load_milestones_from_yaml_file(FILE_PATH)


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
