from datetime import date, datetime, timezone

import pytest
import pytz

from src.util.datetime_util import adjust_timezone, parse_grants_gov_date


@pytest.mark.parametrize(
    "timezone_name, expected_output",
    [
        ("UTC", "2022-01-01T12:00:00+00:00"),
        ("US/Eastern", "2022-01-01T07:00:00-05:00"),
        ("US/Central", "2022-01-01T06:00:00-06:00"),
        ("US/Mountain", "2022-01-01T05:00:00-07:00"),
        ("US/Pacific", "2022-01-01T04:00:00-08:00"),
        ("Asia/Tokyo", "2022-01-01T21:00:00+09:00"),
    ],
)
def test_adjust_timezone_from_utc(timezone_name, expected_output):
    # Jan 1st 2022 at 12:00pm is the input
    input_datetime = datetime(2022, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    # Note that we use the isoformat for validation as a timezone shifted
    # timezone matches the unshifted one (eg. 12pm UTC and 7am Eastern match)
    # so comparing the timezone objects themselves is more complicated than
    # looking at their string representation.

    # Passing in UTC doesn't change the time
    assert adjust_timezone(input_datetime, timezone_name).isoformat() == expected_output


@pytest.mark.parametrize(
    "timezone_name, expected_output",
    [
        ("UTC", "2022-06-01T05:00:00+00:00"),
        ("US/Eastern", "2022-06-01T01:00:00-04:00"),
        ("US/Central", "2022-06-01T00:00:00-05:00"),
        ("US/Mountain", "2022-05-31T23:00:00-06:00"),
        ("US/Pacific", "2022-05-31T22:00:00-07:00"),
        ("Asia/Tokyo", "2022-06-01T14:00:00+09:00"),
    ],
)
def test_adjust_timezone_from_non_utc(timezone_name, expected_output):
    # June 1st 2022 at 01:00am in the Eastern timezone is the input
    input_datetime = pytz.timezone("America/New_York").localize(datetime(2022, 6, 1, 1, 0, 0))

    # Note that because daylights savings has switched from the above
    # test, the differences in the timezones is offset by an hour
    # in a few places that don't observe DST (the US timezones are all 1 hour closer to UTC)

    assert adjust_timezone(input_datetime, timezone_name).isoformat() == expected_output


class TestParseGrantsGovDate:
    """Test the parse_grants_gov_date function"""

    def test_parse_date_with_negative_timezone_suffix(self):
        """Test parsing date with negative timezone suffix like grants.gov returns"""
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

    def test_parse_date_with_different_timezone_offsets(self):
        """Test parsing dates with various timezone offset formats"""
        test_cases = [
            "2025-09-16-04:00",  # UTC-4
            "2025-09-16+05:30",  # UTC+5:30 (India)
            "2025-09-16-11:00",  # UTC-11
            "2025-09-16+14:00",  # UTC+14 (Line Islands)
        ]

        expected = date(2025, 9, 16)

        for test_case in test_cases:
            result = parse_grants_gov_date(test_case)
            assert result == expected, f"Failed for input: {test_case}"

    def test_parse_leap_year_date(self):
        """Test parsing a leap year date"""
        result = parse_grants_gov_date("2024-02-29-05:00")
        expected = date(2024, 2, 29)
        assert result == expected

    def test_parse_edge_case_dates(self):
        """Test parsing edge case dates like year boundaries"""
        test_cases = [
            ("2024-01-01+00:00", date(2024, 1, 1)),
            ("2024-12-31-12:00", date(2024, 12, 31)),
            ("2000-02-29+06:00", date(2000, 2, 29)),  # Leap year
        ]

        for date_str, expected in test_cases:
            result = parse_grants_gov_date(date_str)
            assert result == expected, f"Failed for input: {date_str}"
