from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID

from src.db.models.opportunity_models import OpportunityVersion


class NotificationReason(StrEnum):
    OPPORTUNITY_UPDATES = "opportunity_updates"
    SEARCH_UPDATES = "search_updates"
    CLOSING_DATE_REMINDER = "closing_date_reminder"


class Metrics(StrEnum):
    OPPORTUNITIES_TRACKED = "opportunities_tracked"
    VERSIONLESS_OPPORTUNITY_COUNT = "versionless_opportunity_count"
    SEARCHES_TRACKED = "searches_tracked"
    CLOSING_SOON_OPPORTUNITIES_TRACKED = "closing_soon_opportunities_tracked"
    USERS_NOTIFIED = "users_notified"
    FAILED_TO_SEND = "failed_to_send"
    NOTIFICATIONS_RESET = "notifications_reset"
    SUPPRESSED_DESTINATION_COUNT = "suppressed_destination_count"


@dataclass
class UserEmailNotification:
    user_id: UUID
    user_email: str
    notification_reason: NotificationReason
    subject: str
    content: str
    notified_object_ids: list
    is_notified: bool


@dataclass
class OpportunityVersionChange:
    opportunity_id: UUID
    latest: OpportunityVersion
    previous: OpportunityVersion | None


@dataclass
class ChangedSavedOpportunity:
    user_id: UUID
    email: str
    opportunities: list[OpportunityVersionChange]


@dataclass()
class UserOpportunityUpdateContent:
    subject: str
    message: str
    updated_opportunity_ids: list
