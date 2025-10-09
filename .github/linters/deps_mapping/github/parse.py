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
        # Parse issue and dependencies
        status = extract_status(issue_data, args.project)
        issue, issue_dependencies = _parse_issue_data(issue_data, status)

        # Add to appropriate group
        group = issue.group or "Other"
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
        content = item_data.get("content", {})
        issue_type = content.get("issueType", {}).get("name")

        # Filter issues
        if not content or issue_type != args.issue_type:
            continue

        # Parse issue and dependencies
        status = item_data.get("status", {}).get("name", "Todo")
        issue, issue_dependencies = _parse_issue_data(content, status)

        # Add to appropriate group
        group = issue.group or "Other"
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
) -> tuple[Issue, list[Dependency]]:
    """Parse a single issue's data into an Issue object and its dependencies.

    Args:
        issue_data: The issue data from the API response
        status: The status string for this issue
        args: Command line arguments for filtering

    Returns:
        Tuple of (Issue object, list of Dependencies)
    """
    # Extract issue details
    issue_repo = issue_data["repository"]["nameWithOwner"]
    issue_number = issue_data["number"]
    issue_slug = f"{issue_repo}#{issue_number}"

    # Parse group name from title pattern: "[<group name>] <Issue title>"
    title = issue_data["title"]
    group = "Other"
    match = re.match(r"^\[([^\]]+)\]\s*(.*)$", title)
    if match:
        group = match.group(1).strip()
        # Remove the prefix from the title
        clean_title = match.group(2).strip()
    else:
        clean_title = title

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


def extract_status(issue_data: dict, project: int, default: str = "Todo") -> str:
    """Extract status from project items filtered by project number.

    Defaults to "Todo" if no match found, or if the issue has no project items.

    This is equivalent to the following jq expression:
    (.[] | select(.project.number == $project) | .status.name) // $default
    """
    return next(
        (
            item.get("status", {}).get("name")
            for item in issue_data.get("projectItems", {}).get("nodes", [])
            if item.get("project", {}).get("number") == project
        ),
        default,  # Default value if no match found
    )
