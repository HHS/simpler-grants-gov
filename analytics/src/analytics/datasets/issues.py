"""Transform exported issue data into a flattened list."""

import logging
from enum import Enum

import pandas as pd
from pydantic import BaseModel, Field, computed_field

from analytics.datasets.base import BaseDataset

logger = logging.getLogger(__name__)

# ===============================================================
# Dataset schema and enums
# ===============================================================


class IssueType(Enum):
    """Supported issue types."""

    BUG = "Bug"
    TASK = "Task"
    EPIC = "Epic"
    ENHANCEMENT = "Enhancement"
    DELIVERABLE = "Deliverable"
    NONE = None


class IssueState(Enum):
    """Whether the issue is open or closed."""

    OPEN = "open"
    CLOSED = "closed"


class IssueMetadata(BaseModel):
    """Stores information about issue type and parent (if applicable)."""

    # Project metadata -- attributes about the sprint project board
    project_name: str
    project_ghid: int
    # Issue metadata -- attributes about the issue common to both projects
    issue_title: str
    issue_ghid: str
    issue_parent: str | None
    issue_type: str | None
    issue_is_closed: bool
    issue_opened_at: str
    issue_closed_at: str | None
    # Sprint metadata -- custom fields specific to the sprint board project
    issue_points: int | float | None = Field(default=None)
    issue_status: str | None = Field(default=None)
    sprint_ghid: str | None = Field(default=None)
    sprint_name: str | None = Field(default=None)
    sprint_start: str | None = Field(default=None)
    sprint_length: int | None = Field(default=None)
    sprint_end: str | None = Field(default=None)
    # Roadmap metadata -- custom fields specific to the roadmap project
    quad_ghid: str | None = Field(default=None)
    quad_name: str | None = Field(default=None)
    quad_start: str | None = Field(default=None)
    quad_length: int | None = Field(default=None)
    quad_end: str | None = Field(default=None)
    deliverable_pillar: str | None = Field(default=None)
    # Parent metadata -- attributes about parent issues populated via lookup
    deliverable_ghid: str | None = Field(default=None)
    deliverable_title: str | None = Field(default=None)
    deliverable_status: str | None = Field(default=None)
    epic_ghid: str | None = Field(default=None)
    epic_title: str | None = Field(default=None)

    # See https://docs.pydantic.dev/2.0/usage/computed_fields/
    @computed_field  # type: ignore[misc]
    @property
    def issue_state(self) -> str:
        """Whether the issue is open or closed."""
        if self.issue_is_closed:
            return IssueState.CLOSED.value
        return IssueState.OPEN.value


# ===============================================================
# Dataset class
# ===============================================================


class GitHubIssues(BaseDataset):
    """GitHub issues with metadata about their parents (Epics and Deliverables) and sprints."""

    def __init__(self, df: pd.DataFrame) -> None:
        """Initialize the GitHub Issues dataset."""
        self.opened_col = "issue_opened_at"
        self.closed_col = "issue_closed_at"
        self.points_col = "issue_points"
        self.sprint_col = "sprint_name"
        self.sprint_start_col = "sprint_start"
        self.sprint_end_col = "sprint_end"
        self.project_col = "project_number"
        self.date_cols = [
            self.sprint_start_col,
            self.sprint_end_col,
            self.opened_col,
            self.closed_col,
        ]
        # Convert date cols into dates
        for col in self.date_cols:
            # strip off the timestamp portion of the date
            df[col] = pd.to_datetime(df[col]).dt.floor("d")
        super().__init__(df)

    def sprint_start(self, sprint: str) -> pd.Timestamp:
        """Return the date on which a given sprint started."""
        sprint_mask = self.df[self.sprint_col] == sprint
        return self.df.loc[sprint_mask, self.sprint_start_col].min()

    def sprint_end(self, sprint: str) -> pd.Timestamp:
        """Return the date on which a given sprint ended."""
        sprint_mask = self.df[self.sprint_col] == sprint
        return self.df.loc[sprint_mask, self.sprint_end_col].max()

    @property
    def sprints(self) -> pd.DataFrame:
        """Return the unique list of sprints with their start and end dates."""
        sprint_cols = [self.sprint_col, self.sprint_start_col, self.sprint_end_col]
        return self.df[sprint_cols].drop_duplicates()

    @property
    def current_sprint(self) -> str | None:
        """Return the name of the current sprint, if a sprint is currently active."""
        return self.get_sprint_name_from_date(pd.Timestamp.today().floor("d"))

    def get_sprint_name_from_date(self, date: pd.Timestamp) -> str | None:
        """Get the name of a sprint from a given date, if that date falls in a sprint."""
        # fmt: off
        date_filter = (
            (self.sprints[self.sprint_start_col] < date)  # after sprint start
            & (self.sprints[self.sprint_end_col] >= date)  # before sprint end
        )
        # fmt: on
        matching_sprints = self.sprints.loc[date_filter, self.sprint_col]
        # if there aren't any sprints return None
        if len(matching_sprints) == 0:
            return None
        # if there are, return the first value as a string
        return str(matching_sprints.squeeze())

    def to_dict(self) -> list[dict]:
        """Convert this dataset to a python dictionary."""
        # Temporarily convert date cols into strings before exporting
        for col in self.date_cols:
            self.df[col] = self.df[col].dt.strftime("%Y-%m-%d")
        # Return the dictionary
        export_dict = super().to_dict()
        # Convert date columns back into dates
        for col in self.date_cols:
            self.df[col] = pd.to_datetime(self.df[col]).dt.floor("d")
        return export_dict
