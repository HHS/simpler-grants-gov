from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class EmailNotificationConfig(PydanticBaseEnvConfig):
    app_id: str = Field(alias="PINPOINT_APP_ID")
    frontend_base_url: str = Field(alias="FRONTEND_BASE_URL")
