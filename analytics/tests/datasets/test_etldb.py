"""Tests the code in datasets/etl_dataset.py."""

from analytics.datasets.etl_dataset import EtlDataset


class TestEtlDataset:
    """Test EtlDataset methods."""

    TEST_FILE_1 = "./tests/etldb_test_01.json"

    def test_load_from_json_files(self):
        """Class method should return the correctly transformed data."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        row_count = dataset.df.shape[0]
        col_count = dataset.df.shape[1]
        assert row_count == 23
        assert col_count == 27

    def test_deliverable_fetchers(self):
        """Deliverable fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_deliverable_ghids()
        assert len(unique_ghids) == 4

        ghid = unique_ghids[0]
        assert ghid == "HHS/simpler-grants-gov/issues/2200"

        deliverable = dataset.get_deliverable(ghid)
        assert deliverable["deliverable_title"] == "Search *"

    def test_epic_fetchers(self):
        """Epic fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_epic_ghids()
        assert len(unique_ghids) == 6

        ghid = unique_ghids[0]
        assert ghid == "HHS/simpler-grants-gov/issues/2719"

        epic = dataset.get_epic(ghid)
        assert epic["epic_title"] == "Search API Engagement"

    def test_issue_fetchers(self):
        """Issue fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_issue_ghids()
        assert len(unique_ghids) == 22

        ghid = unique_ghids[0]
        assert ghid == "HHS/simpler-grants-gov/issues/2763"

        issue = dataset.get_issue(ghid)
        assert issue["issue_opened_at"] == "2024-11-07"

        rows = dataset.get_issues(ghid)
        assert len(rows) == 2

    def test_sprint_fetchers(self):
        """Deliverable fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_sprint_ghids()
        assert len(unique_ghids) == 4

        ghid = unique_ghids[0]
        assert ghid == "b8f1831e"

        sprint = dataset.get_sprint(ghid)
        assert sprint["sprint_name"] == "Sprint 1.3"

    def test_quad_fetchers(self):
        """Quad fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_quad_ghids()
        assert len(unique_ghids) == 1

        ghid = unique_ghids[0]
        assert ghid == "93412e1c"

        quad = dataset.get_quad(ghid)
        assert quad["quad_name"] == "Quad 1.1"

    def test_project_fetchers(self):
        """Project fetchers should return expected values."""
        dataset = EtlDataset.load_from_json_file(self.TEST_FILE_1)

        unique_ghids = dataset.get_project_ghids()
        assert len(unique_ghids) == 2

        ghid = unique_ghids[0]
        assert ghid == 17

        project = dataset.get_project(ghid)
        assert project["project_name"] == "HHS"
