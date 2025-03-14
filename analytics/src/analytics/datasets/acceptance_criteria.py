"""Implement the AcceptanceCriteriaDataset class."""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Self

import pandas as pd

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_data_as_df_from_object


@dataclass(frozen=True)
class AcceptanceCriteriaTotal:
    """Struct to hold total criteria and total completed criteria."""

    criteria: int = 0
    done: int = 0


class AcceptanceCriteriaType(Enum):
    """Define types of acceptance criteria."""

    ALL = "all"  # in this context "all" means all of the other types listed below
    MAIN = "Acceptance criteria"  # don't change, this maps to string in body content
    METRICS = "Metrics"  # don't change, this maps to string in body content


class AcceptanceCriteriaNestLevel(Enum):
    """Define levels of nested acceptance criteria."""

    ALL = 0
    LEVEL_1 = 1
    LEVEL_2 = 2


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

    def get_totals(
        self,
        ghid: str,
        ac_type: AcceptanceCriteriaType,
        nest_level: AcceptanceCriteriaNestLevel,
    ) -> AcceptanceCriteriaTotal:
        """Get the total number of acceptance criteria and the total number done."""
        # get row for given ghid
        result = self.df[self.df["ghid"] == ghid]
        if result.empty:
            return AcceptanceCriteriaTotal()  # return default instance with 0 values

        # extract raw body content which contains acceptance criteria
        bodycontent = result["bodycontent"].get(result.first_valid_index(), "")

        # parse the raw body content and return the acceptance criteria totals
        return self._parse_body_content(bodycontent, ac_type, nest_level)

    def _parse_body_content(
        self,
        bodycontent: str,
        ac_type: AcceptanceCriteriaType,
        target_nest_level: AcceptanceCriteriaNestLevel,
    ) -> AcceptanceCriteriaTotal:
        """Parse markup into structured acceptance criteria."""
        # strip leading and trailing whitespace
        if not bodycontent.strip():
            return AcceptanceCriteriaTotal()

        # init counters
        total_criteria = 0
        total_done = 0

        # init counters
        total_criteria = 0
        total_done = 0

        # regex to capture markdown sections delineated by H3 headers
        sections = re.split(r"###\s*(.+)\n", bodycontent)

        # regex to parse checkboxes and capture the following
        # - indentation level for nesting
        # - checkbox marker ("- [x]" or "- [ ]")
        # - checkbox status ("x" if checked, space if unchecked)
        # - the text after the checkbox
        checkbox_regex = r"^( *)(- \[([ x])\])\s*(.*)"

        # compile valid section names, excluding AcceptanceCriteriaType.ALL
        valid_sections = {
            item.value
            for item in AcceptanceCriteriaType
            if item != AcceptanceCriteriaType.ALL
        }

        # iterate sections
        for i in range(1, len(sections), 2):
            section_name = sections[i].strip()
            section_body = sections[i + 1].strip() if i + 1 < len(sections) else ""

            # skip section if not in valid AcceptanceCriteriaType values
            if section_name not in valid_sections:
                continue

            # skip section if it's not what we're looking for
            if ac_type != AcceptanceCriteriaType.ALL and section_name != ac_type.value:
                continue

            # if section does not contain a checkbox then skip it
            if "[x]" not in section_body and "[ ]" not in section_body:
                continue

            # find all checkboxes in section
            checkboxes = re.findall(checkbox_regex, section_body, re.MULTILINE)

            # process checkboxes
            criteria, done = self._count_checkboxes(checkboxes, target_nest_level)

            # accumulate totals
            total_criteria += criteria
            total_done += done

        return AcceptanceCriteriaTotal(criteria=total_criteria, done=total_done)

    def _count_checkboxes(
        self,
        checkboxes: list[tuple[str, str, str, str]],
        target_nest_level: AcceptanceCriteriaNestLevel,
    ) -> tuple[int, int]:
        """Count checkboxes and determine nesting levels."""
        total_criteria = 0
        total_done = 0

        # iterate checkboxes
        for indentation, _, is_checked, _ in checkboxes:
            # determine nest level based on indentation
            checkbox_nest_level = (
                AcceptanceCriteriaNestLevel.LEVEL_2
                if indentation and len(indentation) > 0
                else AcceptanceCriteriaNestLevel.LEVEL_1
            )

            # determine whether this level of checkbox should be counted
            if target_nest_level not in {
                AcceptanceCriteriaNestLevel.ALL,
                checkbox_nest_level,
            }:
                continue

            total_criteria += 1
            total_done += is_checked == "x"

        return total_criteria, total_done
