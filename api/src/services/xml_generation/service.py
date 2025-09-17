"""Core XML generation service."""

import logging
import xml.etree.ElementTree as ET
from typing import Any

from lxml import etree as lxml_etree

from .config import load_xml_transform_config
from .models import XMLGenerationRequest, XMLGenerationResponse
from .transformers.attachment_transformer import AttachmentTransformer
from .transformers.base_transformer import RecursiveXMLTransformer

logger = logging.getLogger(__name__)


class XMLGenerationService:
    """Service for generating XML from JSON application data."""

    def __init__(self) -> None:
        """Initialize the XML generation service."""
        self.attachment_transformer = AttachmentTransformer()

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

        # Use lxml for proper namespace handling
        if root_element_name == "SF424_4_0" and default_namespace:
            # Create namespace map for lxml with all required namespaces (matching Grants.gov format)
            nsmap = {
                "SF424_4_0": default_namespace,  # SF-424 namespace with prefix
                "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
                "glob": "http://apply.grants.gov/system/Global-V1.0",  # Global V1.0 for attachments
                "codes": "http://apply.grants.gov/system/UniversalCodes-V2.0",
                "att": "http://apply.grants.gov/system/Attachments-V1.0",  # Attachment namespace
            }

            # Create root element with proper namespace prefix (matching Grants.gov format)
            root_element_with_prefix = f"{{{default_namespace}}}{root_element_name}"
            root = lxml_etree.Element(root_element_with_prefix, nsmap=nsmap)

            # Add FormVersion attribute with proper namespace prefix
            root.set(f"{{{default_namespace}}}FormVersion", "4.0")

            # Add data elements using lxml with namespace context
            self._add_lxml_elements_to_parent(root, data, nsmap, transform_config)

            # Generate XML string with lxml
            if pretty_print:
                xml_bytes = lxml_etree.tostring(
                    root, encoding="utf-8", xml_declaration=True, pretty_print=True
                )
                xml_string = xml_bytes.decode("utf-8").strip()
            else:
                xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)
                xml_string = xml_bytes.decode("utf-8").strip()
        else:
            # Fallback to ElementTree for non-SF424 forms
            root_attributes = {}
            if default_namespace:
                root_attributes["xmlns"] = default_namespace

            root = ET.Element(root_element_name, root_attributes)

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
        
        def extract_from_rules(rules: dict, path: str = ""):
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

    def _add_lxml_elements_to_parent(self, parent: Any, data: dict, nsmap: dict, transform_config: dict) -> None:
        """Add elements to a parent using lxml, handling both simple values and nested dictionaries."""
        # Extract namespace configuration from transform rules
        namespace_fields = self._extract_namespace_fields(transform_config)

        # Define XSD element order for SF-424 root elements (complete sequence from XSD)
        sf424_element_order = [
            "SubmissionType",
            "ApplicationType",
            "RevisionType",
            "RevisionOtherSpecify",
            "DateReceived",
            "ApplicantID",
            "FederalEntityIdentifier",
            "FederalAwardIdentifier",
            "StateReceiveDate",
            "StateApplicationID",
            "OrganizationName",
            "EmployerTaxpayerIdentificationNumber",
            "SAMUEI",
            "Applicant",
            "DepartmentName",
            "DivisionName",
            "ContactPerson",
            "Title",
            "OrganizationAffiliation",
            "PhoneNumber",
            "Fax",
            "Email",
            "ApplicantTypeCode1",
            "ApplicantTypeCode2",
            "ApplicantTypeCode3",
            "ApplicantTypeOtherSpecify",
            "AgencyName",
            "CFDANumber",
            "CFDAProgramTitle",
            "FundingOpportunityNumber",
            "FundingOpportunityTitle",  # These were missing!
            "CompetitionIdentificationNumber",
            "CompetitionIdentificationTitle",
            "AreasAffected",
            "ProjectTitle",
            "AdditionalProjectTitle",
            "CongressionalDistrictApplicant",
            "CongressionalDistrictProgramProject",
            "AdditionalCongressionalDistricts",
            "ProjectStartDate",
            "ProjectEndDate",
            "FederalEstimatedFunding",
            "ApplicantEstimatedFunding",
            "StateEstimatedFunding",
            "LocalEstimatedFunding",
            "OtherEstimatedFunding",
            "ProgramIncomeEstimatedFunding",
            "TotalEstimatedFunding",
            "StateReview",
            "StateReviewAvailableDate",
            "DelinquentFederalDebt",
            "DebtExplanation",
            "CertificationAgree",
            "AuthorizedRepresentative",
            "AuthorizedRepresentativeTitle",
            "AuthorizedRepresentativePhoneNumber",
            "AuthorizedRepresentativeEmail",
            "AuthorizedRepresentativeFax",
            "AORSignature",
            "DateSigned",
        ]

        # Define attachment fields that need special handling
        attachment_fields = {
            "AreasAffected",
            "AdditionalProjectTitle",
            "AdditionalCongressionalDistricts",
            "DebtExplanation",
        }

        # Generate elements in XSD order with SF424_4_0 namespace prefix
        sf424_namespace = nsmap.get("SF424_4_0", "")
        for element_name in sf424_element_order:
            if element_name in data and data[element_name] is not None:
                value = data[element_name]

                # Special handling for attachment fields
                if element_name in attachment_fields:
                    # Create attachment element with SF424_4_0 prefix
                    attachment_element = lxml_etree.SubElement(
                        parent, f"{{{sf424_namespace}}}{element_name}"
                    )
                    self._populate_attachment_content(attachment_element, value, nsmap)
                elif isinstance(value, dict):
                    # For nested objects like Applicant, create element with SF424_4_0 prefix
                    nested_element = lxml_etree.SubElement(
                        parent, f"{{{sf424_namespace}}}{element_name}"
                    )

                    # Special handling for Applicant address to ensure correct XSD sequence
                    if element_name == "Applicant":
                        self._add_address_elements_in_order(
                            nested_element, value, nsmap, namespace_fields
                        )
                    else:
                        for nested_field, nested_value in value.items():
                            if nested_value is not None:
                                self._add_lxml_element_to_parent(
                                    nested_element,
                                    nested_field,
                                    nested_value,
                                    nsmap,
                                    namespace_fields,
                                )
                else:
                    # Simple value - create element with SF424_4_0 namespace prefix
                    element = lxml_etree.SubElement(parent, f"{{{sf424_namespace}}}{element_name}")
                    element.text = str(value)

    def _add_address_elements_in_order(
        self, parent: Any, address_data: dict, nsmap: dict, namespace_fields: dict
    ) -> None:
        """Add address elements in the correct XSD sequence order."""
        # XSD sequence: Street1, Street2, City, County, State/Province, ZipPostalCode, Country
        # Check both original field names and transformed field names
        address_order = [
            ("street1", "Street1"),
            ("street2", "Street2"),
            ("city", "City"),
            ("county", "County"),
            ("state", "State"),
            ("province", "Province"),
            ("zip_postal_code", "ZipPostalCode"),
            ("country", "Country"),
        ]

        for input_field, xml_field in address_order:
            # Try both the input field name and the XML field name
            field_value = address_data.get(input_field) or address_data.get(xml_field)
            if field_value is not None:
                # Use the XML field name for the element
                self._add_lxml_element_to_parent(
                    parent, xml_field, field_value, nsmap, namespace_fields
                )

    def _add_lxml_element_to_parent(
        self, parent: Any, field_name: str, value: Any, nsmap: dict, namespace_fields: dict
    ) -> None:
        """Add a single element to a parent using lxml with proper namespace handling."""
        if isinstance(value, dict):
            # Create nested element for dictionary values
            nested_element = lxml_etree.SubElement(parent, field_name)
            for nested_field, nested_value in value.items():
                if nested_value is not None:
                    self._add_lxml_element_to_parent(
                        nested_element, nested_field, nested_value, nsmap, namespace_fields
                    )
        elif value is None:
            # Create empty element for None values
            if field_name in namespace_fields:
                # Use configured namespace
                namespace_prefix = namespace_fields[field_name]
                element_name = f"{{{nsmap[namespace_prefix]}}}{field_name}"
                lxml_etree.SubElement(parent, element_name)
            else:
                # Use default namespace
                lxml_etree.SubElement(parent, field_name)
        else:
            # Simple value - create element with text content
            if field_name in namespace_fields:
                # Use configured namespace
                namespace_prefix = namespace_fields[field_name]
                element_name = f"{{{nsmap[namespace_prefix]}}}{field_name}"
                element = lxml_etree.SubElement(parent, element_name)
            else:
                # Use default namespace
                element = lxml_etree.SubElement(parent, field_name)
            element.text = str(value)

    def _add_attachment_element(
        self, parent: Any, element_name: str, attachment_data: Any, nsmap: dict
    ) -> None:
        """Add an attachment element with proper structure.

        Args:
            parent: Parent XML element
            element_name: Name of the attachment element
            attachment_data: Attachment data (dict or AttachmentFile/AttachmentGroup)
            nsmap: Namespace map
        """
        if element_name == "AdditionalProjectTitle":
            # Handle multiple attachments
            self._add_multiple_attachment_element(parent, element_name, attachment_data, nsmap)
        else:
            # Handle single attachments
            self._add_single_attachment_element(parent, element_name, attachment_data, nsmap)

    def _add_single_attachment_element(
        self, parent: Any, element_name: str, attachment_data: Any, nsmap: dict
    ) -> None:
        """Add a single attachment element.

        Args:
            parent: Parent XML element
            element_name: Name of the attachment element
            attachment_data: Single attachment data
            nsmap: Namespace map
        """
        attachment_elem = lxml_etree.SubElement(parent, element_name)
        self._populate_attachment_content(attachment_elem, attachment_data, nsmap)

    def _add_multiple_attachment_element(
        self, parent: Any, element_name: str, attachment_data: Any, nsmap: dict
    ) -> None:
        """Add a multiple attachment element (AttachmentGroup).

        Args:
            parent: Parent XML element
            element_name: Name of the attachment group element
            attachment_data: Multiple attachment data
            nsmap: Namespace map
        """
        group_elem = lxml_etree.SubElement(parent, element_name)

        # Get attachment namespace for AttachedFile elements
        att_namespace = nsmap.get("att", "http://apply.grants.gov/system/Attachments-V1.0")

        # Handle different data formats
        if isinstance(attachment_data, dict):
            if "AttachedFile" in attachment_data:
                attached_files = attachment_data["AttachedFile"]
                if isinstance(attached_files, list):
                    for file_data in attached_files:
                        file_elem = lxml_etree.SubElement(
                            group_elem, f"{{{att_namespace}}}AttachedFile"
                        )
                        self._populate_attachment_content(file_elem, file_data, nsmap)
                else:
                    # Single file
                    file_elem = lxml_etree.SubElement(
                        group_elem, f"{{{att_namespace}}}AttachedFile"
                    )
                    self._populate_attachment_content(file_elem, attached_files, nsmap)
        elif isinstance(attachment_data, list):
            # Direct list of attachments
            for file_data in attachment_data:
                file_elem = lxml_etree.SubElement(group_elem, f"{{{att_namespace}}}AttachedFile")
                self._populate_attachment_content(file_elem, file_data, nsmap)

    def _populate_attachment_content(
        self, attachment_elem: Any, attachment_data: Any, nsmap: dict
    ) -> None:
        """Populate the content of an attachment element.

        Args:
            attachment_elem: The attachment XML element
            attachment_data: Attachment data
            nsmap: Namespace map
        """
        if not isinstance(attachment_data, dict):
            return

        # Get attachment and global namespaces from nsmap
        att_namespace = nsmap.get("att", "http://apply.grants.gov/system/Attachments-V1.0")
        glob_namespace = nsmap.get("glob", "http://apply.grants.gov/system/Global-V1.0")

        # Add FileName with att: namespace (SF-424 XSD expects att: namespace for AttachedFileDataType elements)
        filename = attachment_data.get("FileName", attachment_data.get("filename"))
        if filename:
            filename_elem = lxml_etree.SubElement(attachment_elem, f"{{{att_namespace}}}FileName")
            filename_elem.text = str(filename)

        # Add MimeType with att: namespace (SF-424 XSD expects att: namespace for AttachedFileDataType elements)
        mime_type = attachment_data.get("MimeType", attachment_data.get("mime_type"))
        if mime_type:
            mimetype_elem = lxml_etree.SubElement(attachment_elem, f"{{{att_namespace}}}MimeType")
            mimetype_elem.text = str(mime_type)

        # Add FileLocation with att: namespace (as per SF-424 XSD validation)
        file_location = attachment_data.get("FileLocation", attachment_data.get("file_location"))
        if file_location:
            filelocation_elem = lxml_etree.SubElement(
                attachment_elem, f"{{{att_namespace}}}FileLocation"
            )

            if isinstance(file_location, dict) and "@href" in file_location:
                # Use att:href attribute as shown in the Grants.gov example
                filelocation_elem.set(f"{{{att_namespace}}}href", str(file_location["@href"]))
            elif isinstance(file_location, str):
                # Use att:href attribute as shown in the Grants.gov example
                filelocation_elem.set(f"{{{att_namespace}}}href", file_location)

        # Add HashValue with glob: namespace (as per XSD: ref="glob:HashValue")
        hash_value = attachment_data.get("HashValue", attachment_data.get("hash_value"))
        hash_algorithm = attachment_data.get("hash_algorithm", "SHA-1")
        if hash_value:
            hashvalue_elem = lxml_etree.SubElement(
                attachment_elem, f"{{{glob_namespace}}}HashValue"
            )

            if isinstance(hash_value, dict):
                if "@hashAlgorithm" in hash_value:
                    # hashAlgorithm attribute must be in glob: namespace
                    hashvalue_elem.set(
                        f"{{{glob_namespace}}}hashAlgorithm", str(hash_value["@hashAlgorithm"])
                    )
                if "#text" in hash_value:
                    hashvalue_elem.text = str(hash_value["#text"])
            elif isinstance(hash_value, str):
                # hashAlgorithm attribute must be in glob: namespace - use snake_case hash_algorithm field
                hashvalue_elem.set(f"{{{glob_namespace}}}hashAlgorithm", hash_algorithm)
                hashvalue_elem.text = hash_value

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
