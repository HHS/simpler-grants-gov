"""Core XML generation service."""

import logging
import xml.etree.ElementTree as ET
from typing import Any

from lxml import etree as lxml_etree

from .models import XMLGenerationRequest, XMLGenerationResponse
from .transformers.attachment_transformer import AttachmentTransformer
from .transformers.base_transformer import RecursiveXMLTransformer
from .utils.attachment_mapping import AttachmentInfo

logger = logging.getLogger(__name__)


def _is_attribute_metadata_key(field_name: str) -> bool:
    """Check if a field name is an attribute or other metadata key.

    Metadata keys start with double underscores and include:
    - __field__attributes: Field-specific attributes
    - __root_attributes__: Root element attributes
    - __wrapper: Wrapper element name for array items
    """
    return field_name.startswith("__")


class XMLGenerationService:
    """Service for generating XML from JSON application data."""

    def generate_xml(self, request: XMLGenerationRequest) -> XMLGenerationResponse:
        """Generate XML from application data.

        Args:
            request: XML generation request containing application data and transform config

        Returns:
            XML generation response with generated XML or error information
        """
        try:
            # Validate input data
            if not request.application_data:
                return XMLGenerationResponse(
                    success=False, error_message="No application data provided"
                )

            # Transform the data using recursive transformer
            transformer = RecursiveXMLTransformer(request.transform_config)
            transformed_data = transformer.transform(request.application_data)

            # Generate XML
            xml_string = self._generate_xml_string(
                transformed_data,
                request.transform_config,
                request.pretty_print,
                request.attachment_mapping,
            )

            # Log transformation results for development
            logger.info(
                f"XML generation successful: {len(transformed_data)} fields transformed from {len(request.application_data)} input fields"
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

        # Version is optional (SF-424 uses it, SF-424A does not)

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

        # Get version and namespace prefix from config
        xml_config = (transform_config or {}).get("_xml_config", {})
        xml_structure = xml_config.get("xml_structure", {})
        form_version = xml_structure.get("version")
        root_namespace_prefix = xml_structure.get("root_namespace_prefix", root_element_name)

        # Create namespace map for lxml with all required namespaces
        # Use configured namespace prefix for root element (or fall back to root element name)
        nsmap = {
            root_namespace_prefix: default_namespace,
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

            # Add FormVersion attribute if present (SF-424 uses this, SF-424A does not)
            if form_version:
                root.set(f"{{{default_namespace}}}FormVersion", form_version)
        else:
            root = lxml_etree.Element(root_element_name, nsmap=nsmap)

        # Add root attributes from transformed data (preserved by transformer)
        # Root attributes are stored in a special key by the transformer
        root_attr_values = data.get("__root_attributes__", {})
        if root_attr_values:
            for attr_name, attr_value in root_attr_values.items():
                # Determine namespace for the attribute
                if ":" in attr_name:
                    # Attribute has explicit namespace prefix (e.g., "glob:coreSchemaVersion")
                    namespace_prefix, attr_local_name = attr_name.split(":", 1)
                    if namespace_prefix in nsmap:
                        attr_qualified_name = f"{{{nsmap[namespace_prefix]}}}{attr_local_name}"
                    else:
                        attr_qualified_name = attr_name
                else:
                    # Use default namespace for the attribute
                    attr_qualified_name = f"{{{default_namespace}}}{attr_name}"

                if attr_value is not None:
                    root.set(attr_qualified_name, str(attr_value))

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
            root,
            data,
            nsmap,
            namespace_fields,
            transform_config or {},
            xsd_url,
            attachment_field_names,
            root_namespace_prefix,  # Use namespace prefix for lookups in nsmap
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

    def _get_element_order_from_config(
        self, transform_config: dict, nested_path: str | None = None
    ) -> list[str]:
        """Extract element order from transformation config based on rule definition order.

        Args:
            transform_config: The transformation configuration dictionary
            nested_path: Optional path to nested object (e.g., "applicant_address")

        Returns:
            List of target element names in the order they're defined in config
        """
        element_order = []

        # Navigate to nested config if path is provided
        config_to_process = transform_config
        if nested_path:
            # Split path and navigate (e.g., "applicant_address" -> nested rules)
            if nested_path in transform_config:
                config_to_process = transform_config[nested_path]

        # Extract target element names from xml_transform rules in order
        for key, value in config_to_process.items():
            # Skip metadata and non-transform fields
            if key.startswith("_") or not isinstance(value, dict):
                continue

            xml_transform = value.get("xml_transform")
            if xml_transform and isinstance(xml_transform, dict):
                # Handle conditional transforms (e.g., one-to-many)
                if xml_transform.get("type") == "conditional":
                    conditional_transform = xml_transform.get("conditional_transform", {})
                    conditional_type = conditional_transform.get("type")

                    if conditional_type == "one_to_many":
                        # Expand one-to-many pattern into actual field names
                        target_pattern = conditional_transform.get("target_pattern")
                        max_count = conditional_transform.get("max_count", 10)
                        if target_pattern:
                            for i in range(1, max_count + 1):
                                field_name = target_pattern.format(index=i)
                                element_order.append(field_name)
                    elif conditional_type == "array_decomposition" and not xml_transform.get(
                        "target"
                    ):
                        # Array decomposition without target spreads fields - add output field names
                        field_mappings = conditional_transform.get("field_mappings", {})
                        for output_field_name in field_mappings.keys():
                            element_order.append(output_field_name)
                    else:
                        # Other conditional types - use target if available
                        target = xml_transform.get("target")
                        if target:
                            element_order.append(target)
                else:
                    # Regular transform - use target
                    target = xml_transform.get("target")
                    if target:
                        element_order.append(target)

        return element_order

    def _add_lxml_element_to_parent(
        self,
        parent: Any,
        field_name: str,
        value: Any,
        nsmap: dict,
        namespace_fields: dict,
        xsd_url: str | None = None,
        transform_config: dict | None = None,
        root_element_name: str | None = None,
        attributes: dict[str, str] | None = None,
    ) -> None:
        """Add an element to a parent using lxml with proper namespace handling."""
        if isinstance(value, list):
            # Handle arrays - create wrapper element first, then add items
            if field_name in namespace_fields:
                namespace_prefix = namespace_fields[field_name]
                namespace_uri = nsmap.get(namespace_prefix, "")
                element_name = f"{{{namespace_uri}}}{field_name}"
                wrapper_element = lxml_etree.SubElement(parent, element_name)
            else:
                default_namespace_uri = (
                    nsmap.get(root_element_name or "", "") if root_element_name else ""
                )
                if default_namespace_uri:
                    element_name = f"{{{default_namespace_uri}}}{field_name}"
                    wrapper_element = lxml_etree.SubElement(parent, element_name)
                else:
                    wrapper_element = lxml_etree.SubElement(parent, field_name)

            # Add each item in the array
            for item in value:
                if isinstance(item, dict):
                    # Check for __wrapper and __attributes metadata
                    item_wrapper = item.get("__wrapper")
                    item_attributes = item.get("__attributes", {})

                    # Create a copy of item without metadata keys
                    item_data = {k: v for k, v in item.items() if not k.startswith("__")}

                    # Use wrapper as element name, or default to field_name
                    item_element_name = item_wrapper if item_wrapper else field_name

                    # Create the item element
                    if item_element_name in namespace_fields:
                        namespace_prefix = namespace_fields[item_element_name]
                        namespace_uri = nsmap.get(namespace_prefix, "")
                        full_element_name = f"{{{namespace_uri}}}{item_element_name}"
                        item_element = lxml_etree.SubElement(wrapper_element, full_element_name)
                    else:
                        default_namespace_uri = (
                            nsmap.get(root_element_name or "", "") if root_element_name else ""
                        )
                        if default_namespace_uri:
                            full_element_name = f"{{{default_namespace_uri}}}{item_element_name}"
                            item_element = lxml_etree.SubElement(wrapper_element, full_element_name)
                        else:
                            item_element = lxml_etree.SubElement(wrapper_element, item_element_name)

                    # Add attributes to the item element
                    if item_attributes:
                        for attr_name, attr_value in item_attributes.items():
                            # Handle namespaced attributes
                            if ":" in attr_name:
                                prefix, local_name = attr_name.split(":", 1)
                                if prefix in nsmap:
                                    attr_qname = f"{{{nsmap[prefix]}}}{local_name}"
                                    item_element.set(attr_qname, str(attr_value))
                                else:
                                    item_element.set(attr_name, str(attr_value))
                            else:
                                # For non-namespaced attributes, add namespace prefix
                                if root_element_name and root_element_name in nsmap:
                                    attr_qname = f"{{{nsmap[root_element_name]}}}{attr_name}"
                                    item_element.set(attr_qname, str(attr_value))
                                else:
                                    item_element.set(attr_name, str(attr_value))

                    # Add the data fields as child elements
                    for data_field, data_value in item_data.items():
                        if data_value is not None:
                            self._add_lxml_element_to_parent(
                                item_element,
                                data_field,
                                data_value,
                                nsmap,
                                namespace_fields,
                                xsd_url,
                                transform_config,
                                root_element_name,
                            )
                else:
                    # Simple value in array - create element with field_name
                    if field_name in namespace_fields:
                        namespace_prefix = namespace_fields[field_name]
                        namespace_uri = nsmap.get(namespace_prefix, "")
                        element_name = f"{{{namespace_uri}}}{field_name}"
                        item_element = lxml_etree.SubElement(wrapper_element, element_name)
                    else:
                        default_namespace_uri = (
                            nsmap.get(root_element_name or "", "") if root_element_name else ""
                        )
                        if default_namespace_uri:
                            element_name = f"{{{default_namespace_uri}}}{field_name}"
                            item_element = lxml_etree.SubElement(wrapper_element, element_name)
                        else:
                            item_element = lxml_etree.SubElement(wrapper_element, field_name)
                    item_element.text = str(item)

        elif isinstance(value, dict):
            # Check if value contains __attributes metadata
            # nested_object transforms with an "attributes" config. This allows the transform
            # configuration to specify which source fields should become XML attributes on the
            # parent element. For example, in SF-LLL, entity_type becomes the ReportEntityType
            # attribute on the ReportEntity element.
            #
            # We only use embedded attributes if none were passed as a parameter, giving
            # explicit parameters precedence over metadata.
            value_attributes = value.get("__attributes")
            if value_attributes and not attributes:
                attributes = value_attributes

            # Create nested element for dictionary values
            if field_name in namespace_fields:
                # Use configured namespace
                namespace_prefix = namespace_fields[field_name]
                namespace_uri = nsmap.get(namespace_prefix, "")
                element_name = f"{{{namespace_uri}}}{field_name}"
                nested_element = lxml_etree.SubElement(parent, element_name)
            else:
                # Use default namespace (derived from root element name)
                default_namespace_uri = (
                    nsmap.get(root_element_name or "", "") if root_element_name else ""
                )
                if default_namespace_uri:
                    element_name = f"{{{default_namespace_uri}}}{field_name}"
                    nested_element = lxml_etree.SubElement(parent, element_name)
                else:
                    nested_element = lxml_etree.SubElement(parent, field_name)

            # Add attributes if present
            if attributes:
                for attr_name, attr_value in attributes.items():
                    # Handle namespaced attributes
                    if ":" in attr_name:
                        prefix, local_name = attr_name.split(":", 1)
                        if prefix in nsmap:
                            attr_qname = f"{{{nsmap[prefix]}}}{local_name}"
                            nested_element.set(attr_qname, str(attr_value))
                        else:
                            nested_element.set(attr_name, str(attr_value))
                    else:
                        # Attribute without explicit namespace prefix
                        # Use the same namespace as the parent element
                        if field_name in namespace_fields:
                            # Element has explicit namespace - use it for the attribute
                            namespace_prefix = namespace_fields[field_name]
                            namespace_uri = nsmap.get(namespace_prefix, "")
                            if namespace_uri:
                                attr_qname = f"{{{namespace_uri}}}{attr_name}"
                                nested_element.set(attr_qname, str(attr_value))
                            else:
                                nested_element.set(attr_name, str(attr_value))
                        else:
                            # Use default namespace if available
                            default_namespace_uri = (
                                nsmap.get(root_element_name or "", "") if root_element_name else ""
                            )
                            if default_namespace_uri:
                                attr_qname = f"{{{default_namespace_uri}}}{attr_name}"
                                nested_element.set(attr_qname, str(attr_value))
                            else:
                                nested_element.set(attr_name, str(attr_value))

            # Special handling for Applicant address to ensure correct sequence order
            if field_name == "Applicant":
                if not xsd_url:
                    raise ValueError("XSD URL is required for address element ordering")
                self._add_ordered_address_elements(
                    nested_element,
                    value,
                    nsmap,
                    namespace_fields,
                    transform_config or {},
                    xsd_url,
                    root_element_name,
                )
            else:
                for nested_field, nested_value in value.items():
                    # Skip special metadata keys (like __wrapper, __attributes, etc.)
                    if nested_field.startswith("__"):
                        continue

                    if nested_value is not None or nested_value == "INCLUDE_NULL_MARKER":
                        # Check for attributes for nested fields
                        nested_attr_key = f"__{nested_field}__attributes"
                        nested_attributes = value.get(nested_attr_key, None)
                        self._add_lxml_element_to_parent(
                            nested_element,
                            nested_field,
                            nested_value,
                            nsmap,
                            namespace_fields,
                            xsd_url,
                            transform_config,
                            root_element_name,
                            nested_attributes,
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
                    default_namespace_uri = (
                        nsmap.get(root_element_name or "", "") if root_element_name else ""
                    )
                    if default_namespace_uri:
                        element_name = f"{{{default_namespace_uri}}}{field_name}"
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
                default_namespace_uri = (
                    nsmap.get(root_element_name or "", "") if root_element_name else ""
                )
                if default_namespace_uri:
                    element_name = f"{{{default_namespace_uri}}}{field_name}"
                    element = lxml_etree.SubElement(parent, element_name)
                else:
                    element = lxml_etree.SubElement(parent, field_name)

            element.text = str(value)

            # Add attributes if present
            if attributes:
                for attr_name, attr_value in attributes.items():
                    # Handle namespaced attributes
                    if ":" in attr_name:
                        prefix, local_name = attr_name.split(":", 1)
                        if prefix in nsmap:
                            attr_qname = f"{{{nsmap[prefix]}}}{local_name}"
                            element.set(attr_qname, str(attr_value))
                        else:
                            element.set(attr_name, str(attr_value))
                    else:
                        element.set(attr_name, str(attr_value))

    def _add_ordered_address_elements(
        self,
        parent: Any,
        address_data: dict,
        nsmap: dict,
        namespace_fields: dict,
        transform_config: dict,
        xsd_url: str,
        root_element_name: str | None,
    ) -> None:
        """Add address elements in the correct sequence order.

        Uses config-based ordering from transform rules. Element order is derived from
        the order fields are defined in the transform configuration.
        """
        # Get element order from config
        address_order = self._get_element_order_from_config(
            transform_config, nested_path="applicant"
        )

        # Add elements in the correct order
        for field_name in address_order:
            if field_name in address_data:
                field_value = address_data[field_name]
                if field_value is not None:
                    # Check for attributes for address fields
                    attr_key = f"__{field_name}__attributes"
                    attributes = address_data.get(attr_key, None)
                    self._add_lxml_element_to_parent(
                        parent,
                        field_name,
                        field_value,
                        nsmap,
                        namespace_fields,
                        xsd_url,
                        transform_config,
                        root_element_name,
                        attributes,
                    )

    def _add_ordered_form_elements(
        self,
        root: Any,
        data: dict,
        nsmap: dict,
        namespace_fields: dict,
        transform_config: dict,
        xsd_url: str,
        attachment_fields: set[str] | None = None,
        root_element_name: str | None = None,
    ) -> None:
        """Add form elements in the correct sequence order.

        Uses config-based ordering from transform rules. Element order is derived from
        the order fields are defined in the transform configuration.

        Args:
            root: Root XML element
            data: Data dictionary
            nsmap: Namespace map
            namespace_fields: Field to namespace mapping
            transform_config: Transformation configuration dictionary
            xsd_url: URL to XSD schema (kept for backward compatibility, not used)
            attachment_fields: Set of field names that are attachments (handled separately)
            root_element_name: Root element name (used as default namespace key)
        """
        # Default attachment fields if not provided (for backward compatibility)
        if attachment_fields is None:
            attachment_fields = set()

        # Get element order from transform configuration
        sf424_order = self._get_element_order_from_config(transform_config)

        # Add elements in the correct order (skip attachment fields and special keys)
        for field_name in sf424_order:
            # Skip special metadata keys (like __root_attributes__)
            if field_name.startswith("__"):
                continue

            if field_name in data and field_name not in attachment_fields:
                field_value = data[field_name]
                if field_value is not None:
                    # Check for attributes stored with special key
                    attr_key = f"__{field_name}__attributes"
                    attributes = data.get(attr_key, None)
                    self._add_lxml_element_to_parent(
                        root,
                        field_name,
                        field_value,
                        nsmap,
                        namespace_fields,
                        xsd_url,
                        transform_config,
                        root_element_name,
                        attributes,
                    )

        # Add any remaining fields that weren't in the predefined order (skip attachment and attribute metadata)
        for field_name, field_value in data.items():
            if (
                field_name not in sf424_order
                and field_name not in attachment_fields
                and not _is_attribute_metadata_key(field_name)
                and field_value is not None
            ):
                # Check for attributes stored with special key
                attr_key = f"__{field_name}__attributes"
                attributes = data.get(attr_key, None)
                self._add_lxml_element_to_parent(
                    root,
                    field_name,
                    field_value,
                    nsmap,
                    namespace_fields,
                    xsd_url,
                    transform_config,
                    root_element_name,
                    attributes,
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
