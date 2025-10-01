"""Core XML generation service."""

import logging
import re
import xml.etree.ElementTree as ET
from typing import Any

from lxml import etree as lxml_etree

from .config import load_xml_transform_config
from .models import XMLGenerationRequest, XMLGenerationResponse
from .transformers.base_transformer import RecursiveXMLTransformer

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
                transformed_data, transform_config, request.pretty_print
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
        self, data: dict, transform_config: dict, pretty_print: bool = True
    ) -> str:
        """Generate XML string from transformed data."""
        # Get XML configuration from the config metadata
        xml_config = transform_config.get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        root_element_name = xml_structure.get("root_element", "SF424_4_0")

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
                xml_structure,
                pretty_print,
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
        xml_structure: dict,
        pretty_print: bool = True,
    ) -> str:
        """Generate XML with namespace support using lxml."""
        default_namespace = namespace_config.get("default", "")
        form_version = xml_structure.get("version")
        if not form_version:
            raise ValueError(
                f"Missing required 'version' in xml_structure configuration for form {root_element_name}"
            )

        # Create namespace map for lxml with all required namespaces
        nsmap = {}

        # Add the default namespace with the form's root element name as prefix
        if default_namespace:
            nsmap[root_element_name] = default_namespace

        # Add additional namespaces from config
        for prefix, uri in namespace_config.items():
            if prefix != "default":
                nsmap[prefix] = uri

        # Create root element with proper namespace prefix
        if default_namespace:
            root_element_with_namespace = f"{{{default_namespace}}}{root_element_name}"
            root = lxml_etree.Element(root_element_with_namespace, nsmap=nsmap)

            # Add FormVersion attribute with proper namespace prefix
            root.set(f"{{{default_namespace}}}FormVersion", form_version)
        else:
            root = lxml_etree.Element(root_element_name, nsmap=nsmap)

        # Add data elements with namespace support
        for field_name, value in data.items():
            self._add_lxml_element_to_parent(
                root,
                field_name,
                value,
                nsmap,
                namespace_fields,
                root_element_name,
                default_namespace,
            )

        # Generate XML string
        if pretty_print:
            xml_bytes = lxml_etree.tostring(
                root, encoding="utf-8", xml_declaration=True, pretty_print=True
            )
        else:
            xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)

        xml_string = xml_bytes.decode("utf-8").strip()

        # Post-process to add individual namespace declarations to elements
        xml_string = self._add_individual_namespace_declarations(
            xml_string, nsmap, namespace_fields
        )

        return xml_string

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

    def _get_element_name(
        self,
        field_name: str,
        namespace_fields: dict,
        nsmap: dict,
        root_element_name: str,
        default_namespace: str,
    ) -> str:
        """Get the properly namespaced element name for a field.

        Args:
            field_name: The field name to create an element for
            namespace_fields: Dictionary mapping field names to their namespace prefixes
            nsmap: Namespace map with prefix -> URI mappings
            root_element_name: The root element name (used as default namespace prefix)
            default_namespace: The default namespace URI

        Returns:
            The properly formatted element name with namespace
        """
        if field_name in namespace_fields:
            # Use configured namespace
            namespace_prefix = namespace_fields[field_name]
            namespace_uri = nsmap.get(namespace_prefix, "")
            return f"{{{namespace_uri}}}{field_name}"
        else:
            # Use default namespace
            if default_namespace:
                return f"{{{default_namespace}}}{field_name}"
            else:
                return field_name

    def _add_lxml_element_to_parent(
        self,
        parent: Any,
        field_name: str,
        value: Any,
        nsmap: dict,
        namespace_fields: dict,
        root_element_name: str,
        default_namespace: str,
    ) -> None:
        """Add an element to a parent using lxml with proper namespace handling."""
        if isinstance(value, dict):
            # Create nested element for dictionary values with individual namespace declaration
            element_name = self._get_element_name(
                field_name, namespace_fields, nsmap, root_element_name, default_namespace
            )
            element_nsmap = self._get_element_nsmap(field_name, namespace_fields, nsmap)
            nested_element = lxml_etree.SubElement(parent, element_name, nsmap=element_nsmap)

            for nested_field, nested_value in value.items():
                if nested_value is not None:
                    self._add_lxml_element_to_parent(
                        nested_element,
                        nested_field,
                        nested_value,
                        nsmap,
                        namespace_fields,
                        root_element_name,
                        default_namespace,
                    )
        elif value is None:
            # Create empty element for None values (when include_null is configured)
            element_name = self._get_element_name(
                field_name, namespace_fields, nsmap, root_element_name, default_namespace
            )
            element_nsmap = self._get_element_nsmap(field_name, namespace_fields, nsmap)
            lxml_etree.SubElement(parent, element_name, nsmap=element_nsmap)
        else:
            # Simple value - create element with text content and individual namespace declaration
            element_name = self._get_element_name(
                field_name, namespace_fields, nsmap, root_element_name, default_namespace
            )
            element_nsmap = self._get_element_nsmap(field_name, namespace_fields, nsmap)
            element = lxml_etree.SubElement(parent, element_name, nsmap=element_nsmap)
            element.text = str(value)

    def _get_element_nsmap(self, field_name: str, namespace_fields: dict, nsmap: dict) -> dict:
        if field_name in namespace_fields:
            # This field uses a configured namespace, include its declaration
            namespace_prefix = namespace_fields[field_name]
            namespace_uri = nsmap.get(namespace_prefix, "")
            if namespace_uri and namespace_prefix:
                return {namespace_prefix: namespace_uri}
        return {}

    def _add_individual_namespace_declarations(
        self, xml_string: str, nsmap: dict, namespace_fields: dict
    ) -> str:
        """Add individual namespace declarations to elements that use non-default namespaces."""
        # For each field that uses a namespace, add the declaration to its element
        for field_name, namespace_prefix in namespace_fields.items():
            namespace_uri = nsmap.get(namespace_prefix, "")
            if not (namespace_uri and namespace_prefix):
                continue

            # Pattern to match opening tags for this field with namespace prefix
            pattern = f"<{namespace_prefix}:{field_name}([^>]*)>"
            xmlns_declaration = f'xmlns:{namespace_prefix}="{namespace_uri}"'

            xml_string = self._replace_element_with_xmlns(
                xml_string, pattern, field_name, namespace_prefix, xmlns_declaration
            )

        return xml_string

    def _replace_element_with_xmlns(
        self,
        xml_string: str,
        pattern: str,
        field_name: str,
        namespace_prefix: str,
        xmlns_declaration: str,
    ) -> str:
        """Replace elements matching the pattern with xmlns declarations added."""

        def add_xmlns_to_match(match: re.Match[str]) -> str:
            return self._add_xmlns_to_element(
                match, field_name, namespace_prefix, xmlns_declaration
            )

        return re.sub(pattern, add_xmlns_to_match, xml_string)

    def _add_xmlns_to_element(
        self, match: re.Match[str], field_name: str, namespace_prefix: str, xmlns_declaration: str
    ) -> str:
        """Add xmlns declaration to a matched element if not already present."""
        existing_attrs = match.group(1)

        # Check if xmlns declaration is already present
        if f"xmlns:{namespace_prefix}=" in existing_attrs:
            return match.group(0)  # Return unchanged if already has xmlns

        # Add the xmlns declaration
        if existing_attrs.strip():
            return f"<{namespace_prefix}:{field_name} {xmlns_declaration}{existing_attrs}>"
        else:
            return f"<{namespace_prefix}:{field_name} {xmlns_declaration}>"

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
