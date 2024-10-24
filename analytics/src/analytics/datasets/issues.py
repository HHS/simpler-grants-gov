"""Transform exported issue data into a flattened list."""

import logging
from enum import Enum
from typing import Self

from pandas import DataFrame
from pydantic import BaseModel, Field, ValidationError

from analytics.datasets.base import BaseDataset
from analytics.datasets.utils import load_json_file

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


class IssueMetadata(BaseModel):
    """Stores information about issue type and parent (if applicable)."""

    # Common metadata -- attributes about the issue common to both projects
    issue_title: str
    issue_url: str
    issue_parent: str | None
    issue_type: str | None
    issue_is_closed: bool
    issue_opened_at: str
    issue_closed_at: str | None
    # Sprint metadata -- custom fields specific to the sprint board project
    issue_points: int | float | None = Field(default=None)
    issue_status: str | None = Field(default=None)
    sprint_id: str | None = Field(default=None)
    sprint_name: str | None = Field(default=None)
    sprint_start: str | None = Field(default=None)
    sprint_length: int | None = Field(default=None)
    sprint_end: str | None = Field(default=None)
    # Roadmap metadata -- custom fields specific to the roadmap project
    quad_id: str | None = Field(default=None)
    quad_name: str | None = Field(default=None)
    quad_start: str | None = Field(default=None)
    quad_length: int | None = Field(default=None)
    quad_end: str | None = Field(default=None)
    deliverable_pillar: str | None = Field(default=None)
    # Parent metadata -- attributes about parent issues populated via lookup
    deliverable_url: str | None = Field(default=None)
    deliverable_title: str | None = Field(default=None)
    epic_url: str | None = Field(default=None)
    epic_title: str | None = Field(default=None)


# ===============================================================
# Dataset class
# ===============================================================


class GitHubIssues(BaseDataset):
    """GitHub issues with metadata about their parents (Epics and Deliverables) and sprints."""

    def __init__(self, df: DataFrame) -> None:
        """Initialize the GitHub Issues dataset."""
        self.opened_col = "issue_created_at"
        self.closed_col = "issue_closed_at"
        self.sprint_col = "sprint_name"
        self.sprint_start_col = "sprint_start"
        self.sprint_end_col = "sprint_end"
        super().__init__(df)

    @classmethod
    def load_from_json_files(
        cls,
        sprint_file: str = "data/sprint-data.json",
        roadmap_file: str = "data/roadmap-data.json",
    ) -> Self:
        """Load GitHubIssues dataset from input json files."""
        # Load sprint and roadmap data
        sprint_data_in = load_json_file(sprint_file)
        roadmap_data_in = load_json_file(roadmap_file)
        # Populate a lookup table with this data
        lookup: dict = {}
        lookup = populate_issue_lookup_table(lookup, roadmap_data_in)
        lookup = populate_issue_lookup_table(lookup, sprint_data_in)
        # Flatten and write issue level data to output file
        issues = flatten_issue_data(lookup)
        return cls(DataFrame(data=issues))


# ===============================================================
# Transformation helper functions
# ===============================================================


def populate_issue_lookup_table(
    lookup: dict[str, IssueMetadata],
    issues: list[dict],
) -> dict[str, IssueMetadata]:
    """Populate a lookup table that maps issue URLs to their issue type and parent."""
    for i, issue in enumerate(issues):
        try:
            entry = IssueMetadata.model_validate(issue)
        except ValidationError as err:  # noqa: PERF203
            logger.error("Error with row %d", i)  # noqa: TRY400
            logger.info("Error: %s", err)
            continue
        lookup[entry.issue_url] = entry
    return lookup


def get_parent_with_type(
    child_url: str,
    lookup: dict[str, IssueMetadata],
    type_wanted: IssueType,
) -> IssueMetadata | None:
    """
    Traverse the lookup table to find an issue's parent with a specific type.

    This is useful if we have multiple nested issues, and we want to find the
    top level deliverable or epic that a given task or bug is related to.
    """
    # Get the initial child issue and its parent (if applicable) from the URL
    child = lookup.get(child_url)
    if not child:
        err = f"Lookup doesn't contain issue with url: {child_url}"
        raise ValueError(err)
    if not child.issue_parent:
        return None

    # Travel up the issue hierarchy until we:
    #  - Find a parent issue with the desired type
    #  - Get to an issue without a parent
    #  - Have traversed 5 issues (breaks out of issue cycles)
    max_traversal = 5
    parent_url = child.issue_parent
    for _ in range(max_traversal):
        parent = lookup.get(parent_url)
        # If no parent is found, return None
        if not parent:
            return None
        # If the parent matches the desired type, return it
        if IssueType(parent.issue_type) == type_wanted:
            return parent
        # If the parent doesn't have a its own parent, return None
        if not parent.issue_parent:
            return None
        # Otherwise update the parent_url to "grandparent" and continue
        parent_url = parent.issue_parent

    # Return the URL of the parent deliverable (or None)
    return None


def flatten_issue_data(lookup: dict[str, IssueMetadata]) -> list[dict]:
    """Flatten issue data and inherit data from parent epic an deliverable."""
    result: list[dict] = []
    for issue in lookup.values():
        # If the issue is a deliverable or epic, move to the next one
        if IssueType(issue.issue_type) in [IssueType.DELIVERABLE, IssueType.EPIC]:
            continue

        # Get the parent deliverable, if the issue has one
        deliverable = get_parent_with_type(
            child_url=issue.issue_url,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        if deliverable:
            # Set deliverable metadata
            issue.deliverable_title = deliverable.issue_title
            issue.deliverable_url = deliverable.issue_url
            issue.deliverable_pillar = deliverable.deliverable_pillar
            # Set quad metadata
            issue.quad_id = deliverable.quad_id
            issue.quad_name = deliverable.quad_name
            issue.quad_start = deliverable.quad_start
            issue.quad_end = deliverable.quad_end
            issue.quad_length = deliverable.quad_length

        # Get the parent epic, if the issue has one
        epic = get_parent_with_type(
            child_url=issue.issue_url,
            lookup=lookup,
            type_wanted=IssueType.EPIC,
        )
        if epic:
            issue.epic_title = epic.issue_title
            issue.epic_url = epic.issue_url

        # Add the issue to the results
        result.append(issue.__dict__)

    # Return the results
    return result
