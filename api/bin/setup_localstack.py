import logging

import botocore.client
import botocore.exceptions

import src.logging
from src.adapters.aws import S3Config, get_s3_client
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def does_s3_bucket_exist(s3_client: botocore.client.BaseClient, bucket_name: str) -> bool:
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        return True
    except botocore.exceptions.ClientError as e:
        # We'll assume that if the error code is a 404 that means
        # it could not find the bucket and thus it needs to be created
        # as there are not more specific errors than this available
        error_code = e.response.get("Error", {}).get("Code")
        if error_code != "404":
            raise e

    return False


def setup_s3() -> None:
    s3_config = S3Config()
    s3_client = get_s3_client(s3_config)

    if s3_config.s3_opportunity_bucket is None:
        raise Exception("S3_OPPORTUNITY_BUCKET env var must be set")

    if not does_s3_bucket_exist(s3_client, s3_config.s3_opportunity_bucket):
        logger.info("Creating S3 bucket %s", s3_config.s3_opportunity_bucket)
        s3_client.create_bucket(Bucket=s3_config.s3_opportunity_bucket)
    else:
        logger.info("S3 bucket %s already exists - skipping", s3_config.s3_opportunity_bucket)


def main() -> None:
    with src.logging.init("setup_localstack"):
        error_if_not_local()
        setup_s3()


if __name__ == "__main__":
    main()
