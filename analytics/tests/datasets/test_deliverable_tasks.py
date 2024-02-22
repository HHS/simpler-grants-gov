"""Tests for analytics/datasets/deliverable_tasks.py."""
import numpy as np  # noqa: I001

from analytics.datasets.deliverable_tasks import DeliverableTasks
from tests.conftest import (
    DAY_1,
    LABEL_10K,
    LABEL_30K,
    json_issue_row,
    json_sprint_row,
    json_roadmap_row,
    write_test_data_to_file,
)


class TestLoadFromJsonFile:
    """Tests the DeliverableTasks.load_from_json_file() class method."""

    LABEL = LABEL_30K
    ISSUE_FILE = "data/test-issue.json"
    SPRINT_FILE = "data/test-sprint.json"

    def test_returns_correct_columns(self):
        """The method should return a dataframe with the correct set of columns."""
        # setup - create test data for two different deliverables
        sprint_data = [json_sprint_row(issue=1, parent_number=2)]
        issue_data = [
            json_issue_row(issue=1, labels=["task"]),
            json_issue_row(issue=2, labels=[self.LABEL]),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board
        tasks = DeliverableTasks.load_from_json_files(
            deliverable_label=self.LABEL,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
        )
        # validation - check output columns
        assert list(tasks.df.columns) == [
            "deliverable_number",
            "deliverable_title",
            "issue_title",
            "issue_number",
            "points",
            "status",
        ]

    def test_join_correctly_on_deliverable_number(self):
        """Tasks should be joined to 30k deliverables on deliverable number."""
        # setup - create test data for two different deliverables
        sprint_data = [
            json_sprint_row(issue=1, parent_number=4),
            json_sprint_row(issue=2, parent_number=4),
            json_sprint_row(issue=3, parent_number=5),
        ]
        issue_data = [
            json_issue_row(issue=1, labels=["task"]),
            json_issue_row(issue=2, labels=["task"]),
            json_issue_row(issue=3, labels=["task"]),
            json_issue_row(issue=4, labels=[self.LABEL]),
            json_issue_row(issue=5, labels=[self.LABEL]),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data
        df = DeliverableTasks.load_from_json_files(
            deliverable_label=self.LABEL,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - check length of results
        assert len(df) == 3
        # validation - check
        assert df.loc[1, "deliverable_title"] == "Issue 4"
        assert df.loc[2, "deliverable_title"] == "Issue 4"
        assert df.loc[3, "deliverable_title"] == "Issue 5"

    def test_keep_30k_deliverables_without_tasks(self):
        """30k deliverable tickets without tasks should still appear in the dataset."""
        # setup - create test data for two different deliverables
        sprint_data = [json_sprint_row(issue=1, parent_number=2)]
        issue_data = [
            json_issue_row(issue=1, labels=["task", "topic: frontend"]),
            json_issue_row(issue=2, labels=[self.LABEL, "topic: data"]),
            json_issue_row(issue=3, labels=[self.LABEL, "topic: data"]),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data
        df = DeliverableTasks.load_from_json_files(
            deliverable_label=self.LABEL,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
        ).df
        df = df.set_index("deliverable_number")
        # validation - check length of results
        assert len(df) == 2
        # validation - check
        assert df.loc[2, "issue_title"] == "Issue 1"
        assert df.loc[3, "issue_title"] is np.nan

    def test_status_is_closed_if_closed_date_is_none(self):
        """The status should be 'closed' if closed_date field is None."""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, parent_number=3),
            json_sprint_row(issue=2, parent_number=3),
        ]
        issue_data = [
            json_issue_row(issue=1, labels=["task"], closed_at=DAY_1),  # closed
            json_issue_row(issue=2, labels=["task"], closed_at=None),  # open
            json_issue_row(issue=3, labels=[self.LABEL], closed_at=None),  # deliverable
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board
        df = DeliverableTasks.load_from_json_files(
            deliverable_label=self.LABEL,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - check length of results
        assert len(df) == 2
        # validation - check
        assert df.loc[1, "status"] == "closed"
        assert df.loc[2, "status"] == "open"


class TestLoadFromJsonFilesWithRoadmapData:
    """Test the load_from_json_files_with_roadmap_data() method."""

    LABEL_30K = LABEL_30K
    LABEL_10K = LABEL_10K
    ISSUE_FILE = "data/test-issue.json"
    SPRINT_FILE = "data/test-sprint.json"
    ROADMAP_FILE = "data/test-roadmap.json"

    def test_returns_correct_columns(self):
        """Return the correct columns in DeliverableTasks."""
        # setup - create test data for two different deliverables
        sprint_data = [
            json_sprint_row(issue=1, deliverable=4),
            json_sprint_row(issue=2, deliverable=4),
            json_sprint_row(issue=3, deliverable=5),
        ]
        issue_data = [
            json_issue_row(issue=1),
            json_issue_row(issue=2),
            json_issue_row(issue=3),
        ]
        roadmap_data = [
            json_roadmap_row(issue=4, deliverable=4, status="Planning"),
            json_roadmap_row(issue=5, deliverable=5, status="In progress"),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        write_test_data_to_file({"items": roadmap_data}, self.ROADMAP_FILE)
        # execution - load data
        df = DeliverableTasks.load_from_json_files_with_roadmap_data(
            deliverable_label=self.LABEL_30K,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
            roadmap_file=self.ROADMAP_FILE,
        ).df
        # validation - check length of results
        assert len(df) == 3
        # validation - check output columns
        assert list(df.columns) == [
            "deliverable_number",
            "deliverable_title",
            "issue_title",
            "issue_number",
            "points",
            "status",
        ]

    def test_status_is_closed_if_closed_date_is_none(self):
        """The status should be 'closed' if closed_date field is None."""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, deliverable=3),
            json_sprint_row(issue=2, deliverable=3),
        ]
        issue_data = [
            json_issue_row(issue=1, closed_at=DAY_1),  # closed
            json_issue_row(issue=2, closed_at=None),  # open
        ]
        roadmap_data = [
            json_roadmap_row(issue=3, deliverable=3, status="Planning"),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        write_test_data_to_file({"items": roadmap_data}, self.ROADMAP_FILE)
        # execution - load data into a sprint board
        df = DeliverableTasks.load_from_json_files_with_roadmap_data(
            deliverable_label=self.LABEL_30K,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
            roadmap_file=self.ROADMAP_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - check length of results
        assert len(df) == 2
        # validation - check
        assert df.loc[1, "status"] == "closed"
        assert df.loc[2, "status"] == "open"

    def test_exclude_10k_deliverables_from_results(self):
        """
        10k deliverables should not be included in the final dataset.

        If we don't drop the 10k deliverables, then joining on "deliverable"
        will result in a fan out that duplicates task-level issues
        """
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, deliverable=3),
            json_sprint_row(issue=2, deliverable=3),
        ]
        issue_data = [
            json_issue_row(issue=1),
            json_issue_row(issue=2),
        ]
        roadmap_data = [  # exclude the second item from final dataset
            json_roadmap_row(issue=3, deliverable=3, labels=[self.LABEL_30K]),
            json_roadmap_row(issue=4, deliverable=3, labels=[self.LABEL_10K]),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        write_test_data_to_file({"items": roadmap_data}, self.ROADMAP_FILE)
        # execution
        df = DeliverableTasks.load_from_json_files_with_roadmap_data(
            deliverable_label=self.LABEL_30K,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
            roadmap_file=self.ROADMAP_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - confirm 10k was dropped and join didn't produce a fan out
        assert len(df) == 2
        assert list(df.index) == [1, 2]

    def test_exclude_deliverables_without_labels(self):
        """
        Deliverables that don't have labels should also be excluded.

        This test reproduces a bug that caused this function to break when row
        didn't have labels.
        """
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, deliverable=3),
            json_sprint_row(issue=2, deliverable=4),
        ]
        issue_data = [
            json_issue_row(issue=1),
            json_issue_row(issue=2),
        ]
        roadmap_data = [  # exclude the second item from final dataset
            json_roadmap_row(issue=3, deliverable=3, labels=[self.LABEL_30K]),
            json_roadmap_row(issue=4, deliverable=4, labels=[self.LABEL_30K]),
        ]
        # remove the labels for the second deliverable to reproduce bug
        roadmap_data[1]["labels"] = np.nan
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        write_test_data_to_file({"items": roadmap_data}, self.ROADMAP_FILE)
        # execution
        df = DeliverableTasks.load_from_json_files_with_roadmap_data(
            deliverable_label=self.LABEL_30K,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
            roadmap_file=self.ROADMAP_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - assert the second deliverable was dropped
        assert len(df) == 1
        assert df.loc[1, "deliverable_number"] == 3

    def test_exclude_deliverables_without_deliverable_col_set(self):
        """
        Deliverables that don't have the "deliverable" column set.

        This test reproduces a bug that incorrectly joins on null values.
        """
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, deliverable=3),
            json_sprint_row(issue=2, deliverable=4),
        ]
        issue_data = [
            json_issue_row(issue=1),
            json_issue_row(issue=2),
        ]
        roadmap_data = [  # exclude the second item from final dataset
            json_roadmap_row(issue=3, deliverable=3),
            json_roadmap_row(issue=4, deliverable=4),
        ]
        # set the deliverable column to None to reproduce bug
        sprint_data[1]["deliverable"] = np.nan
        roadmap_data[1]["deliverable"] = np.nan
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        write_test_data_to_file({"items": roadmap_data}, self.ROADMAP_FILE)
        # execution
        df = DeliverableTasks.load_from_json_files_with_roadmap_data(
            deliverable_label=self.LABEL_30K,
            sprint_file=self.SPRINT_FILE,
            issue_file=self.ISSUE_FILE,
            roadmap_file=self.ROADMAP_FILE,
        ).df
        df = df.set_index("issue_number")
        # validation - assert the second deliverable was dropped
        assert len(df) == 1
        assert df.loc[1, "deliverable_number"] == 3
