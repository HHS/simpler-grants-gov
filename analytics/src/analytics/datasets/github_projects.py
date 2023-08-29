import json

import pandas as pd
from numpy import datetime64

from analytics.datasets.base import BaseDataset


class SprintBoard(BaseDataset):
    """Stores the GitHub project data for the Sprint Planning Board"""

    def __init__(
        self,
        project_file: str = "data/sprint-data.json",
        issue_file: str = "data/issue-data.json",
    ) -> None:
        """"""
        # set named columns
        self.opened_col = "created_date"
        self.closed_col = "closed_date"
        self.sprint_col = "sprint"
        self.sprint_start_col = "sprint_start_date"
        self.sprint_end_col = "sprint_end_date"
        # load the input data
        self.df = self.load_data(project_file, issue_file)
        # initialize the parent class
        super().__init__()

    def sprint_start(self, sprint: str) -> datetime64:
        """Return the date on which a given sprint started"""
        sprint_mask = self.df[self.sprint_col] == sprint
        sprint_start = self.df.loc[sprint_mask, self.sprint_start_col].min()
        sprint_start = sprint_start.tz_localize("UTC")
        return sprint_start

    def sprint_end(self, sprint: str) -> datetime64:
        """Return the date on which a given sprint ended"""
        sprint_mask = self.df[self.sprint_col] == sprint
        sprint_end = self.df.loc[sprint_mask, self.sprint_end_col].max()
        sprint_end = sprint_end.tz_localize("UTC")
        return sprint_end

    def load_data(self, project_file: str, issue_file: str) -> pd.DataFrame:
        """Load the input datasets and generate the final dataframe"""
        # load and merge input datasets
        df_sprints = load_project_data(project_file)
        df_issues = load_issue_data(issue_file)
        return df_sprints.merge(df_issues, on="issue_number")


def load_issue_data(file_path: str) -> pd.DataFrame:
    issue_cols = {
        "number": "issue_number",
        "createdAt": "created_date",
        "closedAt": "closed_date",
    }
    # load issue data from the local file
    with open(file_path) as f:
        issue_data = json.loads(f.read())
    # flatten the nested json into a dataframe
    df = pd.json_normalize(issue_data)
    # reorder and rename the columns
    df = df[issue_cols.keys()]
    df = df.rename(columns=issue_cols)
    # convert datetime columns to date
    date_cols = ["created_date", "closed_date"]
    for col in date_cols:
        # strip off the timestamp portion of the date
        df[col] = pd.to_datetime(df[col]).dt.floor("d")
    return df


def load_project_data(file_path: str) -> pd.DataFrame:
    # load sprint data
    project_cols = {
        "content.number": "issue_number",
        "title": "issue_title",
        "content.type": "type",
        "content.body": "issue_body",
        "status": "status",
        "assignees": "assignees",
        "labels": "labels",
        "content.url": "url",
        "story Points": "story_points",
        "milestone.title": "milestone",
        "milestone.dueOn": "milestone_due_date",
        "sprint.title": "sprint",
        "sprint.startDate": "sprint_start_date",
        "sprint.duration": "sprint_duration",
    }
    with open(file_path) as f:
        sprint_data = json.loads(f.read())["items"]
    # flatten the nested json into a dataframe
    df = pd.json_normalize(sprint_data)
    # reorder and rename the columns
    df = df[project_cols.keys()]
    df = df.rename(columns=project_cols)
    # convert date columns
    date_cols = ["sprint_start_date", "milestone_due_date"]
    for col in date_cols:
        # strip off the timestamp portion of the date
        df[col] = pd.to_datetime(df[col]).dt.floor("d")
    # calculate sprint end
    df["sprint_duration"] = pd.to_timedelta(df["sprint_duration"], unit="day")
    df["sprint_end_date"] = df["sprint_start_date"] + df["sprint_duration"]
    return df
