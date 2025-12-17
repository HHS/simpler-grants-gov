import logging

from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class OpensearchConfig(PydanticBaseEnvConfig):

    search_endpoint: str = Field(default="NOT_DEFINED")  # SEARCH_ENDPOINT
    search_port: int = Field(default=443)  # SEARCH_PORT

    search_use_ssl: bool = Field(default=True)  # SEARCH_USE_SSL
    search_verify_certs: bool = Field(default=True)  # SEARCH_VERIFY_CERTS
    search_connection_pool_size: int = Field(default=10)  # SEARCH_CONNECTION_POOL_SIZE

    # AWS region - when set, IAM (SigV4) authentication is used
    # This requires the ECS task role to have the appropriate OpenSearch permissions
    aws_region: str | None = Field(default=None)  # AWS_REGION


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
            "aws_region": opensearch_config.aws_region,
        },
    )

    return opensearch_config
