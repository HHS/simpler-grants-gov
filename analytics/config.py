"""Loads configuration variables from settings files

"""
import os 
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# reads environment variables from .env files defaulting to "local.env"
class PydanticBaseEnvConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file="%s.env" % os.getenv("ENVIRONMENT", "local"), extra="ignore") # set extra to ignore so that it ignores variables irrelevant to the database config (e.g. metabase settings)

class DBSettings(PydanticBaseEnvConfig):
     db_host: str = Field(alias="DB_HOST")
     port: int = Field(5432,alias="DB_PORT")
     user: str = Field (alias="DB_USER")
     password: str = Field(alias="DB_PASSWORD")
     ssl_mode: str = Field(alias="DB_SSL_MODE")
     slack_bot_token: str = Field(alias="ANALYTICS_SLACK_BOT_TOKEN")
     reporting_channel_id: str = Field(alias="ANALYTICS_REPORTING_CHANNEL_ID")

def get_db_settings() -> DBSettings:
     return DBSettings()