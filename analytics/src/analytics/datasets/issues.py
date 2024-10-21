"""Transform exported issue data into a flattened list."""

from enum import Enum

from pydantic import BaseModel, Field

from analytics.datasets.utils import dump_to_json, load_json_file


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
    issue_type: IssueType
    issue_is_closed: bool
    issue_opened_at: str
    issue_closed_at: str | None
    # Sprint metadata -- custom fields specific to the sprint board project
    issue_points: int | None = Field(default=None)
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


def populate_issue_lookup_table(
    lookup: dict[str, IssueMetadata],
    issues: list[dict],
) -> dict[str, IssueMetadata]:
    """Populate a lookup table that maps issue URLs to their issue type and parent."""
    for issue in issues:
        entry = IssueMetadata(**issue)
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


def run_transformations(
    sprint_file_in: str,
    roadmap_file_in: str,
    task_file_out: str,
) -> None:
    """Run a transformation pipeline to transform issue data to the correct format."""
    # Load sprint and roadmap data
    sprint_data_in = load_json_file(sprint_file_in)
    roadmap_data_in = load_json_file(roadmap_file_in)
    # Populate a lookup table with this data
    lookup = {}
    lookup = populate_issue_lookup_table(lookup, roadmap_data_in)
    lookup = populate_issue_lookup_table(lookup, sprint_data_in)
    # Flatten and write issue level data to output file
    tasks_out = flatten_issue_data(lookup)
    dump_to_json(task_file_out, tasks_out)
