"""Core XML generation service."""

import logging
import xml.etree.ElementTree as ET
from typing import Any

import requests
from lxml import etree as lxml_etree

from .config import load_xml_transform_config
from .models import XMLGenerationRequest, XMLGenerationResponse
from .transformers.attachment_transformer import AttachmentTransformer
from .transformers.base_transformer import RecursiveXMLTransformer
from .utils.attachment_mapping import AttachmentInfo

logger = logging.getLogger(__name__)


class XMLGenerationService:
    """Service for generating XML from JSON application data."""

    def generate_xml(self, request: XMLGenerationRequest) -> XMLGenerationResponse:
        """Generate XML from application data.

        Args:
            request: XML generation request containing application data and form name

        Returns:
            XML generation response with generated XML or error information
        """
        try:
            # Validate input data
            if not request.application_data:
                return XMLGenerationResponse(
                    success=False, error_message="No application data provided"
                )

            # Load transformation configuration
            transform_config = load_xml_transform_config(request.form_name)

            # Transform the data using recursive transformer
            transformer = RecursiveXMLTransformer(transform_config)
            transformed_data = transformer.transform(request.application_data)

            # Generate XML
            xml_string = self._generate_xml_string(
                transformed_data,
                transform_config,
                request.pretty_print,
                request.attachment_mapping,
            )

            # Log transformation results for development
            logger.info(
                f"XML generation successful: {len(transformed_data)} fields transformed from {len(request.application_data)} input fields for {request.form_name}"
            )

            return XMLGenerationResponse(success=True, xml_data=xml_string)

        except Exception as e:
            logger.exception("XML generation failed")
            return XMLGenerationResponse(success=False, error_message=str(e))

    def _generate_xml_string(
        self,
        data: dict,
        transform_config: dict,
        pretty_print: bool = True,
        attachment_mapping: dict[str, AttachmentInfo] | None = None,
    ) -> str:
        """Generate XML string from transformed data."""
        # Get XML configuration from the config metadata
        xml_config = transform_config.get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        root_element_name = xml_structure.get("root_element", "SF424_4_0")

        # Validate that version is present in xml_structure
        if "version" not in xml_structure:
            raise ValueError(
                f"Missing required 'version' in xml_structure configuration for root element '{root_element_name}'"
            )

        # Get namespace configuration
        namespace_config = xml_config.get("namespaces", {})
        default_namespace = namespace_config.get("default", "")

        # Extract namespace field mappings
        namespace_fields = self._extract_namespace_fields(transform_config)

        # Use lxml for proper namespace handling if namespaces are configured
        if namespace_fields or default_namespace:
            return self._generate_xml_with_namespaces(
                data,
                root_element_name,
                namespace_config,
                namespace_fields,
                pretty_print,
                transform_config,
                attachment_mapping,
            )
        else:
            # Fallback to simple ElementTree for backward compatibility
            return self._generate_simple_xml(data, root_element_name, pretty_print)

    def _generate_xml_with_namespaces(
        self,
        data: dict,
        root_element_name: str,
        namespace_config: dict,
        namespace_fields: dict,
        pretty_print: bool = True,
        transform_config: dict | None = None,
        attachment_mapping: dict[str, AttachmentInfo] | None = None,
    ) -> str:
        """Generate XML with namespace support using lxml."""
        default_namespace = namespace_config.get("default", "")

        # Get version from config
        xml_config = (transform_config or {}).get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        form_version = xml_structure.get("version")

        # Create namespace map for lxml with all required namespaces
        nsmap = {
            "SF424_4_0": default_namespace,  # SF424 namespace with prefix
        }

        # Add additional namespaces
        for prefix, uri in namespace_config.items():
            if prefix != "default":
                nsmap[prefix] = uri

        # Add globLib namespace if any fields use it
        if any(ns == "globLib" for ns in namespace_fields.values()):
            nsmap["globLib"] = "http://apply.grants.gov/system/GlobalLibrary-V2.0"

        # Create root element with proper namespace prefix
        if default_namespace:
            root_element_with_namespace = f"{{{default_namespace}}}{root_element_name}"
            root = lxml_etree.Element(root_element_with_namespace, nsmap=nsmap)

            # Add FormVersion attribute with proper namespace prefix
            root.set(f"{{{default_namespace}}}FormVersion", form_version)
        else:
            root = lxml_etree.Element(root_element_name, nsmap=nsmap)

        # Add data elements with namespace support in correct order
        # Get XSD URL from config for dynamic ordering
        xml_config = (transform_config or {}).get("_xml_config", {})
        xsd_url = xml_config.get(
            "xsd_url", "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd"
        )

        # Get attachment field configuration
        attachment_field_config = xml_config.get("attachment_fields", {})
        attachment_field_names = set(attachment_field_config.keys())

        # Add regular form elements (excluding attachments)
        self._add_ordered_form_elements(
            root, data, nsmap, namespace_fields, xsd_url, attachment_field_names
        )

        # Add attachment elements if present in data
        attachment_transformer = AttachmentTransformer(
            attachment_mapping=attachment_mapping or {},
            attachment_field_config=attachment_field_config,
        )
        attachment_transformer.add_attachment_elements(root, data, nsmap)

        # Generate XML string
        if pretty_print:
            xml_bytes = lxml_etree.tostring(
                root, encoding="utf-8", xml_declaration=True, pretty_print=True
            )
        else:
            xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)

        return xml_bytes.decode("utf-8").strip()

    def _generate_simple_xml(
        self, data: dict, root_element_name: str, pretty_print: bool = True
    ) -> str:
        """Generate simple XML without namespace support (backward compatibility)."""
        root = ET.Element(root_element_name)

        # Add data elements
        for field_name, value in data.items():
            self._add_element_to_parent(root, field_name, value)

        # Generate XML string
        if pretty_print:
            ET.indent(root, space="  ")
        xml_string = ET.tostring(root, encoding="unicode", xml_declaration=True)

        return xml_string

    def _extract_namespace_fields(self, transform_config: dict) -> dict[str, str]:
        """Extract namespace configuration from transform rules.

        Args:
            transform_config: The transformation configuration dictionary

        Returns:
            Dictionary mapping field names to their namespace prefixes
        """
        namespace_fields = {}

        def extract_from_rules(rules: dict, path: str = "") -> None:
            """Recursively extract namespace information from rules."""
            for key, value in rules.items():
                if key.startswith("_"):  # Skip metadata keys
                    continue

                if isinstance(value, dict):
                    # Check if this field has XML transform with namespace
                    if "xml_transform" in value:
                        xml_transform = value["xml_transform"]
                        if "namespace" in xml_transform and "target" in xml_transform:
                            target_name = xml_transform["target"]
                            namespace = xml_transform["namespace"]
                            namespace_fields[target_name] = namespace

                    # Recursively check nested fields
                    extract_from_rules(value, f"{path}.{key}" if path else key)

        extract_from_rules(transform_config)
        return namespace_fields

    def _get_xsd_element_order(self, xsd_url: str, root_element: str = "SF424_4_0") -> list[str]:
        """Extract element order from XSD schema root element.

        Args:
            xsd_url: URL to the XSD schema file
            root_element: Name of the root element to analyze

        Returns:
            List of element names in the order they appear in the XSD sequence
        """
        try:
            # Download and parse the XSD
            response = requests.get(xsd_url, timeout=30)
            response.raise_for_status()
            xsd_root = lxml_etree.fromstring(response.content)

            # XSD namespace
            xs_ns = {"xs": "http://www.w3.org/2001/XMLSchema"}

            # Find the root element definition
            root_element_def = xsd_root.xpath(
                f"//xs:element[@name='{root_element}']", namespaces=xs_ns
            )

            if not root_element_def:
                raise ValueError(
                    f"Root element '{root_element}' not found in XSD schema at {xsd_url}"
                )

            # Extract elements from the root element's complexType
            elements = self._extract_elements_from_complex_type(root_element_def[0], xs_ns)

            if not elements:
                raise ValueError(
                    f"No elements found in XSD schema at {xsd_url} for root element '{root_element}'"
                )

            logger.info(f"Extracted {len(elements)} elements from XSD: {xsd_url}")
            return elements

        except Exception as e:
            logger.error(f"Failed to extract element order from XSD {xsd_url}: {e}")
            raise ValueError(f"Could not parse XSD schema from {xsd_url}: {e}") from e

    def _get_complex_type_element_order(
        self,
        xsd_url: str,
        complex_type_name: str,
        import_namespaces: tuple[str, ...] | None = None,
    ) -> list[str]:
        """Generic method to extract element order from any XSD complexType.

        Args:
            xsd_url: URL to the XSD schema file
            complex_type_name: Name of the complexType to extract elements from
            import_namespaces: List of namespace URIs to search in imported schemas

        Returns:
            List of element names in XSD order
        """
        try:
            # Download and parse the main XSD
            response = requests.get(xsd_url, timeout=30)
            response.raise_for_status()
            xsd_root = lxml_etree.fromstring(response.content)

            # XSD namespace
            xs_ns = {"xs": "http://www.w3.org/2001/XMLSchema"}

            # First try to find the complexType in the main XSD
            complex_type = xsd_root.xpath(
                f"//xs:complexType[@name='{complex_type_name}']", namespaces=xs_ns
            )

            # If not found and import namespaces are specified, search imported schemas
            if not complex_type and import_namespaces:
                for namespace_uri in import_namespaces:
                    imports = xsd_root.xpath(
                        f"//xs:import[@namespace='{namespace_uri}']", namespaces=xs_ns
                    )
                    for import_elem in imports:
                        import_url = import_elem.get("schemaLocation")
                        if import_url:
                            try:
                                import_response = requests.get(import_url, timeout=30)
                                import_response.raise_for_status()
                                import_xsd = lxml_etree.fromstring(import_response.content)
                                complex_type = import_xsd.xpath(
                                    f"//xs:complexType[@name='{complex_type_name}']",
                                    namespaces=xs_ns,
                                )
                                if complex_type:
                                    logger.info(
                                        f"Found {complex_type_name} in imported schema: {import_url}"
                                    )
                                    break
                            except Exception as e:
                                logger.warning(
                                    f"Failed to fetch imported XSD from {import_url}: {e}"
                                )
                    if complex_type:
                        break

            if not complex_type:
                raise ValueError(
                    f"ComplexType '{complex_type_name}' not found in XSD schema at {xsd_url}"
                )

            # Extract elements from the complexType
            elements = self._extract_elements_from_complex_type(complex_type[0], xs_ns)

            if not elements:
                raise ValueError(
                    f"No elements found in complexType '{complex_type_name}' at {xsd_url}"
                )

            logger.info(
                f"Extracted {len(elements)} elements from complexType '{complex_type_name}'"
            )
            return elements

        except Exception as e:
            logger.error(
                f"Failed to extract elements from complexType '{complex_type_name}' in XSD {xsd_url}: {e}"
            )
            raise ValueError(
                f"Could not parse complexType '{complex_type_name}' from XSD schema at {xsd_url}: {e}"
            ) from e

    def _extract_elements_from_complex_type(self, complex_type_elem: Any, xs_ns: dict) -> list[str]:
        """Extract element names from a complexType definition.

        Args:
            complex_type_elem: The complexType XML element
            xs_ns: XSD namespace mapping

        Returns:
            List of element names in order
        """
        elements = []

        # Look for sequence within the complexType
        sequences = complex_type_elem.xpath(".//xs:sequence", namespaces=xs_ns)

        for sequence in sequences:
            # Get direct children of sequence (elements, choices, groups, etc.)
            children = sequence.xpath("./xs:element | ./xs:choice | ./xs:group", namespaces=xs_ns)

            for child in children:
                if child.tag.endswith("element"):
                    # Direct element
                    name = child.get("name")
                    if name:
                        elements.append(name)
                elif child.tag.endswith("choice"):
                    # Choice element - get all options
                    choice_elements = child.xpath(".//xs:element[@name]", namespaces=xs_ns)
                    for choice_elem in choice_elements:
                        name = choice_elem.get("name")
                        if name:
                            elements.append(name)
                elif child.tag.endswith("group"):
                    # Group reference - could be expanded further if needed
                    logger.debug(f"Found group reference: {child.get('ref')}")

        return elements

    def _get_address_element_order(self, xsd_url: str) -> list[str]:
        """Extract address element order from XSD schema.

        Args:
            xsd_url: URL to the XSD schema file

        Returns:
            List of address element names in XSD order
        """
        return self._get_complex_type_element_order(
            xsd_url=xsd_url,
            complex_type_name="AddressDataTypeV3",
            import_namespaces=("http://apply.grants.gov/system/GlobalLibrary-V2.0",),
        )

    def get_element_order_for_type(
        self, xsd_url: str, type_name: str, search_imports: bool = True
    ) -> list[str]:
        """Public method to get element order for any XSD type.

        This method can be used by other parts of the system that need to understand
        XSD structure for validation, documentation, or other purposes.

        Args:
            xsd_url: URL to the XSD schema file
            type_name: Name of the complexType or root element to analyze
            search_imports: Whether to search imported schemas for the type

        Returns:
            List of element names in XSD order

        Example:
            # Get element order for a specific complexType
            order = service.get_element_order_for_type(
                "https://example.com/schema.xsd",
                "PersonDataType",
                search_imports=True
            )
        """
        # Common import namespaces for Grants.gov schemas
        common_imports = (
            (
                "http://apply.grants.gov/system/GlobalLibrary-V2.0",
                "http://apply.grants.gov/system/Global-V1.0",
            )
            if search_imports
            else None
        )

        return self._get_complex_type_element_order(
            xsd_url=xsd_url, complex_type_name=type_name, import_namespaces=common_imports
        )

    def _add_lxml_element_to_parent(
        self,
        parent: Any,
        field_name: str,
        value: Any,
        nsmap: dict,
        namespace_fields: dict,
        xsd_url: str | None = None,
    ) -> None:
        """Add an element to a parent using lxml with proper namespace handling."""
        if isinstance(value, dict):
            # Create nested element for dictionary values
            if field_name in namespace_fields:
                # Use configured namespace
                namespace_prefix = namespace_fields[field_name]
                namespace_uri = nsmap.get(namespace_prefix, "")
                element_name = f"{{{namespace_uri}}}{field_name}"
                nested_element = lxml_etree.SubElement(parent, element_name)
            else:
                # Use default namespace (SF424_4_0)
                default_namespace = nsmap.get("SF424_4_0", "")
                if default_namespace:
                    element_name = f"{{{default_namespace}}}{field_name}"
                    nested_element = lxml_etree.SubElement(parent, element_name)
                else:
                    nested_element = lxml_etree.SubElement(parent, field_name)

            # Special handling for Applicant address to ensure correct sequence order
            if field_name == "Applicant":
                if not xsd_url:
                    raise ValueError("XSD URL is required for address element ordering")
                self._add_ordered_address_elements(
                    nested_element, value, nsmap, namespace_fields, xsd_url
                )
            else:
                for nested_field, nested_value in value.items():
                    if nested_value is not None or nested_value == "INCLUDE_NULL_MARKER":
                        self._add_lxml_element_to_parent(
                            nested_element,
                            nested_field,
                            nested_value,
                            nsmap,
                            namespace_fields,
                            xsd_url,
                        )
        elif value == "INCLUDE_NULL_MARKER" or value is None:
            # Create empty element for INCLUDE_NULL_MARKER values or handle None values
            if value == "INCLUDE_NULL_MARKER":
                # This is a None value that should be included as empty element
                if field_name in namespace_fields:
                    namespace_prefix = namespace_fields[field_name]
                    namespace_uri = nsmap.get(namespace_prefix, "")
                    element_name = f"{{{namespace_uri}}}{field_name}"
                    lxml_etree.SubElement(parent, element_name)
                else:
                    default_namespace = nsmap.get("SF424_4_0", "")
                    if default_namespace:
                        element_name = f"{{{default_namespace}}}{field_name}"
                        lxml_etree.SubElement(parent, element_name)
                    else:
                        lxml_etree.SubElement(parent, field_name)
            # If value is None (not INCLUDE_NULL_MARKER), skip it - it should be excluded
        else:
            # Simple value - create element with text content
            if field_name in namespace_fields:
                namespace_prefix = namespace_fields[field_name]
                namespace_uri = nsmap.get(namespace_prefix, "")
                element_name = f"{{{namespace_uri}}}{field_name}"
                element = lxml_etree.SubElement(parent, element_name)
            else:
                default_namespace = nsmap.get("SF424_4_0", "")
                if default_namespace:
                    element_name = f"{{{default_namespace}}}{field_name}"
                    element = lxml_etree.SubElement(parent, element_name)
                else:
                    element = lxml_etree.SubElement(parent, field_name)
            element.text = str(value)

    def _add_ordered_address_elements(
        self, parent: Any, address_data: dict, nsmap: dict, namespace_fields: dict, xsd_url: str
    ) -> None:
        """Add address elements in the correct sequence order.

        Dynamically extracts the correct order from the XSD schema.
        """
        # Get element order from XSD schema
        address_order = self._get_address_element_order(xsd_url)

        # Add elements in the correct order
        for field_name in address_order:
            if field_name in address_data:
                field_value = address_data[field_name]
                if field_value is not None:
                    self._add_lxml_element_to_parent(
                        parent, field_name, field_value, nsmap, namespace_fields, xsd_url
                    )

    def _add_ordered_form_elements(
        self,
        root: Any,
        data: dict,
        nsmap: dict,
        namespace_fields: dict,
        xsd_url: str,
        attachment_fields: set[str] | None = None,
    ) -> None:
        """Add form elements in the correct sequence order for SF424.

        Dynamically extracts the correct order from the XSD schema.

        Args:
            root: Root XML element
            data: Data dictionary
            nsmap: Namespace map
            namespace_fields: Field to namespace mapping
            xsd_url: URL to XSD schema
            attachment_fields: Set of field names that are attachments (handled separately)
        """
        # Default attachment fields if not provided (for backward compatibility)
        if attachment_fields is None:
            attachment_fields = set()

        # Get element order from XSD schema
        sf424_order = self._get_xsd_element_order(xsd_url)

        # Add elements in the correct order (skip attachment fields)
        for field_name in sf424_order:
            if field_name in data and field_name not in attachment_fields:
                field_value = data[field_name]
                if field_value is not None:
                    self._add_lxml_element_to_parent(
                        root, field_name, field_value, nsmap, namespace_fields, xsd_url
                    )

        # Add any remaining fields that weren't in the predefined order (skip attachment fields)
        for field_name, field_value in data.items():
            if (
                field_name not in sf424_order
                and field_name not in attachment_fields
                and field_value is not None
            ):
                self._add_lxml_element_to_parent(
                    root, field_name, field_value, nsmap, namespace_fields, xsd_url
                )

    def _add_element_to_parent(self, parent: ET.Element, field_name: str, value: Any) -> None:
        """Add an element to a parent, handling both simple values and nested dictionaries."""
        if isinstance(value, dict):
            # Create nested element for dictionary values
            nested_element = ET.SubElement(parent, field_name)
            for nested_field, nested_value in value.items():
                if nested_value is not None:
                    self._add_element_to_parent(nested_element, nested_field, nested_value)
        elif value is None:
            # Create empty element for None values (when include_null is configured)
            ET.SubElement(parent, field_name)
        else:
            # Simple value - create element with text content
            element = ET.SubElement(parent, field_name)
            element.text = str(value)
