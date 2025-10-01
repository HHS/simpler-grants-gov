"""XSD validation utilities for XML generation testing."""

import logging
import os
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
import xmlschema
from lxml import etree

logger = logging.getLogger(__name__)


class XSDValidationError(Exception):
    """Exception raised when XSD validation fails."""

    pass


class XSDValidator:
    """Validates XML against XSD schemas."""

    def __init__(self, cache_dir: str | None = None):
        """Initialize XSD validator with optional cache directory.

        Args:
            cache_dir: Directory to cache downloaded XSD files. If None, uses temp directory.
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path(tempfile.gettempdir()) / "xsd_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._schemas: dict[str, xmlschema.XMLSchema] = {}
        self._url_to_cache_map: dict[str, str] = {}  # Maps URLs to cached file paths

    def get_xsd_url(self, form_name: str) -> str:
        """Get the XSD URL for a given form name.

        Args:
            form_name: The form name (e.g., "SF424_4_0")

        Returns:
            The XSD URL for the form

        Raises:
            ValueError: If form name is not supported
        """
        # Grants.gov XSD URLs
        # TODO: Update these URLs with the correct Grants.gov XSD download locations
        #
        # To find the correct XSD URLs:
        # 1. Visit https://www.grants.gov/
        # 2. Navigate to the forms section
        # 3. Find the specific form (e.g., SF-424 v4.0)
        # 4. Look for XSD schema download links
        # 5. Update the URLs below with the actual download locations
        #
        # Alternative approaches:
        # - Check Grants.gov developer documentation
        # - Look for XSD files in form submission packages
        # - Contact Grants.gov support for official XSD locations
        xsd_urls = {
            "SF424_4_0": "PLACEHOLDER_URL_FOR_SF424_4_0_XSD",
            "SF424A_1_0": "PLACEHOLDER_URL_FOR_SF424A_1_0_XSD",
            "SF424B_1_0": "PLACEHOLDER_URL_FOR_SF424B_1_0_XSD",
            "SF424C_1_0": "PLACEHOLDER_URL_FOR_SF424C_1_0_XSD",
            "SF424D_1_0": "PLACEHOLDER_URL_FOR_SF424D_1_0_XSD",
        }

        if form_name not in xsd_urls:
            raise ValueError(
                f"Unsupported form name: {form_name}. Supported forms: {list(xsd_urls.keys())}"
            )

        # Check for environment variable override first
        env_var_name = f"XSD_URL_{form_name.upper()}"
        env_url = os.getenv(env_var_name)
        if env_url:
            logger.info(f"Using XSD URL from environment variable {env_var_name}: {env_url}")
            return env_url
        url = xsd_urls[form_name]
        if url.startswith("PLACEHOLDER_"):
            error_msg = ("XSD URL for {form_name} is not configured. ").format(form_name=form_name)
            raise XSDValidationError(error_msg)
        return url

    def download_xsd(self, form_name: str) -> Path:
        """Download XSD file for a form if not already cached.

        Args:
            form_name: The form name

        Returns:
            Path to the cached XSD file

        Raises:
            XSDValidationError: If download fails
        """
        xsd_url = self.get_xsd_url(form_name)
        xsd_filename = f"{form_name}.xsd"
        xsd_path = self.cache_dir / xsd_filename

        if xsd_path.exists():
            logger.debug(f"Using cached XSD file: {xsd_path}")
            return xsd_path

        try:
            logger.info(f"Downloading XSD from: {xsd_url}")
            response = requests.get(xsd_url, timeout=30)
            response.raise_for_status()
            xsd_content = response.content

            with open(xsd_path, "wb") as f:
                f.write(xsd_content)

            logger.info(f"Downloaded and cached XSD: {xsd_path}")
            return xsd_path

        except Exception as e:
            raise XSDValidationError(f"Failed to download XSD for {form_name}: {e}") from e

    def get_schema(self, form_name: str) -> xmlschema.XMLSchema:
        """Get XMLSchema object for a form.

        Args:
            form_name: The form name

        Returns:
            XMLSchema object for validation

        Raises:
            XSDValidationError: If schema loading fails
        """
        if form_name in self._schemas:
            return self._schemas[form_name]

        try:
            xsd_path = self.download_xsd(form_name)
            schema = xmlschema.XMLSchema(str(xsd_path))
            self._schemas[form_name] = schema
            return schema

        except Exception as e:
            raise XSDValidationError(f"Failed to load schema for {form_name}: {e}") from e

    def get_schema_from_url_or_path(self, xsd_url_or_path: str) -> xmlschema.XMLSchema:
        """Get XMLSchema object from URL or local path.

        Args:
            xsd_url_or_path: URL to XSD file or local file path

        Returns:
            XMLSchema object for validation

        Raises:
            XSDValidationError: If schema loading fails
        """
        # Use URL/path as cache key
        cache_key = xsd_url_or_path
        if cache_key in self._schemas:
            return self._schemas[cache_key]

        try:
            if xsd_url_or_path.startswith(("http://", "https://")):
                # Download from URL
                xsd_filename = xsd_url_or_path.split("/")[-1]
                xsd_path = self.cache_dir / xsd_filename

                if xsd_path.exists():
                    logger.debug(f"Using cached XSD file: {xsd_path}")
                else:
                    logger.info(f"Downloading XSD from: {xsd_url_or_path}")
                    response = requests.get(xsd_url_or_path, timeout=30)
                    response.raise_for_status()
                    xsd_content = response.content

                    with open(xsd_path, "wb") as f:
                        f.write(xsd_content)

                    logger.info(f"Downloaded and cached XSD: {xsd_path}")

                # Build location map for imports to use cached files
                locations = self._build_location_map_for_xsd(xsd_url_or_path)
                schema = xmlschema.XMLSchema(str(xsd_path), locations=locations)
            else:
                # Load from local path
                xsd_path = Path(xsd_url_or_path)
                if not xsd_path.exists():
                    raise XSDValidationError(f"XSD file not found: {xsd_path}")
                logger.info(f"Loading XSD from local path: {xsd_path}")

                # Build location map for imports even for local files
                locations = self._build_location_map_for_xsd(str(xsd_path))
                schema = xmlschema.XMLSchema(str(xsd_path), locations=locations)

            self._schemas[cache_key] = schema
            return schema

        except Exception as e:
            raise XSDValidationError(f"Failed to load schema from {xsd_url_or_path}: {e}") from e

    def fetch_xsd_with_dependencies(
        self, xsd_url: str, visited: set[str] | None = None
    ) -> dict[str, Any]:
        """Recursively fetch an XSD file and all its import/include dependencies.

        Args:
            xsd_url: URL to the main XSD file
            visited: Set of already processed URLs to avoid circular dependencies

        Returns:
            Dictionary with fetch statistics:
                - fetched: List of newly downloaded files
                - cached: List of already cached files
                - errors: List of errors encountered
        """
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
                xsd_content = xsd_path.read_bytes()
            else:
                logger.info(f"Downloading XSD: {xsd_url}")
                response = requests.get(xsd_url, timeout=30)
                response.raise_for_status()
                xsd_content = response.content

                with open(xsd_path, "wb") as f:
                    f.write(xsd_content)

                logger.info(f"Downloaded and cached: {xsd_path}")
                result["fetched"].append(xsd_url)

            # Track URL to cache path mapping for location resolution
            self._url_to_cache_map[xsd_url] = str(xsd_path)

            # Parse the XSD to find imports and includes
            dependencies = self._extract_xsd_dependencies(xsd_content, xsd_url)

            # Recursively fetch dependencies
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

    def _extract_xsd_dependencies(self, xsd_content: bytes, base_url: str) -> list[str]:
        """Extract import and include schema locations from XSD content.

        Args:
            xsd_content: Raw XSD file content
            base_url: Base URL for resolving relative paths

        Returns:
            List of absolute URLs to dependent XSD files
        """
        dependencies = []

        try:
            # Parse the XSD content
            root = etree.fromstring(xsd_content)

            # XSD namespace
            xs_ns = {"xs": "http://www.w3.org/2001/XMLSchema"}

            # Find all import elements with schemaLocation
            imports = root.xpath("//xs:import[@schemaLocation]", namespaces=xs_ns)
            for imp in imports:
                schema_location = imp.get("schemaLocation")
                if schema_location:
                    # Resolve relative URLs against the base URL
                    absolute_url = self._resolve_schema_location(schema_location, base_url)
                    if absolute_url:
                        dependencies.append(absolute_url)
                        logger.debug(f"Found import: {absolute_url}")

            # Find all include elements with schemaLocation
            includes = root.xpath("//xs:include[@schemaLocation]", namespaces=xs_ns)
            for inc in includes:
                schema_location = inc.get("schemaLocation")
                if schema_location:
                    absolute_url = self._resolve_schema_location(schema_location, base_url)
                    if absolute_url:
                        dependencies.append(absolute_url)
                        logger.debug(f"Found include: {absolute_url}")

        except Exception as e:
            logger.warning(f"Failed to parse XSD dependencies: {e}")

        return dependencies

    def _build_location_map_for_xsd(self, xsd_url_or_path: str) -> dict[str, str]:
        """Build a location map for xmlschema to use cached files for imports.

        Args:
            xsd_url_or_path: URL or path to the main XSD file

        Returns:
            Dictionary mapping URLs to cached file paths
        """
        locations = {}

        # Check if this is a URL and we have cache mappings
        if xsd_url_or_path.startswith(("http://", "https://")):
            # Get the XSD file from cache
            xsd_filename = xsd_url_or_path.split("/")[-1]
            xsd_path = self.cache_dir / xsd_filename

            if xsd_path.exists():
                try:
                    # Parse to find dependencies
                    xsd_content = xsd_path.read_bytes()
                    dependencies = self._extract_xsd_dependencies(xsd_content, xsd_url_or_path)

                    # Map each dependency URL to its cached file if available
                    for dep_url in dependencies:
                        dep_filename = dep_url.split("/")[-1]
                        dep_path = self.cache_dir / dep_filename

                        if dep_path.exists():
                            # Map the URL to the cached file path
                            locations[dep_url] = str(dep_path)
                            logger.debug(f"Mapped {dep_url} -> {dep_path}")
                        else:
                            logger.debug(f"Dependency not in cache: {dep_url}")

                except Exception as e:
                    logger.warning(f"Failed to build location map for {xsd_url_or_path}: {e}")

        return locations

    def _resolve_schema_location(self, schema_location: str, base_url: str) -> str | None:
        """Resolve a schema location to an absolute URL.

        Args:
            schema_location: Schema location from import/include
            base_url: Base URL for resolving relative paths

        Returns:
            Absolute URL or None if it should be skipped
        """
        # Skip empty or local file references
        if not schema_location or schema_location.startswith("file:"):
            return None

        # If already absolute, return as-is
        if schema_location.startswith(("http://", "https://")):
            return schema_location

        # Resolve relative URL against base URL
        try:
            # Get the base directory of the XSD file
            base_dir = base_url.rsplit("/", 1)[0] + "/"
            absolute_url = urljoin(base_dir, schema_location)
            return absolute_url
        except Exception as e:
            logger.warning(f"Failed to resolve schema location {schema_location}: {e}")
            return None

    def validate_xml(self, xml_content: str, xsd_url_or_path: str) -> dict[str, Any]:
        """Validate XML content against XSD schema.

        Args:
            xml_content: The XML content to validate
            xsd_url_or_path: URL to XSD file or local file path

        Returns:
            Validation result dictionary with success status and details

        Raises:
            XSDValidationError: If validation fails
        """
        try:
            schema = self.get_schema_from_url_or_path(xsd_url_or_path)

            # Parse XML to check for well-formedness
            try:
                etree.fromstring(xml_content.encode("utf-8"))
            except etree.XMLSyntaxError as e:
                return {
                    "valid": False,
                    "error_type": "xml_syntax",
                    "error_message": f"XML is not well-formed: {e}",
                    "details": str(e),
                }

            # Validate against XSD
            try:
                schema.validate(xml_content)
                return {
                    "valid": True,
                    "error_type": None,
                    "error_message": None,
                    "details": "XML is valid according to XSD",
                }
            except xmlschema.XMLSchemaException as e:
                return {
                    "valid": False,
                    "error_type": "xsd_validation",
                    "error_message": f"XSD validation failed: {e}",
                    "details": str(e),
                }

        except Exception as e:
            raise XSDValidationError(f"Validation failed for {xsd_url_or_path}: {e}") from e

    def validate_xml_file(self, xml_file_path: str, form_name: str) -> dict[str, Any]:
        """Validate XML file against XSD schema.

        Args:
            xml_file_path: Path to the XML file
            form_name: The form name for schema selection

        Returns:
            Validation result dictionary
        """
        try:
            with open(xml_file_path, "r", encoding="utf-8") as f:
                xml_content = f.read()
            return self.validate_xml(xml_content, form_name)
        except Exception as e:
            raise XSDValidationError(f"Failed to read XML file {xml_file_path}: {e}") from e
