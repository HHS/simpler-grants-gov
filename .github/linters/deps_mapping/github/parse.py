import re
from enum import StrEnum

from data import CliArgs, Dependency, Issue
from diagram import Diagram

# #######################################################
# Constants
# #######################################################


class Defaults(StrEnum):
    """Default values for fields in the GitHub graphql responses.

    Review the queries in the /queries directory to see the fields in context.
    """

    STATUS = "Todo"
    GROUP = "Other"


class Fields(StrEnum):
    """Names of fields in the GitHub graphql responses.

    Review the queries in the /queries directory to see the fields in context.
    """

    # Issue fields
    ISSUE_TYPE = "issueType"
    NUMBER = "number"
    TITLE = "title"
    BODY = "body"
    BLOCKING = "blocking"
    BLOCKED_BY = "blocked_by"
    # Project fields
    PROJECT = "project"
    PROJECT_ITEMS = "projectItems"
    CONTENT = "content"
    STATUS = "status"
    PILLAR = "pillar"
    # Repo fields
    REPO = "repository"
    REPO_NAME = "nameWithOwner"
    # GraphQL fields
    NODES = "nodes"
    NAME = "name"


# #######################################################
# Parse functions
# #######################################################


def parse_repo_response(response_data: list[dict], args: CliArgs) -> Diagram:
    """Parse GraphQL response data into a Diagram."""
    issues: dict[str, Issue] = {}
    subgraphs: dict[str, list[Issue]] = {}
    dependencies = []

    # Extract issues from GraphQL response
    for issue_data in response_data:
        # Extract status and group
        status = extract_field_value(
            issue_data,
            args.project,
            Fields.STATUS,
            default=Defaults.STATUS,
        )
        group = extract_field_value(
            issue_data,
            args.project,
            Fields.PILLAR,
            default=Defaults.GROUP,
        )

        # Filter issues
        if status not in args.statuses:
            continue

        # Parse issue and dependencies
        issue, issue_dependencies = _parse_issue_data(issue_data, status, group)

        # Add to appropriate group
        if group not in subgraphs:
            subgraphs[group] = []
        subgraphs[group].append(issue)

        # Add to issues and dependencies
        issues[issue.slug] = issue
        dependencies.extend(issue_dependencies)

    return Diagram(subgraphs=subgraphs, issues=issues, dependencies=dependencies)


def parse_project_response(response_data: list[dict], args: CliArgs) -> Diagram:
    """Parse project response data into a Diagram with filtering by issue type and state."""
    issues: dict[str, Issue] = {}
    subgraphs: dict[str, list[Issue]] = {}
    dependencies = []

    # Extract issues from project response data
    for item_data in response_data:
        # Extract issue data
        content = item_data.get(Fields.CONTENT, {})
        status = (item_data.get(Fields.STATUS) or {}).get(Fields.NAME, Defaults.STATUS)
        group = (item_data.get(Fields.PILLAR) or {}).get(Fields.NAME, Defaults.GROUP)
        issue_type = (content.get(Fields.ISSUE_TYPE) or {}).get(Fields.NAME)

        # Filter issues
        if not content or issue_type != args.issue_type:
            continue
        if status not in args.statuses:
            continue

        # Parse issue and dependencies
        issue, issue_dependencies = _parse_issue_data(content, status, group)

        # Add to appropriate group
        if group not in subgraphs:
            subgraphs[group] = []
        subgraphs[group].append(issue)

        # Add to issues and dependencies
        issues[issue.slug] = issue
        dependencies.extend(issue_dependencies)

    return Diagram(subgraphs=subgraphs, issues=issues, dependencies=dependencies)


# #######################################################
# Helper functions
# #######################################################


def _parse_issue_data(
    issue_data: dict,
    status: str,
    group: str,
) -> tuple[Issue, list[Dependency]]:
    """Parse a single issue's data into an Issue object and its dependencies.

    Args:
        issue_data: The issue data from the API response
        status: The status string for this issue
        group: The group string for this issue
    Returns:
        Tuple of (Issue object, list of Dependencies)
    """
    # Extract issue details
    issue_repo = issue_data[Fields.REPO][Fields.REPO_NAME]
    issue_number = issue_data[Fields.NUMBER]
    issue_slug = f"{issue_repo}#{issue_number}"

    # Clean title by removing group prefix if present
    clean_title = _clean_prefix_from_title(issue_data[Fields.TITLE])

    # Create Issue object
    issue = Issue(
        slug=issue_slug,
        title=clean_title,
        number=issue_number,
        repo=issue_repo,
        body=issue_data.get(Fields.BODY, ""),
        status=status,
        group=group,
    )

    # Extract dependencies from blocking relationships
    dependencies = []
    for blocked_issue in issue_data.get(Fields.BLOCKING, {}).get(Fields.NODES, []):
        blocked_repo = blocked_issue.get(Fields.REPO, {}).get(Fields.REPO_NAME)
        blocked_number = blocked_issue.get(Fields.NUMBER)
        blocked_slug = f"{blocked_repo}#{blocked_number}"
        # Create dependency: blocked issue is blocked by current issue
        if blocked_repo and blocked_number:
            dependency = Dependency(
                blocked=blocked_slug,
                blocked_by=issue_slug,
            )
            dependencies.append(dependency)

    return issue, dependencies


def _clean_prefix_from_title(title: str) -> str:
    """Remove bracket prefix from title pattern: "[<prefix>] <Issue title>"""
    match = re.match(r"^\[([^\]]+)\]\s*(.*)$", title)
    if match:
        return match.group(2).strip()
    return title


def extract_field_value(
    issue_data: dict,
    project: int,
    field: str,
    default: str = "Todo",
) -> str:
    """Extract field value from project items filtered by project number.

    Defaults to "Todo" if no match found, or if the issue has no project items.

    This is equivalent to the following jq expression:
    (.[] | select(.project.number == $project) | .field.name) // $default
    """
    project_items = issue_data.get(Fields.PROJECT_ITEMS, {}).get(Fields.NODES, [])

    return next(
        (
            field_value.get(Fields.NAME, "")
            for item in project_items
            if (
                item is not None
                and item.get(Fields.PROJECT, {}).get(Fields.NUMBER) == project
                and (field_value := item.get(field)) is not None
                and isinstance(field_value, dict)
                and field_value.get(Fields.NAME) is not None
            )
        ),
        default,
    )
