import boto3
from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class BaseAwsConfig(PydanticBaseEnvConfig):
    is_local_aws: bool = False
    aws_region: str = Field(alias="AWS_REGION", default="us-east-1")


_base_aws_config: BaseAwsConfig | None = None


def get_base_aws_config() -> BaseAwsConfig:
    global _base_aws_config
    if _base_aws_config is None:
        _base_aws_config = BaseAwsConfig()

    return _base_aws_config


def is_local_aws() -> bool:
    """Whether we are running against local AWS which affects the credentials we use (forces them to be not real)"""
    return get_base_aws_config().is_local_aws


def get_boto_session() -> boto3.Session:
    config = get_base_aws_config()
    if is_local_aws():
        # Locally, set fake creds so we can't hit actual AWS resources
        return boto3.Session(
            aws_access_key_id="NO_CREDS",
            aws_secret_access_key="NO_CREDS",
            region_name=config.aws_region,
        )

    return boto3.Session(region_name=config.aws_region)
