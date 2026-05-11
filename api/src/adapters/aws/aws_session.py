import boto3
from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class AwsConfig(PydanticBaseEnvConfig):
    is_local_aws: bool = False
    aws_region: str = Field(alias="AWS_REGION", default="us-east-1")


_aws_config: AwsConfig | None = None


def get_aws_config() -> AwsConfig:
    global _aws_config
    if _aws_config is None:
        _aws_config = AwsConfig()

    return _aws_config


def is_local_aws() -> bool:
    """Whether we are running against local AWS which affects the credentials we use (forces them to be not real)"""
    return get_aws_config().is_local_aws


def get_boto_session() -> boto3.Session:
    config = get_aws_config()
    if is_local_aws():
        # Locally, set fake creds so we can't hit actual AWS resources
        return boto3.Session(
            aws_access_key_id="NO_CREDS",
            aws_secret_access_key="NO_CREDS",
            region_name=config.aws_region,
        )

    return boto3.Session(region_name=config.aws_region)
