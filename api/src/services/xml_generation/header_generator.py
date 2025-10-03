"""Submission XML generation."""

import base64
import hashlib
import logging
from datetime import date

from lxml import etree as lxml_etree

from src.db.models.competition_models import Application

logger = logging.getLogger(__name__)

HEADER_NAMESPACES = {
    "header": "http://apply.grants.gov/system/Header-V1.0",
    "glob": "http://apply.grants.gov/system/Global-V1.0",
}


class SubmissionXMLGenerator:

    def __init__(self, application: Application):
        self.application = application
        self.competition = application.competition
        self.opportunity = self.competition.opportunity

    def generate_header_xml(self, pretty_print: bool = True) -> str:
        # Create namespace map for lxml
        nsmap = {
            "header": HEADER_NAMESPACES["header"],
            "glob": HEADER_NAMESPACES["glob"],
        }

        # Create root element with namespaces and schemaVersion attribute
        root = lxml_etree.Element(
            f"{{{HEADER_NAMESPACES['header']}}}GrantSubmissionHeader",
            nsmap=nsmap,
        )
        root.set(f"{{{HEADER_NAMESPACES['glob']}}}schemaVersion", "1.0")

        # Add HashValue element (placeholder calculation for now)
        hash_value = self._calculate_hash_value()
        if hash_value:
            hash_element = lxml_etree.SubElement(root, f"{{{HEADER_NAMESPACES['glob']}}}HashValue")
            hash_element.set(f"{{{HEADER_NAMESPACES['glob']}}}hashAlgorithm", "SHA-1")
            hash_element.text = hash_value

        # Add header fields (only if not None)
        self._add_header_field(root, "AgencyName", self._get_agency_name())
        self._add_header_field(root, "OpportunityID", self.opportunity.opportunity_number)
        self._add_header_field(root, "OpportunityTitle", self.opportunity.opportunity_title)
        self._add_header_field(root, "CompetitionID", self.competition.public_competition_id)
        self._add_header_field(
            root, "OpeningDate", self._format_date(self.competition.opening_date)
        )
        self._add_header_field(
            root, "ClosingDate", self._format_date(self.competition.closing_date)
        )
        self._add_header_field(root, "SubmissionTitle", self.application.application_name)
        self._add_header_field(root, "CFDANumber", self._get_cfda_number())

        # Generate XML string
        if pretty_print:
            xml_bytes = lxml_etree.tostring(
                root, encoding="utf-8", xml_declaration=True, pretty_print=True
            )
        else:
            xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)

        return xml_bytes.decode("utf-8").strip()

    def generate_footer_xml(self, pretty_print: bool = True) -> str:
        # TODO: Implement footer XML generation.
        raise NotImplementedError("Footer XML generation not yet implemented")

    def _add_header_field(
        self, parent: lxml_etree.Element, field_name: str, value: str | None
    ) -> None:
        if value is not None:
            element = lxml_etree.SubElement(
                parent, f"{{{HEADER_NAMESPACES['header']}}}{field_name}"
            )
            element.text = str(value)

    def _get_agency_name(self) -> str | None:
        if self.opportunity.agency_name:
            return self.opportunity.agency_name
        return self.opportunity.agency_code

    def _get_cfda_number(self) -> str | None:
        if self.competition.opportunity_assistance_listing:
            return self.competition.opportunity_assistance_listing.assistance_listing_number
        return None

    def _format_date(self, date_value: date | None) -> str | None:
        if date_value is None:
            return None
        return date_value.isoformat()

    # TODO: this is likely going to be changed based on additional research into how the hash value is calculated
    def _calculate_hash_value(self) -> str | None:
        # Create a string from key application data
        hash_data_parts = [
            str(self.application.application_id) if self.application.application_id else "",
            self.application.application_name or "",
            self.opportunity.opportunity_number or "",
            str(self.competition.competition_id) if self.competition.competition_id else "",
        ]
        hash_data = "|".join(hash_data_parts)

        # Calculate SHA-1 hash
        sha1_hash = hashlib.sha1(hash_data.encode("utf-8"), usedforsecurity=False)

        # Return base64-encoded hash
        return base64.b64encode(sha1_hash.digest()).decode("utf-8")


def generate_application_header_xml(application: Application, pretty_print: bool = True) -> str:
    generator = SubmissionXMLGenerator(application)
    return generator.generate_header_xml(pretty_print=pretty_print)
