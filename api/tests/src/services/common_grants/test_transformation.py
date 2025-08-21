"""Tests for the transformation utility."""

from datetime import date, datetime
from uuid import uuid4

from src.services.common_grants.transformation import transform_opportunity_to_common_grants


class TestTransformation:
    """Test the transform_opportunity_to_common_grants function."""

    def test_basic_transformation(self):
        """Test basic transformation of an opportunity."""

        # Create a mock opportunity object with minimal required attributes
        class MockOpportunity:
            def __init__(self):
                self.opportunity_id = uuid4()  # Changed from string to UUID
                self.opportunity_title = "Test Opportunity"
                self.opportunity_status = type("MockStatus", (), {"value": "posted"})()
                self.created_at = datetime(2024, 1, 1, 12, 0, 0)  # Changed from date to datetime
                self.updated_at = datetime(2024, 1, 2, 12, 0, 0)  # Changed from date to datetime
                self.current_opportunity_summary = type(
                    "MockSummary",
                    (),
                    {
                        "opportunity_summary": type(
                            "MockOppSummary",
                            (),
                            {
                                "summary_description": "Test description",
                                "close_date": date(2024, 12, 31),
                                "estimated_total_program_funding": 1000000,
                                "award_ceiling": 500000,
                                "award_floor": 10000,
                                "additional_info_url": "https://example.com/opportunity",
                            },
                        )()
                    },
                )()

        opportunity = MockOpportunity()

        result = transform_opportunity_to_common_grants(opportunity)

        assert result.id == opportunity.opportunity_id
        assert result.title == "Test Opportunity"
        assert result.description == "Test description"
        assert result.status.value == "open"  # "posted" maps to "open"
        assert result.created_at == datetime(
            2024, 1, 1, 12, 0, 0
        )  # Changed from createdAt to created_at
        assert result.last_modified_at == datetime(
            2024, 1, 2, 12, 0, 0
        )  # Changed from lastModifiedAt to last_modified_at

        # Check key_dates
        assert result.key_dates is not None
        assert result.key_dates.post_date is not None
        assert result.key_dates.post_date.name == "Opportunity Posted"
        assert result.key_dates.post_date.date == date(2024, 1, 1)
        assert result.key_dates.close_date is not None
        assert result.key_dates.close_date.name == "Application Deadline"
        assert result.key_dates.close_date.date == date(2024, 12, 31)

        # Check funding
        assert result.funding is not None
        assert result.funding.total_amount_available.amount == "1000000"
        assert result.funding.total_amount_available.currency == "USD"
        assert result.funding.max_award_amount.amount == "500000"
        assert result.funding.max_award_amount.currency == "USD"
        assert result.funding.min_award_amount.amount == "10000"
        assert result.funding.min_award_amount.currency == "USD"

        # Check source URL
        assert str(result.source) == "https://example.com/opportunity"

    def test_url_validation_and_fixing(self):
        """Test that URLs are properly validated and fixed."""
        from src.services.common_grants.transformation import _validate_and_fix_url

        # Test valid URLs
        assert _validate_and_fix_url("https://example.com") == "https://example.com"
        assert _validate_and_fix_url("http://example.com") == "http://example.com"

        # Test URLs that need fixing
        assert _validate_and_fix_url("example.com") == "https://example.com"
        assert _validate_and_fix_url("sam.gov") == "https://sam.gov"
        assert _validate_and_fix_url("www.example.com") == "https://www.example.com"

        # Test invalid URLs
        assert _validate_and_fix_url("not-a-url") is None
        assert _validate_and_fix_url("") is None
        assert _validate_and_fix_url(None) is None

    def test_status_mapping(self):
        """Test that opportunity statuses are mapped correctly."""
        status_mappings = [
            ("posted", "open"),
            ("archived", "custom"),
            ("forecasted", "forecasted"),
            ("closed", "closed"),
        ]

        for db_status, expected_status in status_mappings:

            class MockOpportunity:
                def __init__(self, status):
                    self.opportunity_id = uuid4()  # Changed from string to UUID
                    self.opportunity_title = "Test"
                    self.opportunity_status = type("MockStatus", (), {"value": status})()
                    self.created_at = datetime(
                        2024, 1, 1, 12, 0, 0
                    )  # Changed from date to datetime
                    self.updated_at = datetime(
                        2024, 1, 1, 12, 0, 0
                    )  # Changed from date to datetime
                    self.current_opportunity_summary = type(
                        "MockSummary",
                        (),
                        {
                            "opportunity_summary": type(
                                "MockOppSummary",
                                (),
                                {
                                    "summary_description": "Test",
                                    "close_date": None,
                                    "estimated_total_program_funding": None,
                                    "award_ceiling": None,
                                    "award_floor": None,
                                    "additional_info_url": None,
                                },
                            )()
                        },
                    )()

            opportunity = MockOpportunity(db_status)
            result = transform_opportunity_to_common_grants(opportunity)
            assert result.status.value == expected_status

    def test_missing_optional_data(self):
        """Test transformation with missing optional data."""

        class MockOpportunity:
            def __init__(self):
                self.opportunity_id = uuid4()  # Changed from string to UUID
                self.opportunity_title = None
                self.opportunity_status = type("MockStatus", (), {"value": "posted"})()
                self.created_at = datetime(
                    2024, 1, 1, 12, 0, 0
                )  # Provide a default datetime instead of None
                self.updated_at = datetime(
                    2024, 1, 1, 12, 0, 0
                )  # Provide a default datetime instead of None
                self.current_opportunity_summary = None

        opportunity = MockOpportunity()
        result = transform_opportunity_to_common_grants(opportunity)

        assert result.id == opportunity.opportunity_id
        assert result.title == "Untitled Opportunity"
        assert result.description == "No description available"
        assert result.status.value == "open"
        assert result.created_at == datetime(2024, 1, 1, 12, 0, 0)
        assert result.last_modified_at == datetime(2024, 1, 1, 12, 0, 0)
        assert result.key_dates is not None
        assert result.key_dates.post_date is not None
        assert result.key_dates.close_date is None
        assert result.funding is not None
        assert result.funding.total_amount_available is None
        assert result.funding.max_award_amount is None
        assert result.funding.min_award_amount is None

    def test_partial_summary_data(self):
        """Test transformation with partial summary data."""

        class MockOpportunity:
            def __init__(self):
                self.opportunity_id = uuid4()  # Changed from string to UUID
                self.opportunity_title = "Test"
                self.opportunity_status = type("MockStatus", (), {"value": "posted"})()
                self.created_at = datetime(2024, 1, 1, 12, 0, 0)  # Changed from date to datetime
                self.updated_at = datetime(2024, 1, 1, 12, 0, 0)  # Changed from date to datetime
                self.current_opportunity_summary = type(
                    "MockSummary",
                    (),
                    {
                        "opportunity_summary": type(
                            "MockOppSummary",
                            (),
                            {
                                "summary_description": None,
                                "close_date": date(2024, 12, 31),
                                "estimated_total_program_funding": 1000000,
                                "award_ceiling": None,
                                "award_floor": 10000,
                                "additional_info_url": None,
                            },
                        )()
                    },
                )()

        opportunity = MockOpportunity()
        result = transform_opportunity_to_common_grants(opportunity)

        assert result.description == "No description available"
        assert result.key_dates is not None
        assert result.key_dates.close_date is not None
        assert result.funding.total_amount_available.amount == "1000000"
        assert result.funding.max_award_amount is None
        assert result.funding.min_award_amount.amount == "10000"

    def test_unknown_status(self):
        """Test transformation with unknown status."""

        class MockOpportunity:
            def __init__(self):
                self.opportunity_id = uuid4()  # Changed from string to UUID
                self.opportunity_title = "Test"
                self.opportunity_status = type("MockStatus", (), {"value": "unknown_status"})()
                self.created_at = datetime(2024, 1, 1, 12, 0, 0)  # Changed from date to datetime
                self.updated_at = datetime(2024, 1, 1, 12, 0, 0)  # Changed from date to datetime
                self.current_opportunity_summary = type(
                    "MockSummary",
                    (),
                    {
                        "opportunity_summary": type(
                            "MockOppSummary",
                            (),
                            {
                                "summary_description": "Test",
                                "close_date": None,
                                "estimated_total_program_funding": None,
                                "award_ceiling": None,
                                "award_floor": None,
                                "additional_info_url": None,
                            },
                        )()
                    },
                )()

        opportunity = MockOpportunity()
        result = transform_opportunity_to_common_grants(opportunity)

        # Unknown status should map to "custom"
        assert result.status.value == "custom"

    def test_transformation_with_url_fixing(self):
        """Test transformation with a URL that needs fixing."""

        class MockOpportunity:
            def __init__(self):
                self.opportunity_id = uuid4()
                self.opportunity_title = "Test Opportunity"
                self.opportunity_status = type("MockStatus", (), {"value": "posted"})()
                self.created_at = datetime(2024, 1, 1, 12, 0, 0)
                self.updated_at = datetime(2024, 1, 2, 12, 0, 0)
                self.current_opportunity_summary = type(
                    "MockSummary",
                    (),
                    {
                        "opportunity_summary": type(
                            "MockOppSummary",
                            (),
                            {
                                "summary_description": "Test description",
                                "close_date": date(2024, 12, 31),
                                "estimated_total_program_funding": 1000000,
                                "award_ceiling": 500000,
                                "award_floor": 10000,
                                "additional_info_url": "sam.gov",  # URL without protocol
                            },
                        )()
                    },
                )()

        opportunity = MockOpportunity()
        result = transform_opportunity_to_common_grants(opportunity)

        # Check that the URL was fixed (Pydantic adds trailing slash)
        assert str(result.source) == "https://sam.gov/"
