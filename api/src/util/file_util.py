import os
from pathlib import PosixPath
from typing import Any, Optional, Tuple
from urllib.parse import urlparse

import smart_open
from botocore.config import Config

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


def join(*parts: str) -> str:
    return os.path.join(*parts)


##################################
#  File operations
##################################


def open_stream(path: str, mode: str = "r", encoding: str | None = None) -> Any:
    if is_s3_path(path):
        so_config = Config(
            max_pool_connections=10,
            connect_timeout=60,
            read_timeout=60,
            retries={"max_attempts": 10},
        )
        so_transport_params = {"client_kwargs": {"config": so_config}}

        return smart_open.open(path, mode, transport_params=so_transport_params, encoding=encoding)
    else:
        return smart_open.open(path, mode, encoding=encoding)
