"""Implements the DeliverableTasks dataset

This is a sub-class of BaseDataset that groups 30k ft deliverables with the
tasks needed to complete those delivearable
"""
from typing import Optional, Self
import pandas as pd

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df


class DeliverableTasks(BaseDataset):
    """Stores 30k ft deliverables and the tasks needed to complete them"""

    ISSUE_DATE_COLS = ["created_date", "closed_date"]
    ISSUE_COLUMN_MAP = {
        "number": "issue_number",
        "title": "issue_title",
        "labels": "labels",
        "createdAt": "created_date",
        "closedAt": "closed_date",
    }
    SPRINT_DATE_COLS = ["milestone_due_date"]
    SPRINT_COLUMN_MAP = {
        "content.number": "issue_number",
        "content.type": "type",
        "content.body": "issue_body",
        "assignees": "assignees",
        "content.url": "url",
        "story Points": "points",
        "milestone.title": "milestone",
        "milestone.dueOn": "milestone_due_date",
        "milestone.description": "milestone_description",
    }
    FINAL_COLUMNS = [
        "deliverable_number",
        "deliverable_title",
        "issue_title",
        "issue_number",
        "points",
        "status",
    ]

    @classmethod
    def load_from_json_files(
        cls,
        deliverable_label: str = "deliverable: 30k ft",
        sprint_file: str = "data/sprint-data.json",
        issue_file: str = "data/issue-data.json",
    ) -> Self:
        """Load the input datasets and instantiate the DeliverableTasks class

        Parameters
        ----------
        deliverable_label: str
            The GitHub label used to flag deliverable tickets
        sprint_file: str
            Path to the local copy of sprint data exported from GitHub
        issue_file: str
            Path to the local copy of issue data exported from GitHub

        Returns
        -------
        Self:
            An instance of the DeliverableTasks dataset class
        """
        # load and merge input datasets
        df_sprints = load_json_data_as_df(
            file_path=sprint_file,
            column_map=cls.SPRINT_COLUMN_MAP,
            date_cols=cls.SPRINT_DATE_COLS,
            key_for_nested_items="items",
        )
        df_issues = load_json_data_as_df(
            file_path=issue_file,
            column_map=cls.ISSUE_COLUMN_MAP,
            date_cols=cls.ISSUE_DATE_COLS,
        )
        # join the issues and sprint data and apply transformations
        df = df_issues.merge(df_sprints, on="issue_number", how="left")
        df = cls._apply_transformations(df, deliverable_label)
        return cls(df)

    @classmethod
    def _apply_transformations(
        cls,
        df_all: pd.DataFrame,
        deliverable_label: str,
    ) -> pd.DataFrame:
        """Apply column specific data transformations

        Parameters
        ----------
        df_all: pd.DataFrame
            A dataframe of all issues and their fields from the sprint board
        deliverable_label: str
            The GitHub label used to flag deliverable tickets
        """
        # extract parent issue number from the milestone description
        deliverable_regex = r"(?: deliverable: \#)(?P<parent_issue_number>\d+)"
        df_all["deliverable_number"] = (
            df_all["milestone_description"]
            .str.extract(pat=deliverable_regex, expand=False)
            .astype("Int64")
        )
        # calculate task status
        df_all["status"] = "open"
        is_closed = df_all["closed_date"].isna()
        df_all.loc[is_closed, "status"] = "closed"
        # isolate 30k deliverable issues and rename their cols
        df_all["labels"] = df_all["labels"].apply(pluck_label_name)
        deliverable_mask = df_all["labels"].apply(lambda x: deliverable_label in x)
        deliverable_cols = {
            "issue_number": "deliverable_number",
            "issue_title": "deliverable_title",
        }
        df_deliverable = df_all.loc[deliverable_mask, list(deliverable_cols.keys())]
        df_deliverable = df_deliverable.rename(columns=deliverable_cols)
        # left join to df on "deliverable_number" to get the deliverable title
        df = df_deliverable.merge(df_all, on="deliverable_number", how="left")
        df = df[cls.FINAL_COLUMNS]
        return df


def pluck_label_name(labels: Optional[list]):
    """Reformat the label dictionary to return a list of label names"""
    if labels and isinstance(labels, list):
        return [label["name"] for label in labels]
    return []
