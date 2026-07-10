"""Loads configuration variables from settings files."""

import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# reads environment variables from .env files defaulting to "local.env"
class PydanticBaseEnvConfig(BaseSettings):
    """Base settings class for env vars."""

    model_config = SettingsConfigDict(
        env_file=f"{os.getenv("ENVIRONMENT", "local")}.env",
        extra="allow",
    )


class DBSettings(PydanticBaseEnvConfig):
    """Settings container for the DB and additional connections."""

    db_host: str = Field(alias="DB_HOST")
    name: str = Field(alias="DB_NAME")
    port: int = Field(5432, alias="DB_PORT")
    user: str = Field(alias="DB_USER")
    password: str | None = Field(None, alias="DB_PASSWORD")
    ssl_mode: str = Field("require", alias="DB_SSL_MODE")
    db_schema: str = Field("app", alias="DB_SCHEMA")
    slack_bot_token: str = Field(alias="ANALYTICS_SLACK_BOT_TOKEN")
    github_token: str = Field(alias="GH_TOKEN")
    reporting_channel_id: str = Field(alias="ANALYTICS_REPORTING_CHANNEL_ID")
    aws_region: str | None = Field(None, alias="AWS_REGION")
    local_env: bool = os.getenv("ENVIRONMENT", None) == "local"


def get_db_settings() -> DBSettings:
    """Get the DBSettings object."""
    return DBSettings()
