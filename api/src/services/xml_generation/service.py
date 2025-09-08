"""Core XML generation service."""

import logging
import xml.etree.ElementTree as ET

from .config import XMLTransformationConfig
from .models import XMLGenerationRequest, XMLGenerationResponse
from .transformers.base_transformer import BaseTransformer

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
            config = XMLTransformationConfig(request.form_name)

            # Transform the data
            transformer = BaseTransformer(config)
            transformed_data = transformer.transform(request.application_data)

            # Generate XML
            xml_string = self._generate_xml_string(transformed_data, config)

            # Log transformation results for development
            logger.info(
                f"XML generation successful: {len(transformed_data)} fields transformed from {len(request.application_data)} input fields for {request.form_name}"
            )

            return XMLGenerationResponse(success=True, xml_data=xml_string)

        except Exception as e:
            logger.error(f"XML generation failed: {e}")
            return XMLGenerationResponse(success=False, error_message=str(e))

    def _generate_xml_string(self, data: dict, config: XMLTransformationConfig) -> str:
        """Generate XML string from transformed data."""
        # Get XML structure configuration
        xml_structure = config.get_xml_structure()
        root_element_name = xml_structure.get("root_element", "SF424_4_0")

        # Get namespace configuration
        namespace_config = config.get_namespace_config()
        default_namespace = namespace_config.get("default", "")

        # Create root element
        if default_namespace:
            root = ET.Element(root_element_name, xmlns=default_namespace)
        else:
            root = ET.Element(root_element_name)

        # Add data elements
        for field_name, value in data.items():
            if value is not None:
                element = ET.SubElement(root, field_name)
                element.text = str(value)

        # Generate XML string
        ET.indent(root, space="  ")
        xml_string = ET.tostring(root, encoding="unicode", xml_declaration=True)

        return xml_string
