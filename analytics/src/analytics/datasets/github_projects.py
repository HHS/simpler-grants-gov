import json
from typing import Optional

import pandas as pd
from numpy import datetime64

from analytics.datasets.base import BaseDataset


class SprintBoard(BaseDataset):
    """Stores the GitHub project data for the Sprint Planning Board"""

    ISSUE_DATE_COLS = ["created_date", "closed_date"]
    ISSUE_COLUMN_MAP = {
        "number": "issue_number",
        "createdAt": "created_date",
        "closedAt": "closed_date",
    }
    SPRINT_DATE_COLS = ["sprint_start_date", "milestone_due_date"]
    SPRINT_COLUMN_MAP = {
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
        "milestone.description": "milestone_description",
        "sprint.title": "sprint",
        "sprint.startDate": "sprint_start_date",
        "sprint.duration": "sprint_duration",
    }
    SPRINT_COLUMN_MAP

    def __init__(
        self,
        sprint_file: str = "data/sprint-data.json",
        issue_file: str = "data/issue-data.json",
    ) -> None:
        """Intializes the sprint board dataset"""
        # set named columns
        self.opened_col = "created_date"
        self.closed_col = "closed_date"
        self.sprint_col = "sprint"
        self.sprint_start_col = "sprint_start_date"
        self.sprint_end_col = "sprint_end_date"
        # load the input data
        self.df = self._load_data(sprint_file, issue_file)
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

    def _load_data(self, sprint_file: str, issue_file: str) -> pd.DataFrame:
        """Load the input datasets and generate the final dataframe"""
        # load and merge input datasets
        df_sprints = load_json_data_as_df(
            file_path=sprint_file,
            column_map=self.SPRINT_COLUMN_MAP,
            date_cols=self.SPRINT_DATE_COLS,
            key_for_nested_items="items",
        )
        df_issues = load_json_data_as_df(
            file_path=issue_file,
            column_map=self.ISSUE_COLUMN_MAP,
            date_cols=self.ISSUE_DATE_COLS,
        )
        df = df_sprints.merge(df_issues, on="issue_number")
        return self._apply_transformations(df)

    def _apply_transformations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply column specific data transformations"""
        # calculate sprint end date
        df["sprint_duration"] = pd.to_timedelta(df["sprint_duration"], unit="day")
        df["sprint_end_date"] = df["sprint_start_date"] + df["sprint_duration"]
        # extract parent issue number from the milestone description
        parent_issue_regex = r"(?: deliverable: \#)(?P<parent_issue_number>\d+)"
        df["parent_issue_number"] = (
            df["milestone_description"]
            .str.extract(pat=parent_issue_regex, expand=False)
            .astype("Int64")
        )
        return df


def load_json_data_as_df(
    file_path: str,
    column_map: dict,
    date_cols: list[str],
    key_for_nested_items: Optional[str] = None,
) -> pd.DataFrame:
    """Load a file that contains JSON data and format is as a DataFrame

    Parameters
    ----------
    file_path: str
        Path to the JSON file with the exported issue data
    column_map: dict
        Dictionary mapping of existing JSON keys to their new column names
    date_cols: list[str]
        List of columns that need to be converted to date types
    key_for_items: str
        Name of the

    Returns
    -------
    pd.DataFrame
        Pandas dataframe with columns renamed to match the values of the column map

    Notes
    -----
    TODO: @widal001 2023-11-06 - Consider replacing column_map and date_cols with a
        pydantic schema which would also allow us to do type validation and conversions
    """
    # load json data from the local file
    with open(file_path) as f:
        json_data = json.loads(f.read())
    # if the items we want to convert are nested under a key extract them
    if key_for_nested_items:
        json_data = json_data[key_for_nested_items]
    # flatten the nested json into a dataframe
    df = pd.json_normalize(json_data)
    # reorder and rename the columns
    df = df[column_map.keys()]
    df = df.rename(columns=column_map)
    # convert datetime columns to date
    for col in date_cols:
        # strip off the timestamp portion of the date
        df[col] = pd.to_datetime(df[col]).dt.floor("d")
    return df
