import boto3
import botocore
from pydantic_settings import BaseSettings


class S3Config(BaseSettings):
    s3_endpoint_url: str | None = None
    s3_opportunity_bucket: str | None = None


def get_s3_client(
    s3_config: S3Config | None = None,
    session: boto3.Session | None = None,
    boto_config: botocore.config.Config | None = None,
) -> botocore.client.BaseClient:
    if s3_config is None:
        s3_config = S3Config()

    params = {}
    if s3_config.s3_endpoint_url is not None:
        params["endpoint_url"] = s3_config.s3_endpoint_url

    if boto_config is None:
        boto_config = botocore.config.Config(signature_version="s3v4")

    params["config"] = boto_config

    if session is not None:
        return session.client("s3", **params)

    return boto3.client("s3", **params)
