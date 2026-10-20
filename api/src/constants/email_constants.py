from enum import StrEnum


class EmailType(StrEnum):
    """Values for the email_type SES message tag, one per kind of email we send"""

    OPPORTUNITY_UPDATES = "opportunity_updates"
    SEARCH_UPDATES = "search_updates"
    CLOSING_DATE_REMINDER = "closing_date_reminder"
    ORG_SAVED_OPPORTUNITY = "org_saved_opportunity"
    ORG_INVITATION = "org_invitation"
    WORKFLOW_APPROVAL = "workflow_approval"
