import boto3
import botocore.client

from src.util.env_config import PydanticBaseEnvConfig


class S3Config(PydanticBaseEnvConfig):
    # We should generally not need to set this except
    # locally to use localstack
    s3_endpoint_url: str | None = None

    ### S3 Buckets
    # note that we default these to None
    # so that we don't need to set all of these for every
    # process that uses S3

    # TODO - I'm not sure how we want to organize our
    #        s3 buckets so this will likely change in the future
    s3_opportunity_bucket: str | None = None


def get_s3_client(s3_config: S3Config | None = None) -> botocore.client.BaseClient:
    if s3_config is None:
        s3_config = S3Config()

    params = {}
    if s3_config.s3_endpoint_url is not None:
        params["endpoint_url"] = s3_config.s3_endpoint_url

    return boto3.client("s3", **params)
