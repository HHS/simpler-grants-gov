"""Assemble complete submission XML with header, forms, and footer."""

import logging
from typing import Any

from lxml import etree as lxml_etree

from src.db.models.competition_models import Application, ApplicationForm, ApplicationSubmission
from src.services.xml_generation.header_generator import (
    generate_application_footer_xml,
    generate_application_header_xml,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

logger = logging.getLogger(__name__)


class SubmissionXMLAssembler:
    """Assembles complete GrantApplication.xml with header, forms, and footer."""

    def __init__(
        self,
        application: Application,
        application_submission: ApplicationSubmission,
        attachment_mapping: dict[str, Any] | None = None,
    ):
        self.application = application
        self.application_submission = application_submission
        self.xml_service = XMLGenerationService()
        self.attachment_mapping = attachment_mapping

    def get_supported_forms(self) -> list[ApplicationForm]:
        """Get list of application forms that are supported for XML generation.

        Returns:
            List of ApplicationForm objects for supported forms only
        """
        supported_forms = []

        for app_form in self.application.application_forms:
            form_name = app_form.form.short_form_name
            if app_form.form.json_to_xml_schema is not None:
                supported_forms.append(app_form)
            else:
                logger.info(
                    f"Skipping form {form_name} for XML generation - no transform config",
                    extra={
                        "application_id": self.application.application_id,
                        "form_id": app_form.form.form_id,
                        "form_name": form_name,
                    },
                )

        return supported_forms

    def generate_complete_submission_xml(self, pretty_print: bool = False) -> str | None:
        """Generate complete GrantApplication.xml with header, forms, and footer."""
        logger.info(
            "Generating complete submission XML",
            extra={"application_id": self.application.application_id},
        )

        # Get supported forms
        supported_forms = self.get_supported_forms()

        if not supported_forms:
            logger.warning(
                "No supported forms found for XML generation",
                extra={"application_id": self.application.application_id},
            )
            return None

        # Generate header XML
        header_xml_str = generate_application_header_xml(
            self.application, pretty_print=pretty_print
        )

        # Generate form XMLs
        form_xml_elements = []
        for app_form in supported_forms:
            form_name = app_form.form.short_form_name
            logger.info(
                f"Generating XML for form {form_name}",
                extra={
                    "application_id": self.application.application_id,
                    "form_name": form_name,
                },
            )

            try:
                form_xml = self._generate_form_xml(app_form, pretty_print)
                form_xml_elements.append(form_xml)
            except Exception:
                logger.exception(
                    f"Failed to generate XML for form {form_name}",
                    extra={
                        "application_id": self.application.application_id,
                        "form_name": form_name,
                    },
                )
                continue

        # Check if we actually generated any form XML
        if not form_xml_elements:
            logger.warning(
                "No forms successfully generated XML - cannot create submission XML",
                extra={"application_id": self.application.application_id},
            )
            return None

        # Generate footer XML
        footer_xml_str = generate_application_footer_xml(
            self.application, self.application_submission, pretty_print=pretty_print
        )

        # Assemble complete XML
        complete_xml = self._assemble_xml_components(
            header_xml_str, form_xml_elements, footer_xml_str, pretty_print
        )

        logger.info(
            f"Successfully generated complete submission XML ({len(complete_xml)} bytes)",
            extra={
                "application_id": self.application.application_id,
                "forms_count": len(form_xml_elements),
            },
        )

        return complete_xml

    def _generate_form_xml(self, app_form: Any, pretty_print: bool = False) -> str:
        """Generate XML for a single application form."""
        form_name = app_form.form.short_form_name
        attachment_mapping = self.attachment_mapping

        request = XMLGenerationRequest(
            application_data=app_form.application_response,
            transform_config=app_form.form.json_to_xml_schema,
            pretty_print=pretty_print,
            attachment_mapping=attachment_mapping,
        )

        response = self.xml_service.generate_xml(request)

        if not response.success or response.xml_data is None:
            logger.error(
                f"Failed to generate XML for form {form_name}: {response.error_message}",
                extra={
                    "application_id": self.application.application_id,
                    "form_name": form_name,
                },
            )
            raise Exception(f"XML generation failed for form {form_name}: {response.error_message}")

        return response.xml_data

    def _assemble_xml_components(
        self,
        header_xml: str,
        form_xmls: list[str],
        footer_xml: str,
        pretty_print: bool,
    ) -> str:
        """Assemble header, forms, and footer into complete XML structure."""
        # Parse individual XML components
        header_element = self._parse_xml_string(header_xml)
        footer_element = self._parse_xml_string(footer_xml)
        form_elements = [self._parse_xml_string(xml) for xml in form_xmls]

        # Create root element with namespaces
        nsmap = {
            "header": "http://apply.grants.gov/system/Header-V1.0",
            "footer": "http://apply.grants.gov/system/Footer-V1.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        }

        root = lxml_etree.Element("GrantApplication", nsmap=nsmap)

        # Add header (must strip XML declaration and use just the element)
        root.append(header_element)

        # Add Forms wrapper
        forms_element = lxml_etree.SubElement(root, "Forms")
        for form_element in form_elements:
            forms_element.append(form_element)

        # Add footer
        root.append(footer_element)

        # Generate final XML string
        if pretty_print:
            xml_bytes = lxml_etree.tostring(
                root, encoding="utf-8", xml_declaration=True, pretty_print=True
            )
        else:
            xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)

        return xml_bytes.decode("utf-8").strip()

    def _parse_xml_string(self, xml_string: str) -> lxml_etree.Element:
        """Parse XML string into element tree."""
        try:
            # Parse the XML string
            parser = lxml_etree.XMLParser(remove_blank_text=True)
            root = lxml_etree.fromstring(xml_string.encode("utf-8"), parser=parser)
            return root
        except Exception:
            # Don't log exception details as they may contain PII from the XML
            logger.error("Failed to parse XML string")
            raise ValueError("Invalid XML string - parsing failed") from None
