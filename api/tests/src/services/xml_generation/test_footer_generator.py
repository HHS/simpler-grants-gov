"""Tests for footer XML generation."""

from datetime import datetime, timezone

import pytest
from lxml import etree as lxml_etree

from src.services.xml_generation.header_generator import (
    FOOTER_NAMESPACES,
    SubmissionXMLGenerator,
    generate_application_footer_xml,
)
from src.util.datetime_util import utcnow
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    LinkExternalUserFactory,
    OpportunityFactory,
    UserFactory,
    UserProfileFactory,
)


@pytest.fixture
def application_with_submission(enable_factory_create, db_session):
    """Create an application with submitted_at, submitted_by, and submission."""
    # Create user with profile
    user = UserFactory.create()
    UserProfileFactory.create(user=user, first_name="Michael", last_name="Chouinard")
    LinkExternalUserFactory.create(user=user, email="michael@example.com")

    # Create application with submission data
    submitted_time = datetime(2025, 9, 2, 16, 24, 28, 0, tzinfo=timezone.utc)
    application = ApplicationFactory.create(
        submitted_at=submitted_time,
        submitted_by=user.user_id,
    )

    # Create application submission
    submission = ApplicationSubmissionFactory.create(
        application=application,
        legacy_tracking_number=80000001,
    )

    # Refresh to ensure relationships are loaded
    db_session.refresh(application)

    return application, submission


@pytest.fixture
def application_without_submission(enable_factory_create, db_session):
    """Create an application with submitted data but no submission yet."""
    opportunity = OpportunityFactory.create()
    competition = CompetitionFactory.create(opportunity=opportunity)

    # Create user with profile
    user = UserFactory.create()
    UserProfileFactory.create(user=user, first_name="Jane", last_name="Doe")
    LinkExternalUserFactory.create(user=user, email="jane@example.com")

    # Create application with submission data
    submitted_time = datetime(2025, 9, 15, 10, 30, 0, 0, tzinfo=timezone.utc)
    application = ApplicationFactory.create(
        competition=competition,
        submitted_at=submitted_time,
        submitted_by=user.user_id,
    )

    db_session.refresh(application)

    return application


