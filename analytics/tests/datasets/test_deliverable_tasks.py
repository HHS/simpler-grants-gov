"""Tests for analytics/datasets/deliverable_tasks.py."""
import numpy as np
from analytics.datasets.deliverable_tasks import DeliverableTasks

from tests.conftest import (
    json_issue_row,
    json_sprint_row,
    write_test_data_to_file,
)


class TestLoadFromJsonFile:
    """Tests the DeliverableTasks.load_from_json_file() class method."""

    LABEL = "deliverable: 30k ft"
    ISSUE_FILE = "data/test-issue.json"
    SPRINT_FILE = "data/test-sprint.json"

    def test_returns_correct_columns(self):
        """The method should return a dataframe with the correct set of columns."""
        # setup - create test data for two different sprints
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
        # setup - create test data for two different sprints
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
        # execution - load data into a sprint board
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
        # setup - create test data for two different sprints
        sprint_data = [json_sprint_row(issue=1, parent_number=2)]
        issue_data = [
            json_issue_row(issue=1, labels=["task", "topic: frontend"]),
            json_issue_row(issue=2, labels=[self.LABEL, "topic: data"]),
            json_issue_row(issue=3, labels=[self.LABEL, "topic: data"]),
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
        df = df.set_index("deliverable_number")
        # validation - check length of results
        assert len(df) == 2
        # validation - check
        assert df.loc[2, "issue_title"] == "Issue 1"
        assert df.loc[3, "issue_title"] is np.nan
