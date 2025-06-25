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
