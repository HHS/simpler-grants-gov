import logging

from grants_shared.util.file_util import is_s3_path, presign_or_s3_cdnify_url

logger = logging.getLogger(__name__)


def safe_presign_or_s3_cdnify_url(file_location: str) -> str | None:
    """
    Resolve a download URL for file_location, never exposing a raw s3:// URI.

    grants_shared.presign_or_s3_cdnify_url silently returns file_location
    unchanged (a str.replace() no-op) when its bucket doesn't match the
    configured PUBLIC_FILES_BUCKET, e.g. after an S3 bucket rename/migration.
    Treat that failure mode as "unavailable" instead of leaking the internal path.
    """
    download_path = presign_or_s3_cdnify_url(file_location)

    if is_s3_path(download_path):
        logger.error(
            "download path could not be resolved to a CDN or presigned URL, "
            "refusing to expose raw s3:// path",
            extra={"file_location": file_location},
        )
        return None

    return download_path
