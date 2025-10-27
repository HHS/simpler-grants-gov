import os
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import botocore.client
import smart_open
from botocore.config import Config
from werkzeug.utils import secure_filename

from src.adapters.aws import S3Config, get_boto_session, get_s3_client

##################################
# Path parsing utils
##################################

# Module-level singleton for default S3Config
_s3_config = None


def get_default_s3_config() -> S3Config:
    """
    Returns a singleton instance of S3Config to avoid reading env vars repeatedly.
    """
    global _s3_config
    if _s3_config is None:
        _s3_config = S3Config()
    return _s3_config


def is_s3_path(path: str | Path) -> bool:
    return str(path).startswith("s3://")


def split_s3_url(path: str | Path) -> tuple[str, str]:
    parts = urlparse(str(path))
    bucket_name = parts.netloc
    prefix = parts.path.lstrip("/")
    return bucket_name, prefix


def get_s3_bucket(path: str | Path) -> str:
    return split_s3_url(path)[0]


def get_s3_file_key(path: str | Path) -> str:
    return split_s3_url(path)[1]


def get_file_name(path: str) -> str:
    return Path(path).name


def get_secure_file_name(path: str) -> str:
    """Grabs the filename of the path and then makes it safe for further path operations
    while removing non-ascii characters.
    """
    return secure_filename(get_file_name(path))


def join(*parts: str) -> str:
    return os.path.join(*parts)


##################################
#  File operat
##################################


def open_stream(
    path: str | Path, mode: str = "r", encoding: str | None = None, content_type: str | None = None
) -> Any:
    if is_s3_path(path):
        s3_client = get_s3_client()

        so_config = Config(
            max_pool_connections=10,
            connect_timeout=60,
            read_timeout=60,
            retries={"max_attempts": 10},
        )

        client_kwargs = {"config": so_config}
        # By default all files uploaded to s3 have a generic "application/octet-stream" content-type
        # which means if they're opened in a browser they always download.
        # We can set the content type (mimetype) by passing it to the create multipart upload function.
        # See: https://github.com/piskvorky/smart_open?tab=readme-ov-file#s3-advanced-usage
        if content_type:
            client_kwargs["S3.Client.create_multipart_upload"] = {"ContentType": content_type}

        so_transport_params = {"client_kwargs": client_kwargs, "client": s3_client}

        return smart_open.open(path, mode, transport_params=so_transport_params, encoding=encoding)
    else:
        return smart_open.open(path, mode, encoding=encoding)


def pre_sign_file_location(file_path: str, s3_config: S3Config | None = None) -> str:
    if s3_config is None:
        s3_config = get_default_s3_config()

    s3_client = get_s3_client(s3_config, get_boto_session())
    bucket, key = split_s3_url(file_path)
    pre_sign_file_loc = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=s3_config.presigned_s3_duration,
    )
    if s3_config.s3_endpoint_url:
        # Only relevant when local, due to docker path issues
        pre_sign_file_loc = pre_sign_file_loc.replace(
            s3_config.s3_endpoint_url, "http://localhost:4566"
        )

    return pre_sign_file_loc


def get_file_length_bytes(path: str) -> int:
    if is_s3_path(path):
        s3_client = (
            get_s3_client()
        )  # from our aws utils - handles some of the weird localstack stuff

        bucket, key = split_s3_url(path)
        file_metadata = s3_client.head_object(Bucket=bucket, Key=key)
        return file_metadata["ContentLength"]

    file_stats = os.stat(path)
    return file_stats.st_size


def copy_file(source_path: str | Path, destination_path: str | Path) -> None:
    is_source_s3 = is_s3_path(source_path)
    is_dest_s3 = is_s3_path(destination_path)

    # This isn't a download or upload method
    # Don't allow "copying" between mismatched locations
    if is_source_s3 != is_dest_s3:
        raise Exception("Cannot download/upload between disk and S3 using this method")

    if is_source_s3:
        s3_client = get_s3_client()

        source_bucket, source_path = split_s3_url(source_path)
        dest_bucket, dest_path = split_s3_url(destination_path)

        s3_client.copy({"Bucket": source_bucket, "Key": source_path}, dest_bucket, dest_path)
    else:
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        shutil.copy2(source_path, destination_path)


def delete_file(path: str | Path) -> None:
    """Delete a file from s3 or local disk"""
    if is_s3_path(path):
        bucket, s3_path = split_s3_url(path)

        s3_client = get_s3_client()
        s3_client.delete_object(Bucket=bucket, Key=s3_path)
    else:
        os.remove(path)


def move_file(source_path: str | Path, destination_path: str | Path) -> None:
    is_source_s3 = is_s3_path(source_path)
    is_dest_s3 = is_s3_path(destination_path)

    # This isn't a download or upload method
    # Don't allow "copying" between mismatched locations
    if is_source_s3 != is_dest_s3:
        raise Exception("Cannot download/upload between disk and S3 using this method")

    if is_source_s3:
        copy_file(source_path, destination_path)
        delete_file(source_path)

    else:
        os.renames(source_path, destination_path)


def file_exists(path: str | Path) -> bool:
    """Get whether a file exists or not"""
    if is_s3_path(path):
        s3_client = get_s3_client()

        bucket, key = split_s3_url(path)

        try:
            s3_client.head_object(Bucket=bucket, Key=key)
            return True
        except botocore.exceptions.ClientError:
            return False

    # Local file system
    return Path(path).exists()


def read_file(path: str | Path, mode: str = "r", encoding: str | None = None) -> str:
    """Simple function for just getting all of the contents of a file"""
    with open_stream(path, mode, encoding) as input_file:
        return input_file.read()


def write_to_file(path: str | Path, content: str, encoding: str | None = None) -> str:
    """Simple function for replacing contents of a file"""
    with open_stream(path, "w", encoding) as file_to_write_to:
        return file_to_write_to.write(content)


def convert_public_s3_to_cdn_url(file_path: str, cdn_url: str, s3_config: S3Config) -> str:
    """
    Convert an S3 URL to a CDN URL

    Example:
        s3://bucket-name/path/to/file.txt -> https://cdn.example.com/path/to/file.txt
    """
    if not is_s3_path(file_path):
        raise ValueError(f"Expected s3:// path, got: {file_path}")

    return file_path.replace(s3_config.public_files_bucket_path, cdn_url)


def presign_or_s3_cdnify_url(file_path: str, s3_config: S3Config | None = None) -> str:
    """
    Generates a URL for file download, either using CDN or pre-signed URL.
    """
    if s3_config is None:
        s3_config = get_default_s3_config()

    if s3_config.cdn_url:
        return convert_public_s3_to_cdn_url(file_path, s3_config.cdn_url, s3_config)
    else:
        return pre_sign_file_location(file_path, s3_config)
