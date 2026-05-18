from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class DynamoDBConfig(PydanticBaseEnvConfig):
    aws_dynamodb_endpoint_url: str | None = Field(alias="AWS_DYNAMODB_ENDPOINT_URL", default=None)
    file_scan_cache_table_name: str = Field(alias="FILE_SCAN_CACHE_TABLE_NAME")
