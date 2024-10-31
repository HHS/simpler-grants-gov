import os

import boto3


def get_boto_session() -> boto3.Session:
    is_local = bool(os.getenv("IS_LOCAL_AWS", False))
    if is_local:
        return boto3.Session(aws_access_key_id="NO_CREDS", aws_secret_access_key="NO_CREDS")

    return boto3.Session()
