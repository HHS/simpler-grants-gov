"""
Implement the EtlDataset class.

This is a sub-class of BaseDataset that models
quad, deliverable, epic, issue, and sprint data.
"""

from enum import Enum
from typing import Any, Self

import pandas as pd
from numpy.typing import NDArray

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df


class EtlEntityType(Enum):
    """Define entity types in the db schema."""

    DELIVERABLE = "deliverable"
    EPIC = "epic"
    ISSUE = "issue"
    SPRINT = "sprint"
    QUAD = "quad"


class EtlDataset(BaseDataset):
    """Encapsulate data exported from github."""

    COLUMN_MAP = {
        "deliverable_url": "deliverable_ghid",
        "deliverable_title": "deliverable_title",
        "deliverable_pillar": "deliverable_pillar",
        "deliverable_status": "deliverable_status",
        "epic_url": "epic_ghid",
        "epic_title": "epic_title",
        "issue_url": "issue_ghid",
        "issue_title": "issue_title",
        "issue_parent": "issue_parent",
        "issue_type": "issue_type",
        "issue_is_closed": "issue_is_closed",
        "issue_opened_at": "issue_opened_at",
        "issue_closed_at": "issue_closed_at",
        "issue_points": "issue_points",
        "issue_status": "issue_status",
        "sprint_id": "sprint_ghid",
        "sprint_name": "sprint_name",
        "sprint_start": "sprint_start",
        "sprint_length": "sprint_length",
        "sprint_end": "sprint_end",
        "quad_id": "quad_ghid",
        "quad_name": "quad_name",
        "quad_start": "quad_start",
        "quad_length": "quad_length",
        "quad_end": "quad_end",
    }

    @classmethod
    def load_from_json_file(cls, file_path: str) -> Self:
        """
        Load the input json file and instantiates an instance of EtlDataset.

        Parameters
        ----------
        file_path: str
            Path to the local json file containing data exported from GitHub

        Returns
        -------
        Self:
            An instance of the EtlDataset dataset class

        """
        # load input datasets
        df = load_json_data_as_df(
            file_path=file_path,
            column_map=cls.COLUMN_MAP,
            date_cols=None,
        )

        # transform entity id columns
        prefix = "https://github.com/"
        for col in ("deliverable_ghid", "epic_ghid", "issue_ghid", "issue_parent"):
            df[col] = df[col].str.replace(prefix, "")

        return cls(df)

    # QUAD getters

    def get_quad(self, quad_ghid: str) -> pd.Series:
        """Fetch data about a given quad."""
        query_string = f"quad_ghid == '{quad_ghid}'"
        return self.df.query(query_string).iloc[0]

    def get_quad_ghids(self) -> NDArray[Any]:
        """Fetch an array of unique non-null quad ghids."""
        df = self.df[self.df.quad_ghid.notna()]
        return df.quad_ghid.unique()

    # DELIVERABLE getters

    def get_deliverable(self, deliverable_ghid: str) -> pd.Series:
        """Fetch data about a given deliverable."""
        query_string = f"deliverable_ghid == '{deliverable_ghid}'"
        return self.df.query(query_string).iloc[0]

    def get_deliverable_ghids(self) -> NDArray[Any]:
        """Fetch an array of unique non-null deliverable ghids."""
        df = self.df[self.df.deliverable_ghid.notna()]
        return df.deliverable_ghid.unique()

    # SPRINT getters

    def get_sprint(self, sprint_ghid: str) -> pd.Series:
        """Fetch data about a given sprint."""
        query_string = f"sprint_ghid == '{sprint_ghid}'"
        return self.df.query(query_string).iloc[0]

    def get_sprint_ghids(self) -> NDArray[Any]:
        """Fetch an array of unique non-null sprint ghids."""
        df = self.df[self.df.sprint_ghid.notna()]
        return df.sprint_ghid.unique()

    # EPIC getters

    def get_epic(self, epic_ghid: str) -> pd.Series:
        """Fetch data about a given epic."""
        query_string = f"epic_ghid == '{epic_ghid}'"
        return self.df.query(query_string).iloc[0]

    def get_epic_ghids(self) -> NDArray[Any]:
        """Fetch an array of unique non-null epic ghids."""
        df = self.df[self.df.epic_ghid.notna()]
        return df.epic_ghid.unique()

    # ISSUE getters

    def get_issue(self, issue_ghid: str) -> pd.Series:
        """Fetch data about a given issue."""
        query_string = f"issue_ghid == '{issue_ghid}'"
        return self.df.query(query_string).iloc[0]

    def get_issue_ghids(self) -> NDArray[Any]:
        """Fetch an array of unique non-null issue ghids."""
        df = self.df[self.df.issue_ghid.notna()]
        return df.issue_ghid.unique()
