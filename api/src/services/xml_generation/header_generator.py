"""Submission XML generation."""

import base64
import hashlib
import logging
from datetime import date

from lxml import etree as lxml_etree

from src.db.models.competition_models import Application, ApplicationSubmission
from src.services.xml_generation.constants import FOOTER_NAMESPACES, HEADER_NAMESPACES
from src.util.datetime_util import utcnow

logger = logging.getLogger(__name__)


class SubmissionXMLGenerator:

    def __init__(self, application: Application):
        self.application = application
        self.competition = application.competition
        self.opportunity = self.competition.opportunity

    def _create_root_element_with_hash(
        self, root_name: str, nsmap: dict, global_namespace: str, hash_value: str | None
    ) -> lxml_etree.Element:
        """Create root element with schemaVersion and optional HashValue."""
        root = lxml_etree.Element(root_name, nsmap=nsmap)
        root.set(f"{{{global_namespace}}}schemaVersion", "1.0")

        if hash_value:
            hash_element = lxml_etree.SubElement(root, f"{{{global_namespace}}}HashValue")
            hash_element.set(f"{{{global_namespace}}}hashAlgorithm", "SHA-1")
            hash_element.text = hash_value

        return root

    def _generate_xml_string(self, root: lxml_etree.Element, pretty_print: bool) -> str:
        """Generate XML string from root element."""
        if pretty_print:
            xml_bytes = lxml_etree.tostring(
                root, encoding="utf-8", xml_declaration=True, pretty_print=True
            )
        else:
            xml_bytes = lxml_etree.tostring(root, encoding="utf-8", xml_declaration=True)

        return xml_bytes.decode("utf-8").strip()

    def generate_header_xml(self, pretty_print: bool = True) -> str:
        nsmap = {
            "header": HEADER_NAMESPACES["header"],
            "glob": HEADER_NAMESPACES["glob"],
        }

        root = self._create_root_element_with_hash(
            f"{{{HEADER_NAMESPACES['header']}}}GrantSubmissionHeader",
            nsmap,
            HEADER_NAMESPACES["glob"],
            self._calculate_hash_value(),
        )

        header_ns = HEADER_NAMESPACES["header"]
        self._add_field(root, "AgencyName", self._get_agency_name(), header_ns)
        self._add_field(root, "OpportunityID", self.opportunity.opportunity_number, header_ns)
        self._add_field(root, "OpportunityTitle", self.opportunity.opportunity_title, header_ns)
        self._add_field(root, "CompetitionID", self.competition.public_competition_id, header_ns)
        self._add_field(
            root, "OpeningDate", self._format_date(self.competition.opening_date), header_ns
        )
        self._add_field(
            root, "ClosingDate", self._format_date(self.competition.closing_date), header_ns
        )
        self._add_field(root, "SubmissionTitle", self.application.application_name, header_ns)
        self._add_field(root, "CFDANumber", self._get_cfda_number(), header_ns)

        return self._generate_xml_string(root, pretty_print)

    def generate_footer_xml(
        self, application_submission: ApplicationSubmission, pretty_print: bool = True
    ) -> str:
        nsmap = {
            None: FOOTER_NAMESPACES["footer"],
            "ns1": FOOTER_NAMESPACES["glob"],
        }

        received_datetime = self._get_received_datetime()
        submitter_name = self._get_submitter_name()
        tracking_number = self._format_tracking_number(
            application_submission.legacy_tracking_number
        )

        root = self._create_root_element_with_hash(
            f"{{{FOOTER_NAMESPACES['footer']}}}GrantSubmissionFooter",
            nsmap,
            FOOTER_NAMESPACES["glob"],
            self._calculate_footer_hash_value(
                received_datetime, submitter_name, application_submission.legacy_tracking_number
            ),
        )

        footer_ns = FOOTER_NAMESPACES["footer"]
        self._add_field(root, "ReceivedDateTime", received_datetime, footer_ns)
        self._add_field(root, "SubmitterName", submitter_name, footer_ns)
        self._add_field(root, "Grants_govTrackingNumber", tracking_number, footer_ns)

        return self._generate_xml_string(root, pretty_print)

    def _add_field(
        self, parent: lxml_etree.Element, field_name: str, value: str | None, namespace: str
    ) -> None:
        """Add a field element if value is not None."""
        if value is not None:
            element = lxml_etree.SubElement(parent, f"{{{namespace}}}{field_name}")
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

    def _get_received_datetime(self) -> str:
        """Get the ReceivedDateTime from submitted_at or current time in ISO 8601 format."""
        timestamp = self.application.submitted_at if self.application.submitted_at else utcnow()
        return timestamp.isoformat(timespec="milliseconds")

    def _get_submitter_name(self) -> str:
        """Get the submitter name from the submitted_by user.

        Returns first_name + last_name if available, otherwise email, or 'unknown' if no user.
        """

        user = self.application.submitted_by_user
        if not user:
            return "unknown"

        if user.profile:
            return f"{user.profile.first_name} {user.profile.last_name}"

        if user.email:
            return user.email

        return "unknown"

    def _format_tracking_number(self, tracking_number: int) -> str:
        return f"GRANT{tracking_number:08d}"

    def _calculate_sha1_hash(self, *data_parts: str) -> str:
        hash_data = "|".join(data_parts)
        sha1_hash = hashlib.sha1(hash_data.encode("utf-8"), usedforsecurity=False)
        return base64.b64encode(sha1_hash.digest()).decode("utf-8")

    def _calculate_footer_hash_value(
        self, received_datetime: str, submitter_name: str, tracking_number: int
    ) -> str:
        hash_data_parts = [
            str(self.application.application_id) if self.application.application_id else "",
            received_datetime,
            submitter_name,
            str(tracking_number),
        ]

        return self._calculate_sha1_hash(*hash_data_parts)

    def _calculate_hash_value(self) -> str | None:
        hash_data_parts = [
            str(self.application.application_id) if self.application.application_id else "",
            self.application.application_name or "",
            self.opportunity.opportunity_number or "",
            str(self.competition.competition_id) if self.competition.competition_id else "",
        ]

        return self._calculate_sha1_hash(*hash_data_parts)


def generate_application_header_xml(application: Application, pretty_print: bool = True) -> str:
    generator = SubmissionXMLGenerator(application)
    return generator.generate_header_xml(pretty_print=pretty_print)


def generate_application_footer_xml(
    application: Application,
    application_submission: ApplicationSubmission,
    pretty_print: bool = True,
) -> str:
    generator = SubmissionXMLGenerator(application)
    return generator.generate_footer_xml(
        application_submission=application_submission, pretty_print=pretty_print
    )
