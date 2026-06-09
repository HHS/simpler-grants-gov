"""XSD validation utilities for XML generation testing."""

import logging
from pathlib import Path
from typing import Any

import xmlschema
from lxml import etree

logger = logging.getLogger(__name__)


class XSDValidationError(Exception):
    """Exception raised when XSD validation fails."""

    pass


class XSDValidator:
    """Validates XML against XSD schemas.

    This validator assumes XSD files are already downloaded and stored locally.
    Run the fetch-xsds CLI command first to download XSD files before validation.
    """

    def __init__(self, xsd_dir: str | Path):
        """Initialize XSD validator.

        Args:
            xsd_dir: Directory containing stored XSD files.
                          XSD files must be pre-downloaded using the fetch-xsds command.

        Raises:
            XSDValidationError: If directory doesn't exist
        """
        self.xsd_dir = Path(xsd_dir)

        if not self.xsd_dir.exists():
            raise XSDValidationError(
                f"XSD directory does not exist: {xsd_dir}. "
                "Run 'flask task fetch-xsds' to download XSD files first."
            )

        self._schemas: dict[str, xmlschema.XMLSchema] = {}

    def _build_local_locations(self) -> dict[str, str]:
        """Build a namespace-to-local-path map from XSD files in xsd_dir.

        This lets xmlschema resolve imports from local files instead of fetching
        remote URLs, making validation faster and offline-capable.
        """
        locations: dict[str, str] = {}
        for xsd_file in self.xsd_dir.glob("*.xsd"):
            try:
                import xml.etree.ElementTree as ET

                tree = ET.parse(str(xsd_file))
                root = tree.getroot()
                ns = root.get("targetNamespace")
                if ns:
                    locations[ns] = str(xsd_file)
            except Exception:
                pass
        return locations

    def get_xsd_path(self, form_name: str) -> Path:
        """Get the path to a stored XSD file.

        Args:
            form_name: The form name (e.g., "SF424_4_0")

        Returns:
            Path to the XSD file

        Raises:
            XSDValidationError: If XSD file doesn't exist
        """
        xsd_filename = f"{form_name}.xsd"
        xsd_path = self.xsd_dir / xsd_filename

        if not xsd_path.exists():
            raise XSDValidationError(
                f"XSD file not found: {xsd_path}. "
                f"Run 'flask task fetch-xsds' to download XSD files first."
            )

        return xsd_path

    def load_schema(self, xsd_path: str | Path) -> xmlschema.XMLSchema:
        """Load an XSD schema from a file path.

        Args:
            xsd_path: Path to the XSD file

        Returns:
            Loaded XMLSchema object

        Raises:
            XSDValidationError: If schema loading fails
        """
        xsd_path = Path(xsd_path)

        # Check cache first
        cache_key = str(xsd_path)
        if cache_key in self._schemas:
            return self._schemas[cache_key]

        if not xsd_path.exists():
            raise XSDValidationError(f"XSD file not found: {xsd_path}")

        try:
            logger.info(f"Loading XSD schema from: {xsd_path}")
            locations = self._build_local_locations()
            schema = xmlschema.XMLSchema(str(xsd_path), locations=locations)
            self._schemas[cache_key] = schema
            return schema

        except Exception as e:
            raise XSDValidationError(f"Failed to load XSD schema from {xsd_path}: {e}") from e

    def validate_xml(self, xml_content: str, xsd_path: str | Path) -> dict[str, Any]:
        """Validate XML content against an XSD schema.

        Args:
            xml_content: The XML content to validate
            xsd_path: Path to the XSD schema file

        Returns:
            Validation result dictionary with keys:
                - valid (bool): Whether XML is valid
                - error_type (str|None): Type of error if invalid
                - error_message (str|None): Error message if invalid
                - details (str): Additional details about validation result

        Raises:
            XSDValidationError: If validation process fails
        """
        try:
            # Load schema
            schema = self.load_schema(xsd_path)

            # Check XML is well-formed
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
                    "details": "XML is valid according to XSD schema",
                }
            except xmlschema.XMLSchemaException as e:
                return {
                    "valid": False,
                    "error_type": "xsd_validation",
                    "error_message": f"XSD validation failed: {e}",
                    "details": str(e),
                }

        except XSDValidationError:
            raise
        except Exception as e:
            raise XSDValidationError(f"Validation failed: {e}") from e

    def validate_xml_for_form(self, xml_content: str, form_name: str) -> dict[str, Any]:
        """Validate XML content for a specific form.

        Args:
            xml_content: The XML content to validate
            form_name: The form name (e.g., "SF424_4_0")

        Returns:
            Validation result dictionary

        Raises:
            XSDValidationError: If validation fails or XSD not found
        """
        xsd_path = self.get_xsd_path(form_name)
        return self.validate_xml(xml_content, xsd_path)