class TestFooterGeneration:
    """Test cases for footer XML generation."""

    def test_generate_footer_with_submission(self, application_with_submission):
        """Test footer generation with all fields populated including tracking number."""
        application, submission = application_with_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml(application_submission=submission)

        # Parse the XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))

        # Verify root element and namespaces
        assert root.tag == f"{{{FOOTER_NAMESPACES['footer']}}}GrantSubmissionFooter"
        assert root.get(f"{{{FOOTER_NAMESPACES['glob']}}}schemaVersion") == "1.0"

        # Verify HashValue element
        hash_value_elem = root.find(f"{{{FOOTER_NAMESPACES['glob']}}}HashValue")
        assert hash_value_elem is not None
        assert hash_value_elem.get(f"{{{FOOTER_NAMESPACES['glob']}}}hashAlgorithm") == "SHA-1"
        assert hash_value_elem.text is not None
        assert len(hash_value_elem.text) > 0

        # Verify ReceivedDateTime
        received_datetime_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}ReceivedDateTime")
        assert received_datetime_elem is not None
        assert received_datetime_elem.text is not None
        # Should contain the timestamp in ISO format
        assert "2025-09-02T16:24:28" in received_datetime_elem.text

        # Verify SubmitterName
        submitter_name_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName")
        assert submitter_name_elem is not None
        assert submitter_name_elem.text == "Michael Chouinard"

        # Verify Grants_govTrackingNumber
        tracking_number_elem = root.find(
            f"{{{FOOTER_NAMESPACES['footer']}}}Grants_govTrackingNumber"
        )
        assert tracking_number_elem is not None
        assert tracking_number_elem.text == "GRANT80000001"

    def test_generate_footer_without_submission(self, application_without_submission):
        """Test footer generation without application submission (no tracking number)."""
        application = application_without_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml(application_submission=None)

        # Parse the XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))

        # Verify root element
        assert root.tag == f"{{{FOOTER_NAMESPACES['footer']}}}GrantSubmissionFooter"

        # Verify ReceivedDateTime
        received_datetime_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}ReceivedDateTime")
        assert received_datetime_elem is not None

        # Verify SubmitterName
        submitter_name_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName")
        assert submitter_name_elem is not None
        assert submitter_name_elem.text == "Jane Doe"

        # Verify tracking number is NOT present
        tracking_number_elem = root.find(
            f"{{{FOOTER_NAMESPACES['footer']}}}Grants_govTrackingNumber"
        )
        assert tracking_number_elem is None

    def test_submitter_name_without_profile(self, enable_factory_create, db_session):
        """Test that submitter name falls back to email when no profile exists."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(opportunity=opportunity)

        # Create user without profile but with email
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user, email="test@example.com")

        application = ApplicationFactory.create(
            competition=competition,
            submitted_by=user.user_id,
        )

        db_session.refresh(application)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        submitter_name_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName")
        assert submitter_name_elem is not None
        assert submitter_name_elem.text == "test@example.com"

    def test_submitter_name_without_submitted_by(self, enable_factory_create):
        """Test that submitter name is 'unknown' when no submitted_by."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(opportunity=opportunity)

        application = ApplicationFactory.create(
            competition=competition,
            submitted_by=None,
        )

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        submitter_name_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName")
        assert submitter_name_elem is not None
        assert submitter_name_elem.text == "unknown"

    def test_received_datetime_uses_submitted_at(self, application_without_submission):
        """Test that ReceivedDateTime uses submitted_at when available."""
        application = application_without_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        received_datetime_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}ReceivedDateTime")
        assert received_datetime_elem is not None
        # Should use the submitted_at time
        assert "2025-09-15T10:30:00" in received_datetime_elem.text

    def test_received_datetime_uses_current_time_when_no_submitted_at(self, enable_factory_create):
        """Test that ReceivedDateTime uses current time when submitted_at is None."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(opportunity=opportunity)

        application = ApplicationFactory.create(
            competition=competition,
            submitted_at=None,
        )

        before_generation = utcnow()
        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()
        after_generation = utcnow()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        received_datetime_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}ReceivedDateTime")
        assert received_datetime_elem is not None

        # Parse the datetime from XML
        received_dt_str = received_datetime_elem.text
        # Just verify it's a valid ISO datetime string
        received_dt = datetime.fromisoformat(received_dt_str)

        # The timestamp may be truncated to milliseconds in ISO format,
        # so we check it's within a reasonable range (1 second)
        from datetime import timedelta

        assert (
            before_generation - timedelta(seconds=1)
            <= received_dt
            <= after_generation + timedelta(seconds=1)
        )

    def test_tracking_number_formatting(self, application_with_submission):
        """Test that tracking number is formatted correctly."""
        application, submission = application_with_submission

        # Test different tracking numbers
        test_cases = [
            (80000001, "GRANT80000001"),
            (80000999, "GRANT80000999"),
            (99999999, "GRANT99999999"),
            (80000000, "GRANT80000000"),
        ]

        for tracking_num, expected_format in test_cases:
            submission.legacy_tracking_number = tracking_num

            generator = SubmissionXMLGenerator(application)
            xml_string = generator.generate_footer_xml(application_submission=submission)

            root = lxml_etree.fromstring(xml_string.encode("utf-8"))
            tracking_number_elem = root.find(
                f"{{{FOOTER_NAMESPACES['footer']}}}Grants_govTrackingNumber"
            )
            assert tracking_number_elem is not None
            assert tracking_number_elem.text == expected_format

    def test_footer_not_pretty_print(self, application_with_submission):
        """Test footer generation without pretty printing."""
        application, submission = application_with_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml(
            pretty_print=False, application_submission=submission
        )

        # Should still be valid XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        assert root is not None

        # Should not contain multiple spaces or newlines (except in declaration)
        lines = xml_string.split("\n")
        assert len(lines) <= 2  # Only XML declaration and content line

    def test_footer_xml_has_declaration(self, application_without_submission):
        """Test that generated footer XML includes XML declaration."""
        application = application_without_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()

        assert xml_string.startswith("<?xml version=")
        # Accept either single or double quotes in encoding declaration
        first_line = xml_string.split("\n")[0]
        assert "encoding='utf-8'" in first_line or 'encoding="utf-8"' in first_line

    def test_footer_namespace_prefixes_in_output(self, application_with_submission):
        """Test that namespace prefixes are correctly used in footer XML output."""
        application, submission = application_with_submission

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml(application_submission=submission)

        # Check that namespace declarations are present
        assert 'xmlns="http://apply.grants.gov/system/Footer-V1.0"' in xml_string
        assert 'xmlns:ns1="http://apply.grants.gov/system/Global-V1.0"' in xml_string

        # Check that footer elements use the default namespace (no prefix)
        assert "<ReceivedDateTime>" in xml_string
        assert "<SubmitterName>" in xml_string
        assert "<Grants_govTrackingNumber>" in xml_string

        # Check that glob elements use the ns1: prefix
        assert "<ns1:HashValue" in xml_string
        assert 'ns1:hashAlgorithm="SHA-1"' in xml_string

    def test_hash_value_is_deterministic(self, application_with_submission):
        """Test that hash value is deterministic for same input."""
        application, submission = application_with_submission

        generator1 = SubmissionXMLGenerator(application)
        xml_string1 = generator1.generate_footer_xml(application_submission=submission)

        generator2 = SubmissionXMLGenerator(application)
        xml_string2 = generator2.generate_footer_xml(application_submission=submission)

        root1 = lxml_etree.fromstring(xml_string1.encode("utf-8"))
        root2 = lxml_etree.fromstring(xml_string2.encode("utf-8"))

        hash1 = root1.find(f"{{{FOOTER_NAMESPACES['glob']}}}HashValue").text
        hash2 = root2.find(f"{{{FOOTER_NAMESPACES['glob']}}}HashValue").text

        assert hash1 == hash2

    def test_hash_value_differs_with_tracking_number(self, application_with_submission):
        """Test that hash value changes when tracking number changes."""
        application, submission = application_with_submission

        # Generate with original tracking number
        generator1 = SubmissionXMLGenerator(application)
        xml_string1 = generator1.generate_footer_xml(application_submission=submission)

        # Change tracking number
        submission.legacy_tracking_number = 99999999

        generator2 = SubmissionXMLGenerator(application)
        xml_string2 = generator2.generate_footer_xml(application_submission=submission)

        root1 = lxml_etree.fromstring(xml_string1.encode("utf-8"))
        root2 = lxml_etree.fromstring(xml_string2.encode("utf-8"))

        hash1 = root1.find(f"{{{FOOTER_NAMESPACES['glob']}}}HashValue").text
        hash2 = root2.find(f"{{{FOOTER_NAMESPACES['glob']}}}HashValue").text

        assert hash1 != hash2

    def test_convenience_function(self, application_with_submission):
        """Test the convenience function generate_application_footer_xml."""
        application, submission = application_with_submission

        xml_string = generate_application_footer_xml(application, application_submission=submission)

        # Should produce valid XML
        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        assert root.tag == f"{{{FOOTER_NAMESPACES['footer']}}}GrantSubmissionFooter"

        # Should have all expected elements
        assert root.find(f"{{{FOOTER_NAMESPACES['footer']}}}ReceivedDateTime") is not None
        assert root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName") is not None
        assert root.find(f"{{{FOOTER_NAMESPACES['footer']}}}Grants_govTrackingNumber") is not None

    def test_submitter_name_with_partial_profile(self, enable_factory_create, db_session):
        """Test submitter name when profile exists but has only first or last name."""
        opportunity = OpportunityFactory.create()
        competition = CompetitionFactory.create(opportunity=opportunity)

        # Create user with profile that has only first name
        user = UserFactory.create()
        UserProfileFactory.create(user=user, first_name="John", last_name="")
        LinkExternalUserFactory.create(user=user, email="john@example.com")

        application = ApplicationFactory.create(
            competition=competition,
            submitted_by=user.user_id,
        )

        db_session.refresh(application)

        generator = SubmissionXMLGenerator(application)
        xml_string = generator.generate_footer_xml()

        root = lxml_etree.fromstring(xml_string.encode("utf-8"))
        submitter_name_elem = root.find(f"{{{FOOTER_NAMESPACES['footer']}}}SubmitterName")
        assert submitter_name_elem is not None
        # Should fall back to email since last_name is empty
        assert submitter_name_elem.text == "john@example.com"
