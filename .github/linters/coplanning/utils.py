"""
Shared utilities for the GitHub to Fider loader.
"""

import re
import json
import logging
import os
import sys
from typing import Never
import urllib.request

# #######################################################
# Logging
# #######################################################

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def log(message: str) -> None:
    """Log an info message."""
    logger.info(message)


def err(message: str) -> None:
    """Log an error message and exit."""
    logger.error(message)


def err_and_exit(message: str) -> Never:
    """Log an error message and exit."""
    err(message)
    sys.exit(1)


# #######################################################
# Environment variables
# #######################################################


def get_env(name: str) -> str:
    """Get an environment variable and exit if it's not set."""
    value = os.environ.get(name)
    if not value:
        err_and_exit(f"{name} environment variable must be set")
    return value


# #######################################################
# HTTP requests
# #######################################################


def make_request(
    url: str,
    headers: dict[str, str],
    method: str = "GET",
    data: str | None = None,
) -> dict:
    """Make an HTTP request and return JSON response."""
    # Always add a User-Agent header to avoid Cloudflare bot blocking
    headers = dict(headers)  # copy to avoid mutating caller's dict
    if "User-Agent" not in headers:
        headers["User-Agent"] = "Mozilla/5.0 (compatible; FeatureBaseBot/1.0)"
    try:
        req = urllib.request.Request(url, headers=headers, method=method)
        if data:
            req.data = data.encode()

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.request.HTTPError as e:
        err_and_exit(f"HTTP request failed: {e.code} - {e.reason}")
    except json.JSONDecodeError:
        err_and_exit("Failed to parse JSON response")
    except Exception as e:
        err_and_exit(f"Request failed: {e}")


# #######################################################
# Formatting
# #######################################################


def format_title(title: str) -> str:
    """Format the title to remove extra whitespace and '[]' prefixes."""
    return re.sub(r"^\[.*\]", "", title).strip()


def format_post_description(
    url: str,
    description: str,
    sections: list[str],
) -> str:
    """Format the post description by extracting content from multiple sections.

    Args:
        url: The GitHub issue URL
        description: The issue description text
        sections: List of section headers to extract (e.g., ["Summary", "Context"]).
                 If specified sections not found, uses the entire description.
    """
    # Extract content from multiple sections
    extracted_sections = []

    for section in sections:
        pattern = rf"^###\s+{re.escape(section)}\s*\n+(?P<content>.*?)(?=\n###|\Z)"
        match = re.search(pattern, description, re.DOTALL | re.MULTILINE)

        if match:
            # Extract and clean the matched content, stripping images and whitespace
            extracted_text = match.group("content")
            cleaned_text = re.sub(r"!\[.*?\]\(.*?\)", "", extracted_text).strip()
            if cleaned_text:  # Only add non-empty sections
                extracted_sections.append(f"### {section}\n{cleaned_text}")

    if extracted_sections:
        # Join all sections with double newlines
        summary = "\n\n".join(extracted_sections)
    else:
        # No sections found, use the entire description, stripping images and whitespace
        summary = re.sub(r"!\[.*?\]\(.*?\)", "", description).strip()

    # Format with GitHub link and summary
    return f"{summary}\n\n### Technical details\n\nFor more information, see the [GitHub issue]({url})"


def format_issue_body(
    current_body: str,
    section: str,
    post_url: str,
    vote_count: int,
) -> str:
    """Updates or adds a section to the issue body for Fider or FeatureBase."""
    # Create the section header to search for
    section_header = f"### {section.title()}"

    # Check if the section already exists
    if section_header in current_body:
        # Section exists, update it with new post URL and vote count
        # Find the section and replace its content
        pattern = rf"({re.escape(section_header)}.*?)(?=\n###|\Z)"
        replacement = f"{section_header}\n\n- Vote for this feature: [Post]({post_url})\n- Votes: {vote_count}"

        # Use re.sub with DOTALL flag to match across multiple lines
        updated_body = re.sub(pattern, replacement, current_body, flags=re.DOTALL)
        return updated_body
    else:
        # Section doesn't exist, append it at the bottom
        new_section = f"\n\n{section_header}\n\n- Vote for this feature: [Post]({post_url})\n- Votes: {vote_count}"
        return current_body + new_section
