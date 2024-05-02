from datetime import date, datetime, timezone
from typing import Optional

import pytz


def utcnow() -> datetime:
    """Current time in UTC tagged with timezone info marking it as UTC, unlike datetime.utcnow().

    See https://docs.python.org/3/library/datetime.html#datetime.datetime.utcnow
    """
    return datetime.now(timezone.utc)


def adjust_timezone(timestamp: datetime, timezone_str: str) -> datetime:
    """
    Utility method for converting a datetime object
    between different timezones. The string passed in
    can be anything recognized by the pytz library

    Details on how to find all the potential timezone
    names can be found in http://pytz.sourceforge.net/#helpers
    but a few that are likely useful include:
    * UTC
    * US/Eastern
    * US/Central
    * US/Mountain
    * US/Pacific
    """
    new_timezone = pytz.timezone(timezone_str)
    return timestamp.astimezone(new_timezone)


def make_timezone_aware(timestamp: datetime, timezone_str: str) -> datetime:
    # TODO - circle back to this and verify it doesn't break everything
    timestamp = timestamp.replace(tzinfo=None)
    new_timezone = pytz.timezone(timezone_str)
    return new_timezone.localize(timestamp)


def get_now_us_eastern_datetime() -> datetime:
    """
    Return the current time in the eastern time zone. DST is handled based on the local time.
    For information on handling Daylight Savings Time, refer to this documentation on now() vs. utcnow():
    http://pytz.sourceforge.net/#problems-with-localtime
    """

    # Note that this uses Eastern time (not UTC)
    tz = pytz.timezone("America/New_York")
    return datetime.now(tz)


def get_now_us_eastern_date() -> date:
    # We get the datetime and truncate it to the date portion
    # as there aren't any direct date methods that take in a timezone
    return get_now_us_eastern_datetime().date()


def datetime_str_to_date(datetime_str: Optional[str]) -> Optional[date]:
    if not datetime_str:
        return None
    return datetime.fromisoformat(datetime_str).date()
