import boto3
import botocore

from pydantic_settings import BaseSettings


class S3Config(BaseSettings):
    s3_endpoint: str
    s3_opportunity_bucket: str
    boto_config: botocore.config.Config

def get_s3_client(
        s3_config: S3Config | None = None,

) -> botocore.client.BaseClient:
    if s3_config is None:
        s3_config = S3Config()

    return boto3.client("s3", config=s3_config)

