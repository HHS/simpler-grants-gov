"""
Implements the EtlDataset dataset.

This is a sub-class of BaseDataset that models 
quad, deliverable, epic, issue, and sprint data.
"""
from enum import Enum
from typing import Self

import pandas

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df


class EtlEntityType(Enum):
    """ Entity types in the db schema """

    DELIVERABLE = "deliverable"
    EPIC = "epic"
    ISSUE = "issue"
    SPRINT = "sprint"
    QUAD = "quad"


class EtlDataset(BaseDataset):
    """ Models quad, deliverable, epic, issue, and sprint data exported from github """

    COLUMN_MAP = {
        "deliverable_url": "deliverable_ghid",
        "deliverable_title": "deliverable_title",
        "deliverable_pillar": "deliverable_pillar",
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
        "quad_end": "quad_end"
    }


    @classmethod
    def load_from_json_file(cls, file_path) -> Self:
        """
        Loads the input json file and instantiates an instance of EtlDataset.

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
            date_cols=None
        )

        # transform entity id columns
        for col in ('deliverable_ghid', 'epic_ghid', 'issue_ghid', 'issue_parent'):
            df[col] = df[col].apply(lambda x: EtlDataset._remove_fqdn_prefix(x))

        return cls(df)


    @classmethod
    def _remove_fqdn_prefix(cls, value: str) -> str:

        """ Removes the fully qualified domain name prefix (if any) from a string """
        prefix = 'https://github.com/'

        if not isinstance(value, str) or not value.startswith(prefix):
            return value

        return value.replace(prefix, '')


    # QUAD getters

    def get_quad(self, quad_ghid: str) -> pandas.DataFrame:
        """ Fetches data about a given quad """
        query_string = f"quad_ghid == '{quad_ghid}'"
        return self.df.query(query_string).iloc[0]


    def get_quad_ghids(self) -> [str]:
        """ Fetches an array of unique non-null quad ghids """
        df = self.df[self.df.quad_ghid.notnull()]
        return df.quad_ghid.unique()


    # DELIVERABLE getters

    def get_deliverable(self, deliverable_ghid: str) -> pandas.DataFrame:
        """ Fetches data about a given deliverable """
        query_string = f"deliverable_ghid == '{deliverable_ghid}'"
        return self.df.query(query_string).iloc[0]


    def get_deliverable_ghids(self) -> [str]:
        """ Fetches an array of unique non-null deliverable ghids """
        df = self.df[self.df.deliverable_ghid.notnull()]
        return df.deliverable_ghid.unique()


    # SPRINT getters

    def get_sprint(self, sprint_ghid: str) -> pandas.DataFrame:
        """ Fetches data about a given sprint """
        query_string = f"sprint_ghid == '{sprint_ghid}'"
        return self.df.query(query_string).iloc[0]


    def get_sprint_ghids(self) -> [str]:
        """ Fetches an array of unique non-null sprint ghids """
        df = self.df[self.df.sprint_ghid.notnull()]
        return df.sprint_ghid.unique()


    # EPIC getters

    def get_epic(self, epic_ghid: str) -> pandas.DataFrame:
        """ Fetches data about a given epic """
        query_string = f"epic_ghid == '{epic_ghid}'"
        return self.df.query(query_string).iloc[0]


    def get_epic_ghids(self) -> [str]:
        """ Fetches an array of unique non-null epic ghids """
        df = self.df[self.df.epic_ghid.notnull()]
        return df.epic_ghid.unique()


    # ISSUE getters

    def get_issue(self, issue_ghid: str) -> pandas.DataFrame:
        """ Fetches data about a given issue """
        query_string = f"issue_ghid == '{issue_ghid}'"
        return self.df.query(query_string).iloc[0]


    def get_issue_ghids(self) -> [str]:
        """ Fetches an array of unique non-null issue ghids """
        df = self.df[self.df.issue_ghid.notnull()]
        return df.issue_ghid.unique()
