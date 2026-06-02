from .aws_session import get_aws_config, get_boto_session, is_local_aws
from .ses_adapter import SESConfig, get_ses_client, send_email

__all__ = [
    "get_aws_config",
    "get_boto_session",
    "is_local_aws",
    "get_ses_client",
    "send_email",
    "SESConfig",
]
