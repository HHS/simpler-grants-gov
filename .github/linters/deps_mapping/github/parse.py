import re

from data import CliArgs, Dependency, Issue
from diagram import Diagram

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
        status = extract_field_value(issue_data, args.project, "status", default="")
        group = extract_field_value(issue_data, args.project, "pillar", default="Other")

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
        content = item_data.get("content", {})
        issue_type = content.get("issueType", {}).get("name")
        status = content.get("status", {}).get("name", "Todo")
        group = content.get("pillar", {}).get("name", "Other")

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
    issue_repo = issue_data["repository"]["nameWithOwner"]
    issue_number = issue_data["number"]
    issue_slug = f"{issue_repo}#{issue_number}"

    # Clean title by removing group prefix if present
    clean_title = _clean_prefix_from_title(issue_data["title"])

    # Create Issue object
    issue = Issue(
        slug=issue_slug,
        title=clean_title,
        number=issue_number,
        repo=issue_repo,
        body=issue_data.get("body", ""),
        status=status,
        group=group,
    )

    # Extract dependencies from blocking relationships
    dependencies = []
    for blocked_issue in issue_data.get("blocking", {}).get("nodes", []):
        blocked_repo = blocked_issue.get("repository", {}).get("nameWithOwner")
        blocked_number = blocked_issue.get("number")
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
    project_items = issue_data.get("projectItems", {}).get("nodes", [])

    return next(
        (
            field_value.get("name", "")
            for item in project_items
            if (
                item is not None
                and item.get("project", {}).get("number") == project
                and (field_value := item.get(field)) is not None
                and isinstance(field_value, dict)
                and field_value.get("name") is not None
            )
        ),
        default,
    )
