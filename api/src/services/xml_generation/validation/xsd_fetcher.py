"""Utility for fetching and caching XSD files."""

import logging
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger(__name__)


class XSDFetchError(Exception):
    """Exception raised when XSD fetching fails."""

    pass


KNOWN_XSD_DEPENDENCIES = {
    "SF424_4_0-V4.0.xsd": [
        "https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd",
        "https://apply07.grants.gov/apply/system/schemas/Attachments-V1.0.xsd",
    ],
    # Add other form dependencies as needed
}


class XSDFetcher:
    """Fetches XSD files and their dependencies for offline validation.

    This utility downloads XSD schema files and caches them
    locally for use during validation testing.
    """

    def __init__(self, cache_dir: str | Path):
        """Initialize XSD fetcher.

        Args:
            cache_dir: Directory to cache downloaded XSD files
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def fetch_xsd_with_dependencies(
        self, xsd_url: str, visited: set[str] | None = None
    ) -> dict[str, Any]:
        """Fetch an XSD file and all its known dependencies."""
        if visited is None:
            visited = set()

        result: dict[str, Any] = {"fetched": [], "cached": [], "errors": []}

        # Skip if already processed
        if xsd_url in visited:
            return result

        visited.add(xsd_url)

        try:
            # Download the main XSD if needed
            xsd_filename = xsd_url.split("/")[-1]
            xsd_path = self.cache_dir / xsd_filename

            if xsd_path.exists():
                logger.debug(f"Using cached XSD: {xsd_path}")
                result["cached"].append(xsd_url)
            else:
                logger.info(f"Downloading XSD: {xsd_url}")
                response = requests.get(xsd_url, timeout=30)
                response.raise_for_status()

                with open(xsd_path, "wb") as f:
                    f.write(response.content)

                logger.info(f"Downloaded and cached: {xsd_path}")
                result["fetched"].append(xsd_url)

            # Fetch known dependencies
            dependencies = KNOWN_XSD_DEPENDENCIES.get(xsd_filename, [])

            for dep_url in dependencies:
                try:
                    dep_result = self.fetch_xsd_with_dependencies(dep_url, visited)
                    result["fetched"].extend(dep_result["fetched"])
                    result["cached"].extend(dep_result["cached"])
                    result["errors"].extend(dep_result["errors"])
                except Exception as e:
                    error_msg = f"Failed to fetch dependency {dep_url}: {e}"
                    logger.warning(error_msg)
                    result["errors"].append({"url": dep_url, "error": str(e)})

        except Exception as e:
            error_msg = f"Failed to fetch {xsd_url}: {e}"
            logger.error(error_msg)
            result["errors"].append({"url": xsd_url, "error": str(e)})

        return result
