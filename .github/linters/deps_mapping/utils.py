import json
import logging
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Never

PROJECT_DIR = Path(__file__).parent
REPO_ROOT = PROJECT_DIR.parent.parent.parent
DOCS_DIR = REPO_ROOT / "documentation"

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
# GraphQL requests
# #######################################################


def get_query_from_file(file_name: str) -> str:
    """Get a GraphQL query from a file."""
    # Read the GraphQL query from file
    query_file_path = PROJECT_DIR / "queries" / file_name
    if not query_file_path.exists():
        log(f"GraphQL query file not found: {query_file_path}")
        return ""
    try:
        with open(query_file_path, "r") as f:
            return f.read()
    except Exception as e:
        log(f"Error reading query file: {e}")
        return ""


# #######################################################
# Markdown parsing
# #######################################################


def update_markdown_section(
    content: str,
    section: str,
    new_content: str,
    level: int = 3,
) -> str:
    """Updates or adds a section to the markdown content."""
    # Create the section header to search for
    header = "#" * level
    section_header = f"{header} {section}"

    # Check if the section already exists
    if section_header in content:
        # Section exists, update it with new content
        # Find the section and replace its content
        pattern = rf"({re.escape(section_header)}.*?)(?=\n{header}|\Z)"
        replacement = f"{section_header}\n{new_content}"

        # Use re.sub with DOTALL flag to match across multiple lines
        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        return updated_content
    else:
        # Section doesn't exist, append it at the bottom
        new_section = f"\n\n{section_header}\n{new_content}"
        return content + new_section


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
