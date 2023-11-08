import json

import pandas as pd
import pytest

from analytics.datasets import github_projects


def json_issue_row(
    issue: int,
    created_at: str = "2023-11-01T00:00:00Z",
    closed_at: str = "2023-11-01T00:00:00Z",
) -> dict:
    """Generate a row of JSON issue data for testing"""
    return {
        "closedAt": closed_at,
        "createdAt": created_at,
        "number": issue,
    }


def json_sprint_row(
    issue: int,
    parent_number: int = -99,
    sprint_name: str = "Sprint 1",
    sprint_date: str = "2023-11-01",
    status: str = "Done",
    story_points: int = 5,
) -> dict:
    """Generate a row of JSON sprint data for testing"""
    return {
        "assignees": ["mickeymouse"],
        "content": {
            "type": "Issue",
            "body": f"Description of test issue {issue}",
            "title": f"Test issue {issue}",
            "number": issue,
            "repository": "HHS/simpler-grants-gov",
            "url": f"https://github.com/HHS/simpler-grants-gov/issues/{issue}",
        },
        "id": "PVTI_lADOABZxns4ASDf3zgJhmCk",
        "labels": ["topic: infra", "project: grants.gov"],
        "linked pull requests": [],
        "milestone": {
            "title": "Sample milestone",
            "description": f"30k ft deliverable: #{parent_number}",
            "dueOn": "2023-10-20T00:00:00Z",
        },
        "repository": "https://github.com/HHS/simpler-grants-gov",
        "sprint": {"title": sprint_name, "startDate": sprint_date, "duration": 14},
        "status": status,
        "story Points": story_points,
        "title": "Test issue 1",
    }


def write_test_data_to_file(data: dict, output_file: str):
    """"""
    with open(output_file, "w") as f:
        f.write(json.dumps(data))


class TestSprintBoard:
    """Tests the SprintBoard data class"""

    ISSUE_FILE = "data/test-issue.json"
    SPRINT_FILE = "data/test-sprint.json"

    def test_get_sprint_start_and_end_dates(self):
        """Sprint start date should be returned correctly"""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=1, sprint_name="Sprint 1", sprint_date="2023-11-01"),
            json_sprint_row(issue=2, sprint_name="Sprint 2", sprint_date="2023-11-16"),
        ]
        issue_data = [json_issue_row(issue=1), json_issue_row(issue=2)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board
        board = github_projects.SprintBoard(self.SPRINT_FILE, self.ISSUE_FILE)
        # validation - check sprint start dates
        assert board.sprint_start("Sprint 1") == pd.Timestamp("2023-11-01", tz="UTC")
        assert board.sprint_start("Sprint 2") == pd.Timestamp("2023-11-16", tz="UTC")
        # validation - check sprint start dates
        assert board.sprint_end("Sprint 1") == pd.Timestamp("2023-11-15", tz="UTC")
        assert board.sprint_end("Sprint 2") == pd.Timestamp("2023-11-30", tz="UTC")

    def test_datasets_joined_on_issue_number_correctly(self):
        """The datasets should be correctly joined on issue number"""
        # setup - create test data for two different sprints
        sprint_data = [
            json_sprint_row(issue=111, sprint_name="Sprint 1"),
            json_sprint_row(issue=222, sprint_name="Sprint 2"),
        ]
        issue_data = [
            json_issue_row(issue=111, created_at="2023-11-03"),
            json_issue_row(issue=222, created_at="2023-11-16"),
        ]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        board = github_projects.SprintBoard(self.SPRINT_FILE, self.ISSUE_FILE)
        df = board.df.set_index("issue_number")
        # validation -- check that both rows are preserved
        assert len(board.df) == 2
        # validation -- check that the sprints are matched to the right issue
        assert df.loc[111]["sprint"] == "Sprint 1"
        assert df.loc[222]["sprint"] == "Sprint 2"
        # validation -- check that the correct created dates are preserved
        assert df.loc[111]["created_date"] == pd.Timestamp("2023-11-03")
        assert df.loc[222]["created_date"] == pd.Timestamp("2023-11-16")

    def test_drop_sprint_rows_that_are_not_found_in_issue_data(self):
        """Sprint board items without a matching issue should be dropped"""
        # setup - create test data for two different sprints
        sprint_data = [json_sprint_row(issue=111), json_sprint_row(issue=222)]
        issue_data = [json_issue_row(issue=111)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        board = github_projects.SprintBoard(self.SPRINT_FILE, self.ISSUE_FILE)
        df = board.df.set_index("issue_number")
        # validation -- check that issue 222 was dropped
        assert len(df) == 1
        assert 222 not in list(df.index)

    @pytest.mark.parametrize(
        "parent_number",
        [222, 333, 444],  # run this test against multiple inputs
    )
    def test_extract_parent_issue_correctly(self, parent_number):
        """The parent issue number should be extracted from the milestone description"""
        # setup - create test data for two different sprints
        sprint_data = [json_sprint_row(issue=111, parent_number=parent_number)]
        issue_data = [json_issue_row(issue=111)]
        # setup - write test data to json files
        write_test_data_to_file(issue_data, self.ISSUE_FILE)
        write_test_data_to_file({"items": sprint_data}, self.SPRINT_FILE)
        # execution - load data into a sprint board and extract the df
        board = github_projects.SprintBoard(self.SPRINT_FILE, self.ISSUE_FILE)
        df = board.df.set_index("issue_number")
        # validation -- check that issue 111's parent_issue_number is 222
        assert df.loc[111]["parent_issue_number"] == parent_number
