import logging

from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class OpensearchConfig(PydanticBaseEnvConfig):

    search_endpoint: str = Field(default="NOT_DEFINED")  # SEARCH_ENDPOINT
    search_port: int = Field(default=443)  # SEARCH_PORT

    search_username: str | None = Field(default=None)  # SEARCH_USERNAME
    search_password: str | None = Field(default=None)  # SEARCH_PASSWORD

    search_use_ssl: bool = Field(default=True)  # SEARCH_USE_SSL
    search_verify_certs: bool = Field(default=True)  # SEARCH_VERIFY_CERTS
    search_connection_pool_size: int = Field(default=10)  # SEARCH_CONNECTION_POOL_SIZE


def get_opensearch_config() -> OpensearchConfig:
    opensearch_config = OpensearchConfig()

    logger.info(
        "Constructed opensearch configuration",
        extra={
            "search_endpoint": opensearch_config.search_endpoint,
            "search_port": opensearch_config.search_port,
            "search_use_ssl": opensearch_config.search_use_ssl,
            "search_verify_certs": opensearch_config.search_verify_certs,
            "search_connection_pool_size": opensearch_config.search_connection_pool_size,
        },
    )

    return opensearch_config
