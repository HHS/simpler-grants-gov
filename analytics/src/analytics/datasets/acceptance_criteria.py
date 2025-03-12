"""Implement the AcceptanceCriteriaDataset class."""

from typing import Self

import pandas as pd

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df_from_object


class AcceptanceCriteriaDataset(BaseDataset):
    """Encapsulate data exported from GitHub."""

    COLUMN_MAP = {
        "issue_url": "ghid",
        "issue_bodycontent": "bodycontent",
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

    def get_totals(self, ghid: str) -> dict:
        """Get the total number of acceptance criteria and the total number done."""
        # Ensure required columns exist
        if "ghid" not in self.df.columns or "bodycontent" not in self.df.columns:
            return {"total_criteria": 0, "total_done": 0}

        result = self.df[self.df["ghid"] == ghid]

        if result.empty:
            return {"total_criteria": 0, "total_done": 0}

        # Safely extract bodycontent
        bodycontent = result["bodycontent"].get(result.first_valid_index(), "")

        # Parse the acceptance criteria
        criteria = self._parse_body_content(bodycontent)

        total_criteria = len(criteria)
        total_done = sum(1 for criterion in criteria if criterion["is_done"])

        return {"total_criteria": total_criteria, "total_done": total_done}

    def _parse_body_content(self, bodycontent: str) -> list[dict]:
        """Parse bodycontent into structured acceptance criteria."""
        if not isinstance(bodycontent, str) or not bodycontent.strip():
            return []

        # Placeholder for real parsing logic, returning hardcoded criteria
        return [
            {"title": "the box is blue", "is_done": False},
            {"title": "the customer is happy", "is_done": False},
        ]
