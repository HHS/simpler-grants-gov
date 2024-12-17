"""Configuration for S3."""

import boto3
import botocore
from pydantic import Field
from pydantic_settings import BaseSettings


class S3Config(BaseSettings):
    """Configure S3 properties."""

    s3_opportunity_bucket: str | None = Field(
        default=None,
        alias="S3_OPPORTUNITY_BUCKET",
    )
    s3_opportunity_file_path_prefix: str | None = Field(
        default=None,
        alias="S3_OPPORTUNITY_FILE_PATH_PREFIX",
    )


def get_s3_client(
    s3_config: S3Config | None = None,
    session: boto3.Session | None = None,
    boto_config: botocore.config.Config | None = None,
) -> botocore.client.BaseClient:
    """Instantiate S3Config class if not passed and return an S3 client."""
    if s3_config is None:
        S3Config()

    if boto_config is None:
        boto_config = botocore.config.Config(signature_version="s3v4")

    if session is not None:
        return session.client("s3", config=boto_config)

    return boto3.client("s3", config=boto_config)
