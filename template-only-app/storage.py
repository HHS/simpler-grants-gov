import io
import logging
import os

import boto3
from botocore.client import Config

logger = logging.getLogger()


def create_upload_url(path):
    bucket_name = os.environ.get("BUCKET_NAME")

    # Manually specify signature version 4 which is required since the bucket is encrypted with KMS.
    # By default presigned URLs use signature version 2 to be backwards compatible
    s3_client = boto3.client("s3", config=Config(signature_version="s3v4"))
    logger.info("Generating presigned POST URL for path %s", path)
    response = s3_client.generate_presigned_post(bucket_name, path)
    return response["url"], response["fields"]


def download_file(path):
    bucket_name = os.environ.get("BUCKET_NAME")

    s3_client = boto3.client("s3", config=Config(signature_version="s3v4"))
    logger.info("Downloading file %s", path)
    response = s3_client.get_object(
        Bucket=bucket_name,
        Key=path,
    )
    body = response["Body"]
    return io.BytesIO(body.read())


def upload_file(path, data):
    bucket_name = os.environ.get("BUCKET_NAME")

    s3_client = boto3.client("s3", config=Config(signature_version="s3v4"))
    logger.info("Uploading file to path %s", path)
    s3_client.put_object(
        Bucket=bucket_name,
        Key=path,
        Body=data,
    )
