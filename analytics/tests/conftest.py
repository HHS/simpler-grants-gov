"""
Configure pytest settings and create reusable fixtures and functions.

Visit pytest docs for more info:
https://docs.pytest.org/en/7.1.x/reference/fixtures.html
"""

import json
from pathlib import Path

import pandas as pd
import pytest

# skips the integration tests in tests/integrations/
# to run the integration tests, invoke them directly: pytest tests/integrations/
collect_ignore = ["integrations"]

DAY_0 = "2023-10-31"
DAY_1 = "2023-11-01"
DAY_2 = "2023-11-02"
DAY_3 = "2023-11-03"
DAY_4 = "2023-11-04"
DAY_5 = "2023-11-05"

LABEL_30K = "deliverable: 30k ft"
LABEL_10K = "deliverable: 10k ft"


def pytest_addoption(parser: pytest.Parser):
    """Add a command line flag to collect tests that require a slack token."""
    parser.addoption(
        "--slack-token-set",
        action="store_true",
        default=False,
        help="Run tests that require a slack token",
    )


class MockSlackbot:
    """Create a mock slackbot issue for unit tests."""

    def upload_files_to_slack_channel(
        self,
        channel_id: str,
        files: list,
        message: str,
    ) -> None:
        """Stubs the corresponding method on the main SlackBot class."""
        assert isinstance(channel_id, str)
        print("Fake posting the following files to Slack with this message:")
        print(message)
        print(files)


@pytest.fixture(name="mock_slackbot")
def mock_slackbot_fixture():
    """Create a mock slackbot instance to stub post_to_slack() method."""
    return MockSlackbot()


def write_test_data_to_file(data: dict | list[dict], output_file: str):
    """Write test JSON data to a file for use in a test."""
    parent_dir = Path(output_file).parent
    parent_dir.mkdir(exist_ok=True, parents=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2))


def json_issue_row(
    issue: int,
    labels: list[str] | None = None,
    created_at: str | None = "2023-11-01T00:00:00Z",
    closed_at: str | None = "2023-11-01T00:00:00Z",
) -> dict:
    """Generate a row of JSON issue data for testing."""
    new_labels = (
        [{"name": label, "id": hash(label)} for label in labels] if labels else []
    )
    return {
        "closedAt": closed_at,
        "createdAt": created_at,
        "number": issue,
        "labels": new_labels,
        "title": f"Issue {issue}",
    }


def json_roadmap_row(
    issue: int,
    deliverable: int,
    status: str = "In Progress",
    labels: list[str] | None = None,
) -> dict:
    """
    Generate a row of JSON roadmap data for testing.

    This is the format returned by the export_project_data() command
    """
    return {
        "assignees": ["mickeymouse"],
        "content": {
            "type": "Issue",
            "body": f"Description of test deliverable {issue}",
            "title": f"Deliverable {issue}",
            "number": issue,
            "repository": "HHS/simpler-grants-gov",
            "url": f"https://github.com/HHS/simpler-grants-gov/issues/{issue}",
        },
        "id": "PVTI_lADOABZxns4ASDf3zgJhmCk",
        "labels": labels or [LABEL_30K],
        "linked pull requests": [],
        "milestone": {
            "title": "Sample milestone",
            "description": "Deliverable for milestone",
            "dueOn": "2023-10-20T00:00:00Z",
        },
        "repository": "https://github.com/HHS/simpler-grants-gov",
        "status": status,
        "deliverable": f"Deliverable {deliverable}",
        "title": f"Deliverable {issue}",
    }


def json_sprint_row(
    issue: int,
    parent_number: int = -99,
    sprint_name: str = "Sprint 1",
    sprint_date: str = "2023-11-01",
    status: str = "Done",
    points: int = 5,
    deliverable: int = 1,
) -> dict:
    """
    Generate a row of JSON sprint data for testing.

    This is the format returned by the export_project_data() function.
    """
    return {
        "assignees": ["mickeymouse"],
        "content": {
            "type": "Issue",
            "body": f"Description of test issue {issue}",
            "title": f"Issue {issue}",
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
        "story Points": points,
        "deliverable": f"Deliverable {deliverable}",
        "title": f"Issue {issue}",
    }


def sprint_row(
    issue: int,
    created: str = DAY_1,
    closed: str | None = None,
    status: str = "In Progress",
    points: int = 1,
    sprint: int = 1,
    sprint_start: str = DAY_1,
    sprint_length: int = 2,
) -> dict:
    """Create a sample row of the SprintBoard dataset."""
    # create timestamp and time delta fields
    sprint_start_ts = pd.Timestamp(sprint_start)
    sprint_duration = pd.Timedelta(days=sprint_length)
    sprint_end_ts = sprint_start_ts + sprint_duration
    created_date = pd.Timestamp(created, tz="UTC")
    closed_date = pd.Timestamp(closed, tz="UTC") if closed else None
    # return the sample record
    return {
        "issue_number": issue,
        "issue_title": f"Issue {issue}",
        "type": "issue",
        "issue_body": f"Description of issue {issue}",
        "status": "Done" if closed else status,
        "assignees": "mickeymouse",
        "labels": [],
        "deliverable": "Deliverable 1",
        "url": f"https://github.com/HHS/simpler-grants-gov/issues/{issue}",
        "points": points,
        "milestone": "Milestone 1",
        "milestone_due_date": sprint_end_ts,
        "milestone_description": "Milestone 1 description",
        "sprint": f"Sprint {sprint}",
        "sprint_start_date": sprint_start_ts,
        "sprint_end_date": sprint_end_ts,
        "sprint_duration": sprint_duration,
        "created_date": created_date,
        "closed_date": closed_date,
    }
