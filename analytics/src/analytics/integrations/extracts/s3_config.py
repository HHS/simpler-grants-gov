"""Configuration for S3."""

import boto3
import botocore


def get_s3_client(
    session: boto3.Session | None = None,
    boto_config: botocore.config.Config | None = None,
) -> botocore.client.BaseClient:
    """Return an S3 client."""
    if boto_config is None:
        boto_config = botocore.config.Config(signature_version="s3v4")

    if session is not None:
        return session.client("s3", config=boto_config)

    return boto3.client("s3", config=boto_config)
