import json


def write_test_data_to_file(data: dict, output_file: str):
    """Writes test JSON data to a file for use in a test"""
    with open(output_file, "w") as f:
        f.write(json.dumps(data, indent=2))


def json_issue_row(
    issue: int,
    labels: list[str] = [],
    created_at: str = "2023-11-01T00:00:00Z",
    closed_at: str = "2023-11-01T00:00:00Z",
) -> dict:
    """Generate a row of JSON issue data for testing"""
    return {
        "closedAt": closed_at,
        "createdAt": created_at,
        "number": issue,
        "labels": labels,
        "title": "Issue {issue}",
    }


def json_sprint_row(
    issue: int,
    parent_number: int = -99,
    sprint_name: str = "Sprint 1",
    sprint_date: str = "2023-11-01",
    status: str = "Done",
    points: int = 5,
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
        "story Points": points,
        "title": "Test issue 1",
    }
