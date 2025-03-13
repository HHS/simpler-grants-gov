"""Implement the AcceptanceCriteriaDataset class."""

import re
from dataclasses import dataclass
from typing import Self

import pandas as pd

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df_from_object


@dataclass(frozen=True)
class AcceptanceCriteriaTotal:
    """Struct to hold total criteria and total completed criteria."""

    criteria: int = 0
    done: int = 0


class AcceptanceCriteriaDataset(BaseDataset):
    """Encapsulate data exported from GitHub."""

    COLUMN_MAP = {
        "issue_url": "ghid",
        "issue_body": "bodycontent",
    }

    @classmethod
    def load_from_json_object(cls, json_data: list) -> Self:
        """
        Instantiate an instance of AcceptanceCriteriaDataset from a JSON object.

        Parameters
        ----------
        json_data: list
            In-memory JSON object containing data exported from GitHub.

        Returns
        -------
        Self:
            An instance of the AcceptanceCriteriaDataset dataset class.

        """
        # Load input dataset
        df = load_json_data_as_df_from_object(
            json_data=json_data,
            column_map=cls.COLUMN_MAP,
            date_cols=None,
        )

        # Transform entity ID columns
        df = cls.transform_entity_id_columns(df)

        return cls(df)

    @classmethod
    def transform_entity_id_columns(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Remove FQDN from URLs in the 'ghid' column."""
        prefix = "https://github.com/"
        for col in ("ghid",):  # Ensure correct iteration
            if col in df.columns:
                df[col] = df[col].str.replace(prefix, "", regex=False)

        return df

    def get_totals(self, ghid: str) -> AcceptanceCriteriaTotal:
        """Get the total number of acceptance criteria and the total number done."""
        # Ensure required columns exist
        if "ghid" not in self.df.columns or "bodycontent" not in self.df.columns:
            return AcceptanceCriteriaTotal()  # return default instance with 0 values

        result = self.df[self.df["ghid"] == ghid]
        if result.empty:
            return AcceptanceCriteriaTotal()  # return default instance with 0 values

        # Safely extract bodycontent
        bodycontent = result["bodycontent"].get(result.first_valid_index(), "")

        # Parse and return the acceptance criteria
        return self._parse_body_content(bodycontent)

    def _parse_body_content(self, bodycontent: str) -> AcceptanceCriteriaTotal:
        """Parse bodycontent into structured acceptance criteria."""
        if not isinstance(bodycontent, str) or not bodycontent.strip():
            return AcceptanceCriteriaTotal()

        # TO DO: insert bodycontent parsing logic
        # Regular expression to capture headers and their corresponding bodies
        regex = r"^(###\s+.*)(\n([\s\S]*?))(?=\n###|\Z)"

        matches = re.findall(regex, bodycontent, re.MULTILINE)

        total_criteria = 0
        total_done = 0

        for item in matches:
            # skip if text under header does not contain a checkbox
            if "[x]" not in item[1] or "[ ]" not in item[1]:
                continue

            # find and capture all checkboxes regardless of state
            checkbox_regex = r"- \[([ x])\]([^-\n]*)"
            checkboxes = re.findall(checkbox_regex, item[1])

            # TO DO: Add depth
            for checkbox in checkboxes:
                total_criteria += 1
                total_done = total_done + 1 if "x" in checkbox[0] else total_done

        return AcceptanceCriteriaTotal(criteria=total_criteria, done=total_done)
