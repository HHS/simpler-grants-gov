from .aws_session import get_aws_config, get_boto_session, is_local_aws
from .dynamodb_adapter import DynamoDBConfig, get_boto_dynamodb_client
from .s3_adapter import S3Config, get_s3_client
from .ses_adapter import SESConfig, get_ses_client, send_email
from .sqs_adapter import SQSConfig, get_boto_sqs_client

__all__ = [
    "get_aws_config",
    "get_boto_session",
    "get_s3_client",
    "S3Config",
    "get_boto_sqs_client",
    "is_local_aws",
    "get_ses_client",
    "send_email",
    "SESConfig",
    "SQSConfig",
    "get_boto_dynamodb_client",
    "DynamoDBConfig",
]
