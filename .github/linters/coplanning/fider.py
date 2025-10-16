"""
Fider API client.
"""

import json
import re

from github import GithubIssueData, PostData
from utils import format_post_description, format_title, get_env, log, make_request

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
    pattern = re.compile(
        # Matches: [GitHub issue](https://github.com/org/repo/issues/123)
        # which is inserted at the end of the fider post by utils.format_post_description()
        r"\[GitHub issue\]\((https://github\.com/[^/]+/[^/]+/issues/[0-9]+)\)"
    )

    for post in posts:
        description = post.get("description", "")
        if not description:
            continue
        matches = pattern.findall(description)
        if not matches:
            continue
        # Take the last match if there are multiple GitHub issue URLs in the post
        # This is because the source GitHub issue URL is always inserted
        # at the end of the fider post by utils.format_post_description()
        github_url = matches[-1]
        fider_url = f"{FIDER_URL}/posts/{post.get('number')}"
        posts_dict[github_url] = PostData(
            url=fider_url,
            number=post.get("number", 0),
            vote_count=post.get("votesCount", 0),
            github_url=github_url,
        )

    log(f"Loaded {len(posts_dict)} Fider posts with GitHub URLs")
    return posts_dict


# #######################################################
# Fider - create post
# #######################################################


def create_post(title: str, description: str, *, dry_run: bool = False) -> None:
    """Create a new Fider post."""
    if dry_run:
        log(f"DRY RUN: Would create post with title: {title}")
        log(f"DRY RUN: Formatted description: {description}")
        return

    url = f"https://{BOARD}.fider.io/api/v1/posts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FIDER_API_TOKEN}",
    }

    data = {"title": title, "description": description}

    make_request(url, headers, method="POST", data=json.dumps(data))
    log("Created Fider post successfully")


# #######################################################
# Fider - update post
# #######################################################


def update_post(
    post_number: int,
    title: str,
    description: str,
    *,
    dry_run: bool = False,
) -> None:
    """Update an existing Fider post."""
    if dry_run:
        log(f"DRY RUN: Would update post with title: {title}")
        log(f"DRY RUN: Formatted description: {description}")
        return

    url = f"https://{BOARD}.fider.io/api/v1/posts/{post_number}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FIDER_API_TOKEN}",
    }

    data = {"title": title, "description": description}

    make_request(url, headers, method="PUT", data=json.dumps(data))
    log("Updated Fider post successfully")


# #######################################################
# Fider - upsert posts
# #######################################################


def upsert_posts(
    github_issues: dict[str, GithubIssueData],
    fider_posts: dict[str, PostData],
    issue_sections: list[str],
    *,
    update_existing: bool = False,
    dry_run: bool = False,
) -> None:
    """Insert new Fider posts or update existing ones."""
    for issue_url, issue_data in github_issues.items():
        existing_post = fider_posts.get(issue_url)

        # Skip if already exists and we don't want to update
        if existing_post and not update_existing:
            log(
                f"Skipping {issue_url} - already exists in Fider and we don't want to update it"
            )
            continue

        # Format the description (shared between create and update)
        formatted_title = format_title(issue_data.title)
        formatted_description = format_post_description(
            issue_url,
            issue_data.body,
            issue_sections,
        )

        if existing_post:
            # Update existing post
            log(f"Updating existing Fider post {existing_post.url} for {issue_url}")
            update_post(
                post_number=existing_post.number,
                title=formatted_title,
                description=formatted_description,
                dry_run=dry_run,
            )
        else:
            # Create new post
            log(f"Creating new Fider post for {issue_url}")
            create_post(
                title=formatted_title,
                description=formatted_description,
                dry_run=dry_run,
            )
