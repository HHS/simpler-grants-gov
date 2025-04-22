from dataclasses import dataclass, field
from enum import StrEnum
from typing import List

class NotificationConstants(StrEnum):
    OPPORTUNITY_UPDATES = "opportunity_updates"
    SEARCH_UPDATES = "search_updates"
    CLOSING_DATE_REMINDER = "closing_date_reminder"


# TODO: Confirm with team if we want to use these metrics
class Metrics(StrEnum):
    USERS_NOTIFIED = "users_notified"
    OPPORTUNITIES_TRACKED = "opportunities_tracked"
    SEARCHES_TRACKED = "searches_tracked"
    NOTIFICATIONS_SENT = "notifications_sent"


@dataclass
class EmailData:
    to_addresses: List[str]
    subject: str
    content: dict
    notification_reason: NotificationConstants