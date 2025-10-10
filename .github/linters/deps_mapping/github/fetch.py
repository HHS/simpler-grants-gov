import json

from data import CliArgs
from utils import get_env, get_query_from_file, log, make_request


GITHUB_API_TOKEN = get_env("GITHUB_API_TOKEN")
GITHUB_API_URL = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {GITHUB_API_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
}

# #######################################################
# GraphQL helper functions
# #######################################################


def make_graphql_request(query: str, variables: dict) -> dict:
    """Make a GraphQL request."""
    # Prepare the request
    url = f"{GITHUB_API_URL}/graphql"
    # Make the request
    response = make_request(
        url,
        HEADERS,
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
                from utils import err_and_exit

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


# #######################################################
# Fetch functions
# #######################################################


def fetch_issues_from_repo(args: CliArgs) -> list:
    """Fetch issues from a GitHub repository."""
    query = get_query_from_file("fetch-repo.graphql")
    payload: dict = {
        "org": args.org,
        "repo": args.repo,
        "issueType": args.issue_type,
    }
    if args.labels:
        log(f"Fetching issues with labels: {args.labels}")
        payload["labels"] = args.labels
    return make_paginated_graphql_request(query, payload, args.batch)


def fetch_issues_from_project(args: CliArgs) -> list:
    """Fetch issues from a GitHub project."""
    query = get_query_from_file("fetch-project.graphql")
    payload: dict = {
        "org": args.org,
        "project": args.project,
        "batch": args.batch,
    }
    return make_paginated_graphql_request(
        query, payload, args.batch, ["organization", "projectV2", "items"]
    )


# #######################################################
# Update functions
# #######################################################


def update_github_issue(
    repoWithOwner: str,
    issue_number: int,
    issue_body: str,
) -> None:
    """Update a GitHub issue."""
    log(f"Updating GitHub issue #{issue_number} in {repoWithOwner}")

    url = f"{GITHUB_API_URL}/repos/{repoWithOwner}/issues/{issue_number}"

    # Prepare the data to update
    data = {"body": issue_body}

    # Make PATCH request to update the issue
    response = make_request(url, HEADERS, method="PATCH", data=json.dumps(data))

    if response:
        log(f"Successfully updated GitHub issue #{issue_number}")
    else:
        from utils import err

        err(f"Failed to update GitHub issue #{issue_number}")
