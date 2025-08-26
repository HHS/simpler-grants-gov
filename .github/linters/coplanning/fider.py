"""
Fider API client.
"""

import json
import re

from github import GithubIssueData, PostData
from utils import format_post_description, get_env, log, make_request

FIDER_API_TOKEN = get_env("FIDER_API_TOKEN")
BOARD = get_env("FIDER_BOARD")
FIDER_URL = f"https://{BOARD}.fider.io"

# #######################################################
# Fider - fetch and parse posts
# #######################################################


def fetch_posts() -> dict[str, PostData]:
    """Fetch Fider posts using the API and return PostData keyed by GitHub issue URLs."""
    log(f"Fetching current Fider posts from {BOARD}.fider.io")

    url = f"{FIDER_URL}/api/v1/posts"
    headers = {"Authorization": f"Bearer {FIDER_API_TOKEN}"}

    posts = make_request(url, headers)
    if not posts:
        log("No posts returned from Fider API")
        return {}

    if not isinstance(posts, list):
        log(f"Unexpected response format from Fider API: {type(posts)}")
        return {}

    return parse_posts(posts, url)


def parse_posts(posts: list[dict], fider_url: str) -> dict[str, PostData]:
    """Parse Fider posts and return PostData keyed by GitHub issue URLs."""
    posts_dict: dict[str, PostData] = {}
    pattern = re.compile(r"https://github\.com/[^/]+/[^/]+/issues/[0-9]+")

    for post in posts:
        description = post.get("description", "")
        if not description:
            continue
        matches = pattern.findall(description)
        if not matches:
            continue
        github_url = matches[0]  # Take the first match
        fider_url = f"{FIDER_URL}/posts/{post.get('number')}"
        posts_dict[github_url] = PostData(
            url=fider_url,
            vote_count=post.get("votesCount", 0),
            github_url=github_url,
        )

    log(f"Loaded {len(posts_dict)} Fider posts with GitHub URLs")
    return posts_dict


# #######################################################
# Fider - create post
# #######################################################


def create_post(title: str, description: str) -> None:
    """Create a new Fider post."""
    url = f"https://{BOARD}.fider.io/api/v1/posts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FIDER_API_TOKEN}",
    }

    data = {"title": title, "description": description}

    make_request(url, headers, method="POST", data=json.dumps(data))
    log("Created Fider post successfully")


def insert_new_posts(
    github_issues: dict[str, GithubIssueData],
    post_urls: set[str],
    issue_section: str = "Summary",
    *,
    dry_run: bool,
) -> None:
    """Insert new Fider posts."""
    for issue_url, issue_data in github_issues.items():
        # Skip if already in Fider
        if issue_url in post_urls:
            log(f"Skipping {issue_url} - already exists in Fider")
            continue

        # Create new Fider post
        log(f"Creating new Fider post for {issue_url}")
        title = issue_data.title
        description = issue_data.body

        # Format the description using the parsing logic
        formatted_description = format_post_description(
            issue_url,
            description,
            issue_section,
        )

        # Dry run
        if dry_run:
            log(f"DRY RUN: Would create post with title: {title}")
            log(f"DRY RUN: Formatted description: {formatted_description}")
            continue

        # Create new Fider post
        create_post(
            title=title,
            description=formatted_description,
        )
