from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class EmailNotificationConfig(PydanticBaseEnvConfig):
    app_id: str = Field(alias="AWS_PINPOINT_APP_ID")
    frontend_base_url: str = Field(alias="FRONTEND_BASE_URL")
    enable_closing_date_notifications: bool = Field(
        default=True, alias="ENABLE_CLOSING_DATE_NOTIFICATIONS"
    )
    enable_opportunity_notifications: bool = Field(
        default=True, alias="ENABLE_OPPORTUNITY_NOTIFICATIONS"
    )
    enable_search_notifications: bool = Field(default=True, alias="ENABLE_SEARCH_NOTIFICATIONS")
    reset_emails_without_sending: bool = Field(default=True, alias="RESET_EMAILS_WITHOUT_SENDING")
    sync_suppressed_emails: bool = Field(default=True, alias="SYNC_SUPPRESSED_EMAILS")


# Singleton instance to avoid refetching env vars on every request
_config: EmailNotificationConfig | None = None


def get_email_config() -> EmailNotificationConfig:
    """Get the singleton EmailNotificationConfig instance.

    This ensures we only fetch environment variables once rather than on every request.
    """
    global _config
    if _config is None:
        _config = EmailNotificationConfig()
    return _config


def _reset_email_config() -> None:
    """Reset the singleton EmailNotificationConfig instance.

    This is primarily used for testing to ensure environment variable changes
    are picked up between test cases.
    """
    global _config
    _config = None
