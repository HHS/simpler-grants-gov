import logging
from typing import Optional

from pydantic import Field

from src.constants.schema import Schemas
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class PostgresDBConfig(PydanticBaseEnvConfig):
    check_connection_on_init: bool = Field(True, alias="DB_CHECK_CONNECTION_ON_INIT")
    aws_region: Optional[str] = Field(None, alias="AWS_REGION")
    host: str = Field(alias="DB_HOST")
    name: str = Field(alias="DB_NAME")
    username: str = Field(alias="DB_USER")
    password: Optional[str] = Field(None, alias="DB_PASSWORD")
    port: int = Field(5432, alias="DB_PORT")
    hide_sql_parameter_logs: bool = Field(True, alias="HIDE_SQL_PARAMETER_LOGS")
    ssl_mode: str = Field("require", alias="DB_SSL_MODE")

    schema_prefix_override: str | None = Field(None)

    def get_schema_translate_map(self) -> dict[str, str]:
        prefix = ""
        if self.schema_prefix_override is not None:
            prefix = self.schema_prefix_override

        return {schema: f"{prefix}{schema}" for schema in Schemas}


def get_db_config() -> PostgresDBConfig:
    db_config = PostgresDBConfig()

    logger.info(
        "Constructed database configuration",
        extra={
            "host": db_config.host,
            "dbname": db_config.name,
            "username": db_config.username,
            "password": "***" if db_config.password is not None else None,
            "port": db_config.port,
            "hide_sql_parameter_logs": db_config.hide_sql_parameter_logs,
        },
    )

    return db_config
