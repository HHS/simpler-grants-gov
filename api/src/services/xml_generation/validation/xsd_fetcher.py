"""Utility for fetching and storing XSD files."""

import logging
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from lxml import etree

logger = logging.getLogger(__name__)

XSD_NAMESPACE = "http://www.w3.org/2001/XMLSchema"
# Tags that can reference another schema document.
DEPENDENCY_TAGS = ("import", "include", "redefine")


class XSDFetchError(Exception):
    """Exception raised when XSD fetching fails."""

    pass


def discover_xsd_dependencies(xsd_content: bytes, source_url: str) -> list[str]:
    """Parse an XSD document and discover the schemas it depends on.

    Looks for ``xs:import``, ``xs:include``, and ``xs:redefine`` elements and
    resolves their ``schemaLocation`` attribute (which may be relative)
    against the URL the schema was fetched from.

    Args:
        xsd_content: Raw bytes of the XSD document.
        source_url: The URL the XSD document was downloaded from, used to
            resolve relative ``schemaLocation`` references.

    Returns:
        A list of absolute URLs for the dependencies declared in the schema.

    Raises:
        XSDFetchError: If ``xsd_content`` is not well-formed XML. Callers
            should treat this as a hard failure for the URL being processed
            rather than caching or reporting it as fetched.
    """
    try:
        root = etree.fromstring(xsd_content)
    except etree.XMLSyntaxError as e:
        raise XSDFetchError(f"Failed to parse XSD from {source_url}: {e}") from e

    dependency_urls = []
    for tag in DEPENDENCY_TAGS:
        for elem in root.findall(f"{{{XSD_NAMESPACE}}}{tag}"):
            schema_location = elem.get("schemaLocation")
            if not schema_location:
                # imports without a schemaLocation just declare a namespace
                continue
            dependency_urls.append(urljoin(source_url, schema_location))

    return dependency_urls


class XSDFetcher:
    """Fetches XSD files and their dependencies for offline validation.

    This utility downloads XSD schema files and stores them locally for use
    during validation testing. Dependencies (imports/includes/redefines) are
    discovered dynamically by parsing each XSD as it is fetched, rather than
    relying on a hardcoded dependency map, so new forms and schema drift are
    picked up automatically.
    """

    def __init__(self, xsd_dir: str | Path):
        """Initialize XSD fetcher.

        Args:
            xsd_dir: Directory to store downloaded XSD files
        """
        self.xsd_dir = Path(xsd_dir)
        self.xsd_dir.mkdir(parents=True, exist_ok=True)

    def _local_path_for(self, xsd_url: str) -> Path:
        filename = urlparse(xsd_url).path.rsplit("/", 1)[-1]
        return self.xsd_dir / filename

    def fetch_xsd_with_dependencies(
        self, xsd_url: str, visited: set[str] | None = None
    ) -> dict[str, Any]:
        """Fetch an XSD file and recursively fetch every schema it depends on.

        Dependencies are not looked up from a static map; they're discovered
        by parsing the XSD's own ``xs:import`` / ``xs:include`` /
        ``xs:redefine`` declarations, so nested (transitive) dependencies are
        followed automatically. Already-visited URLs (including circular
        references back to a schema earlier in the chain) are skipped.

        A freshly downloaded response is always parsed *before* it is
        written to disk or counted as fetched. Persisting first would let an
        invalid or corrupted response get cached as if it were a good
        schema — it would satisfy ``xsd_path.exists()`` on every later run
        and be silently reused as "stored" forever. Validating first means a
        bad response is never written and never reported as a success; it
        surfaces in ``errors`` instead, and the retry stays possible next run.
        """
        if visited is None:
            visited = set()

        result: dict[str, Any] = {"fetched": [], "stored": [], "errors": []}

        # Skip if already processed (also guards against circular imports)
        if xsd_url in visited:
            return result

        visited.add(xsd_url)

        try:
            xsd_path = self._local_path_for(xsd_url)
            is_freshly_downloaded = not xsd_path.exists()

            if is_freshly_downloaded:
                logger.info(f"Downloading XSD: {xsd_url}")
                response = requests.get(xsd_url, timeout=30)
                response.raise_for_status()
                xsd_content = response.content
            else:
                logger.debug(f"Using existing XSD: {xsd_path}")
                xsd_content = xsd_path.read_bytes()

            # Validate before persisting or reporting success (see docstring).
            dependencies = discover_xsd_dependencies(xsd_content, xsd_url)

            if is_freshly_downloaded:
                with open(xsd_path, "wb") as f:
                    f.write(xsd_content)
                logger.info(f"Downloaded and stored: {xsd_path}")
                result["fetched"].append(xsd_url)
            else:
                result["stored"].append(xsd_url)

            for dep_url in dependencies:
                try:
                    dep_result = self.fetch_xsd_with_dependencies(dep_url, visited)
                    result["fetched"].extend(dep_result["fetched"])
                    result["stored"].extend(dep_result["stored"])
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
