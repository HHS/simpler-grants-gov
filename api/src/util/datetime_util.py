import zoneinfo
from datetime import date, datetime, timezone

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
    new_timezone = zoneinfo.ZoneInfo(timezone_str)
    return timestamp.replace(tzinfo=new_timezone)


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


def datetime_str_to_date(datetime_str: str | None) -> date | None:
    if not datetime_str:
        return None
    return datetime.fromisoformat(datetime_str).date()


def parse_grants_gov_date(date_str: str | None) -> date | None:
    """
    Parse a date string from grants.gov SOAP API response.

    Grants.gov returns dates in formats like:
    - "2025-09-16-04:00" (with timezone suffix)
    - "2025-09-16" (standard ISO format)

    This function strips any timezone suffix and returns a date object.

    Args:
        date_str: Date string from grants.gov API

    Returns:
        date object or None if date_str is None/empty

    Raises:
        ValueError: If date_str cannot be parsed as a valid date
    """
    if not date_str or not date_str.strip():
        return None

    # Strip timezone suffix if present (e.g., "-04:00" or "+05:00")
    # The pattern matches a hyphen or plus sign followed by HH:MM at the end of string
    import re

    cleaned_date_str = re.sub(r"[+-]\d{2}:\d{2}$", "", date_str.strip())

    try:
        # Parse the cleaned date string
        return datetime.fromisoformat(cleaned_date_str).date()
    except ValueError as e:
        raise ValueError(f"Could not parse date string '{date_str}': {e}") from e
