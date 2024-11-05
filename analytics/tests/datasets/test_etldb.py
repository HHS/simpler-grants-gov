"""Tests the code in datasets/etl_dataset.py."""

from pathlib import Path

from analytics.datasets.etl_dataset import EtlDataset


class TestEtlDataset:
    """Test EtlDataset methods."""

    TEST_FILE_1 = (
        str(Path(__file__).resolve().parent.parent.parent) + "/data/test-etl-01.json"
    )

    def test_load_from_json_files(self):
        """Class method should return the correctly transformed data."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        row_count = dataset.df.shape[0]
        col_count = dataset.df.shape[1]
        assert row_count == 22
        assert col_count == 24

    def test_deliverable_fetchers(self):
        """Deliverable fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_deliverable_ghids()
        assert len(unique_ghids) == 2

        ghid = unique_ghids[0]
        assert ghid == "agilesix/simpler-grants-sandbox/issues/2"

        deliverable = dataset.get_deliverable(ghid)
        assert deliverable["deliverable_title"] == "Opportunity listing page"

    def test_epic_fetchers(self):
        """Epic fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_epic_ghids()
        assert len(unique_ghids) == 4

        ghid = unique_ghids[0]
        assert ghid == "agilesix/simpler-grants-sandbox/issues/8"

        epic = dataset.get_epic(ghid)
        assert epic["epic_title"] == "Deploy opportunity listing behind a feature flag"

    def test_issue_fetchers(self):
        """Issue fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_issue_ghids()
        assert len(unique_ghids) == 22

        ghid = unique_ghids[0]
        assert ghid == "agilesix/simpler-grants-sandbox/issues/46"

        issue = dataset.get_issue(ghid)
        assert issue["issue_opened_at"] == "2024-09-27T15:29:37Z"

    def test_sprint_fetchers(self):
        """Deliverable fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_sprint_ghids()
        assert len(unique_ghids) == 5

        ghid = unique_ghids[0]
        assert ghid == "74402b12"

        sprint = dataset.get_sprint(ghid)
        assert sprint["sprint_name"] == "Sprint 2"

    def test_quad_fetchers(self):
        """Quad fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_quad_ghids()
        assert len(unique_ghids) == 1

        ghid = unique_ghids[0]
        assert ghid == "de5f962b"

        quad = dataset.get_quad(ghid)
        assert quad["quad_name"] == "BY1 Quad 1"
