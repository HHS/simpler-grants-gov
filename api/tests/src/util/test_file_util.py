import grants_shared.util.file_util as file_util
import pytest

from src.util.file_util import safe_presign_or_s3_cdnify_url


@pytest.fixture(autouse=True)
def reset_s3_config(monkeypatch):
    # S3Config is a module-level singleton, force a rebuild from whatever
    # env vars each test below sets.
    monkeypatch.setattr(file_util, "_s3_config", None)


def test_safe_presign_or_s3_cdnify_url_returns_cdn_url_on_match(monkeypatch):
    """When file_location's bucket matches PUBLIC_FILES_BUCKET, resolve to a real CDN url"""
    monkeypatch.setenv("PUBLIC_FILES_BUCKET", "s3://test-bucket")
    monkeypatch.setenv("CDN_URL", "https://cdn.example.com")

    download_path = safe_presign_or_s3_cdnify_url("s3://test-bucket/path/to/file.txt")

    assert download_path == "https://cdn.example.com/path/to/file.txt"


def test_safe_presign_or_s3_cdnify_url_returns_none_on_bucket_mismatch(monkeypatch):
    """A file_location whose bucket doesn't match PUBLIC_FILES_BUCKET (e.g. after
    an S3 bucket rename/migration) must never surface as a raw s3:// URL"""
    monkeypatch.setenv("PUBLIC_FILES_BUCKET", "s3://test-bucket")
    monkeypatch.setenv("CDN_URL", "https://cdn.example.com")

    download_path = safe_presign_or_s3_cdnify_url("s3://renamed-bucket/path/to/file.txt")

    assert download_path is None
