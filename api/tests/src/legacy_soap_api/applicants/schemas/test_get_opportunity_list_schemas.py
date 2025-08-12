from datetime import date

import pytest

from src.legacy_soap_api.applicants.schemas.get_opportunity_list_schemas import OpportunityDetails
from src.util.datetime_util import parse_grants_gov_date


class TestParseGrantsGovDate:
    """Test the parse_grants_gov_date utility function"""

    def test_parse_date_with_timezone_suffix(self):
        """Test parsing date with timezone suffix like grants.gov returns"""
        result = parse_grants_gov_date("2025-09-16-04:00")
        expected = date(2025, 9, 16)
        assert result == expected

    def test_parse_date_with_positive_timezone_suffix(self):
        """Test parsing date with positive timezone suffix"""
        result = parse_grants_gov_date("2025-09-16+05:00")
        expected = date(2025, 9, 16)
        assert result == expected

    def test_parse_standard_iso_date(self):
        """Test parsing standard ISO date format without timezone"""
        result = parse_grants_gov_date("2025-09-16")
        expected = date(2025, 9, 16)
        assert result == expected

    def test_parse_none_returns_none(self):
        """Test that None input returns None"""
        result = parse_grants_gov_date(None)
        assert result is None

    def test_parse_empty_string_returns_none(self):
        """Test that empty string returns None"""
        result = parse_grants_gov_date("")
        assert result is None

    def test_parse_invalid_date_raises_error(self):
        """Test that invalid date format raises ValueError"""
        with pytest.raises(ValueError, match="Could not parse date string"):
            parse_grants_gov_date("not-a-date")

    def test_parse_invalid_format_raises_error(self):
        """Test that malformed date raises ValueError"""
        with pytest.raises(ValueError, match="Could not parse date string"):
            parse_grants_gov_date("2025-13-45")  # Invalid month and day


class TestOpportunityDetailsDateParsing:
    """Test the OpportunityDetails schema date field validators"""

    def test_closing_date_with_timezone_suffix(self):
        """Test that closing_date field correctly parses grants.gov format"""
        data = {"ClosingDate": "2025-09-16-04:00"}
        opportunity = OpportunityDetails(**data)

        assert opportunity.closing_date == date(2025, 9, 16)

    def test_opening_date_with_timezone_suffix(self):
        """Test that opening_date field correctly parses grants.gov format"""
        data = {"OpeningDate": "2025-09-16-04:00"}
        opportunity = OpportunityDetails(**data)

        assert opportunity.opening_date == date(2025, 9, 16)

    def test_both_dates_with_timezone_suffix(self):
        """Test parsing both opening and closing dates with timezone suffixes"""
        data = {"OpeningDate": "2025-08-15+05:00", "ClosingDate": "2025-09-16-04:00"}
        opportunity = OpportunityDetails(**data)

        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)

    def test_dates_with_standard_iso_format(self):
        """Test that standard ISO dates still work correctly"""
        data = {"OpeningDate": "2025-08-15", "ClosingDate": "2025-09-16"}
        opportunity = OpportunityDetails(**data)

        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)

    def test_none_dates_remain_none(self):
        """Test that None dates remain None"""
        data = {"OpeningDate": None, "ClosingDate": None}
        opportunity = OpportunityDetails(**data)

        assert opportunity.opening_date is None
        assert opportunity.closing_date is None

    def test_date_objects_pass_through(self):
        """Test that date objects are passed through unchanged"""
        opening_date = date(2025, 8, 15)
        closing_date = date(2025, 9, 16)

        data = {"OpeningDate": opening_date, "ClosingDate": closing_date}
        opportunity = OpportunityDetails(**data)

        assert opportunity.opening_date == opening_date
        assert opportunity.closing_date == closing_date

    def test_complete_opportunity_details_with_grants_gov_dates(self):
        """Test a complete OpportunityDetails object with grants.gov formatted dates"""
        data = {
            "FundingOpportunityNumber": "O-BJA-2025-202930-STG",
            "FundingOpportunityTitle": "Test Opportunity",
            "CompetitionID": "12345",
            "CompetitionTitle": "Test Competition",
            "OpeningDate": "2025-08-15-04:00",
            "ClosingDate": "2025-09-16-04:00",
            "OfferingAgency": "Bureau of Justice Assistance",
            "AgencyContactInfo": "Contact info here",
            "IsMultiProject": "false",
        }

        opportunity = OpportunityDetails(**data)

        # Verify the dates were parsed correctly
        assert opportunity.opening_date == date(2025, 8, 15)
        assert opportunity.closing_date == date(2025, 9, 16)

        # Verify other fields are still correct
        assert opportunity.funding_opportunity_number == "O-BJA-2025-202930-STG"
        assert opportunity.funding_opportunity_title == "Test Opportunity"
        assert opportunity.competition_id == "12345"
        assert opportunity.offering_agency == "Bureau of Justice Assistance"
