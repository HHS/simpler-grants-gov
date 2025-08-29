"""
GitHub API client.
"""

import json
import re
import urllib.parse
from dataclasses import dataclass, field
from utils import format_issue_body, get_env, log, make_request

GITHUB_API_TOKEN = get_env("GITHUB_API_TOKEN")


@dataclass
class GithubIssueData:
    """Data class for GitHub issue data."""

    org: str
    repo: str
    number: int
    title: str = ""
    body: str = ""
    labels: list[str] = field(default_factory=list)


@dataclass
class PostData:
    """Data class for Fider or FeatureBase post data."""

    url: str
    number: int
    vote_count: int
    github_url: str


# ############################################################################
# Parse issue URL
# ############################################################################


def parse_issue_url(issue_url: str) -> GithubIssueData:
    """Parse the issue URL and return the org, repo, and issue number."""
    pattern = (
        r"https://github\.com/(?P<org>[\w-]+)/(?P<repo>[\w-]+)/issues/(?P<issue>\d+)"
    )
    match = re.match(pattern, issue_url)
    if not match:
        raise ValueError(f"Invalid GitHub issue URL: {issue_url}")
    return GithubIssueData(
        org=match.group("org"),
        repo=match.group("repo"),
        number=int(match.group("issue")),
    )


# ############################################################################
# Fetch GitHub issues
# ############################################################################


def fetch_github_issues(
    org: str,
    repo: str,
    label: str,
    state: str = "open",
    batch: int = 100,
) -> dict[str, GithubIssueData]:
    """Fetch GitHub issues using the GitHub API."""
    log(f"Fetching {state} issues from {org}/{repo} with label '{label}'")

    headers = {
        "Authorization": f"token {GITHUB_API_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{org}/{repo}/issues"
    params = {
        "state": state,
        "labels": label,
        "per_page": min(batch, 100),  # GitHub API max is 100
        "page": 1,
    }

    # Build query string using standard library
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"

    issues_data = make_request(full_url, headers)

    # Convert to the same format as the original script
    issues_dict: dict[str, GithubIssueData] = {}
    for issue in issues_data:
        issue_url = issue.get("html_url")
        issue_title = issue.get("title")

        # Skip if no URL or title
        if not issue_url or not issue_title:
            continue

        # Add to dict
        issues_dict[issue_url] = GithubIssueData(
            org=org,
            repo=repo,
            number=issue.get("number"),
            title=issue_title,
            body=issue.get("body", ""),
        )

    log(f"Found {len(issues_dict)} GitHub issues")
    return issues_dict


# ############################################################################
# Update GitHub issues
# ############################################################################


def update_github_issue(
    org: str,
    repo: str,
    issue_number: int,
    issue_body: str,
) -> None:
    """Update a GitHub issue."""
    log(f"Updating GitHub issue #{issue_number} in {org}/{repo}")

    headers = {
        "Authorization": f"token {GITHUB_API_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    url = f"https://api.github.com/repos/{org}/{repo}/issues/{issue_number}"

    # Prepare the data to update
    data = {"body": issue_body}

    # Make PATCH request to update the issue
    response = make_request(url, headers, method="PATCH", data=json.dumps(data))

    if response:
        log(f"Successfully updated GitHub issue #{issue_number}")
    else:
        log(f"Failed to update GitHub issue #{issue_number}")


def update_github_issues(
    issues: dict[str, GithubIssueData],
    posts: dict[str, PostData],
    *,
    dry_run: bool,
) -> None:
    """Update GitHub issues with data from Fider or FeatureBase posts."""
    if not posts:
        log("No posts to update")
        return

    log(f"Processing {len(posts)} posts (dry_run: {dry_run})")

    for issue_url, post in posts.items():
        # Get the issue data
        issue = issues.get(issue_url)
        if not issue:
            log(f"Issue not found for post {issue_url}")
            continue

        log(
            f"Processing issue https://github.com/{issue.org}/{issue.repo}/issues/{issue.number}"
        )

        # Format the new issue body
        issue_body = format_issue_body(
            current_body=issue.body,
            section="Fider",
            post_url=post.url,
            vote_count=post.vote_count,
        )

        # Skip update if dry run
        if dry_run:
            log(
                f"[DRY RUN] Would update issue #{issue.number} with post URL: {post.url}"
            )
            continue

        # Update the GitHub issue
        update_github_issue(
            org=issue.org,
            repo=issue.repo,
            issue_number=issue.number,
            issue_body=issue_body,
        )

    log("Finished processing all posts")
