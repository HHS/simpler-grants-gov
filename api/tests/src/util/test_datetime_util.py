from datetime import datetime, timezone

import pytest
import pytz

from src.util.datetime_util import adjust_timezone


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
