import re
import json
import pathlib

from data import CliArgs, Dependency, Issue
from diagram import Diagram
from utils import (
    REPO_ROOT,
    err,
    err_and_exit,
    get_env,
    get_query_from_file,
    log,
    make_request,
    update_markdown_section,
)


README_PATH = REPO_ROOT / "README.md"
GITHUB_API_TOKEN = get_env("GITHUB_API_TOKEN")

# #######################################################
# Mapping functions
# #######################################################


def map_issue_dependencies(args: CliArgs) -> None:
    """Parse dependencies for a single issue."""
    # Make the GraphQL request
    diagram = fetch_and_parse_issues_from_repo(args)

    # Update each issue with the dependency diagram
    for issue, issue_data in diagram.issues.items():
        issue_url = f"https://github.com/{issue_data.repo}/issues/{issue_data.number}"
        issue_diagram = diagram.extract_issue_diagram(issue)
        diagram_content = f"""
Here are the upstream and downstream dependencies for this issue:

```mermaid
{issue_diagram.generate_diagram(group_issues=False)}
```
"""
        issue_body = update_markdown_section(
            content=issue_data.body,
            section="Dependencies",
            new_content=diagram_content,
        )
        if args.dry_run:
            log(f"[DRY RUN] Would update GitHub issue {issue_url}")
            log(f"[DRY RUN] New issue body:\n{issue_body}")
            continue
        log(f"Updating GitHub issue {issue_url}")
        update_github_issue(issue_data.repo, issue_data.number, issue_body)


def map_repo_dependencies(args: CliArgs) -> None:
    """Parse issue dependencies for a given repository."""
    # Make the GraphQL request
    diagram = fetch_and_parse_issues_from_repo(args)
    write_diagram_to_readme(diagram, README_PATH)


def write_diagram_to_readme(
    diagram: Diagram,
    readme_path: pathlib.Path,
) -> None:
    """Write the diagram to the README file, updating the dependency graph section."""
    try:
        # Read the current README content
        with open(readme_path, "r", encoding="utf-8") as f:
            readme_content = f.read()

        # Generate the diagram content
        section_content = f"""
Here are the dependencies between features on our co-planning board:

```mermaid
{diagram.generate_diagram()}
```
"""

        # Update the dependency graph section
        updated_content = update_markdown_section(
            content=readme_content,
            section="Feature dependencies",
            new_content=section_content,
        )

        # Write the updated content back to the README
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        log(f"Successfully updated {readme_path} with dependency diagram")

    except FileNotFoundError:
        err_and_exit(f"README file not found: {readme_path}")
    except Exception as e:
        err_and_exit(f"Failed to update README: {e}")


# #######################################################
# Parsing functions
# #######################################################


def parse_graphql_response(response_data: list[dict], args: CliArgs) -> Diagram:
    """Parse GraphQL response data into a Diagram."""
    issues: dict[str, Issue] = {}
    subgraphs: dict[str, list[Issue]] = {}
    dependencies = []

    # Extract issues from GraphQL response
    for issue_data in response_data:
        # Extract issue number and repository
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
            status=extract_status(issue_data, args.project),
            group=group,
        )

        # Add to appropriate group
        if group not in subgraphs:
            subgraphs[group] = []
        subgraphs[group].append(issue)

        # Add to issues
        issues[issue_slug] = issue

        # Extract dependencies from blocking relationships
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

    return Diagram(subgraphs=subgraphs, issues=issues, dependencies=dependencies)


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


# #######################################################
# Request functions
# #######################################################


def fetch_and_parse_issues_from_repo(args: CliArgs) -> Diagram:
    """Fetch and parse issues from a GitHub repository."""
    query = get_query_from_file("fetch-repo.graphql")
    payload: dict = {
        "org": args.org,
        "repo": args.repo,
        "issueType": args.issue_type,
    }
    if args.labels:
        log(f"Fetching issues with labels: {args.labels}")
        payload["labels"] = args.labels
    issues = make_paginated_graphql_request(query, payload, args.batch)
    return parse_graphql_response(issues, args)


def update_github_issue(
    repoWithOwner: str,
    issue_number: int,
    issue_body: str,
) -> None:
    """Update a GitHub issue."""
    log(f"Updating GitHub issue #{issue_number} in {repoWithOwner}")

    headers = {
        "Authorization": f"token {GITHUB_API_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{repoWithOwner}/issues/{issue_number}"

    # Prepare the data to update
    data = {"body": issue_body}

    # Make PATCH request to update the issue
    response = make_request(url, headers, method="PATCH", data=json.dumps(data))

    if response:
        log(f"Successfully updated GitHub issue #{issue_number}")
    else:
        err(f"Failed to update GitHub issue #{issue_number}")


def make_graphql_request(query: str, variables: dict) -> dict:
    """Make a GraphQL request."""
    # Prepare the request
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"token {GITHUB_API_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }
    # Make the request
    response = make_request(
        url,
        headers,
        method="POST",
        data=json.dumps({"query": query, "variables": variables}),
    )
    # Check for GraphQL errors
    if "errors" in response:
        log(f"GraphQL errors: {response['errors']}")
        return {}
    # Check if we have data
    if "data" not in response:
        log("No data in GraphQL response")
        return {}
    return response


def make_paginated_graphql_request(
    query: str,
    variables: dict,
    batch: int,
    path_to_nodes: list[str] = ["repository", "issues"],
) -> list:
    """Make a paginated GraphQL request and return a list of nodes."""
    # Prepare variables for pagination
    variables["batch"] = batch
    cursor = None
    all_nodes = []

    # Continue to fetch nodes until there are no more pages
    while True:
        # Add cursor to variables if we have one
        if cursor:
            variables["cursor"] = cursor

        # Make the GraphQL request using the helper function
        response = make_graphql_request(query, variables)
        if not response:
            return []
        data = response["data"]

        # Navigate to the paginated data using the path
        paginated_data = data
        for key in path_to_nodes:
            paginated_data = paginated_data.get(key)
            if paginated_data is None:
                err_and_exit(
                    message=f"Unexpected GraphQL response structure: "
                    f"missing key '{key}' in path {path_to_nodes}",
                )

        # Add current batch to all_data
        nodes = paginated_data.get("nodes")
        if nodes:
            all_nodes.extend(nodes)

        # Check if there are more pages
        page_info = paginated_data.get("pageInfo", {})
        if page_info.get("hasNextPage"):
            cursor = page_info.get("endCursor")
        else:
            break

    return all_nodes
