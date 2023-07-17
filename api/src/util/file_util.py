import os
from pathlib import PosixPath
from typing import Optional, Tuple
from urllib.parse import urlparse

import boto3
import botocore

##################################
# Path parsing utils
##################################


def is_s3_path(path: str | PosixPath) -> bool:
    return str(path).startswith("s3://")


def split_s3_url(path: str) -> Tuple[str, str]:
    parts = urlparse(path)
    bucket_name = parts.netloc
    prefix = parts.path.lstrip("/")
    return (bucket_name, prefix)


def get_s3_bucket(path: str) -> Optional[str]:
    return urlparse(path).hostname


def get_s3_file_key(path: str) -> str:
    return urlparse(path).path[1:]


def get_file_name(path: str) -> str:
    return os.path.basename(path)


##################################
# S3 Utilities
##################################


def get_s3_client(boto_session: Optional[boto3.Session] = None) -> botocore.client.BaseClient:
    """Returns an S3 client, wrapping around boiler plate if you already have a session"""
    if boto_session:
        return boto_session.client("s3")

    return boto3.client("s3")
