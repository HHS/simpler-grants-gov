import base64
import json
import os
import uuid
from types import SimpleNamespace
from urllib.parse import parse_qs, unquote, urlparse

import boto3
import faker
import pytest
from smart_open import open as smart_open

import grants_shared.util.file_util as file_util
from grants_shared.adapters.aws import S3Config

fake = faker.Faker()


def decode_presigned_post_policy(fields: dict) -> dict:
    """Decode the base64 policy JSON embedded in a generate_presigned_post result."""
    return json.loads(base64.b64decode(fields["policy"]))


def assert_presigned_url_targets_s3_path(url: str, bucket: str, key: str) -> None:
    """Assert a GET presigned URL targets the given bucket/key without checking the signature."""
    parsed = urlparse(url)
    decoded_path = unquote(parsed.path)
    # Path-style: /bucket/key — virtual-hosted: bucket.s3.../key
    assert bucket in parsed.netloc or decoded_path.startswith(f"/{bucket}/")
    assert decoded_path.endswith(key)


def create_file(root_path, file_path):
    full_path = os.path.join(root_path, file_path)

    if not file_util.is_s3_path(str(full_path)):
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with smart_open(full_path, mode="w") as outfile:
        outfile.write("hello")

    return full_path


@pytest.mark.parametrize(
    "path,is_s3",
    [
        ("s3://bucket/folder/test.txt", True),
        ("./relative/folder/test.txt", False),
        ("http://example.com/test.txt", False),
    ],
)
def test_is_s3_path(path, is_s3):
    assert file_util.is_s3_path(path) is is_s3


@pytest.mark.parametrize(
    "path,bucket,prefix",
    [
        ("s3://my_bucket/my_key", "my_bucket", "my_key"),
        ("s3://my_bucket/path/to/directory/", "my_bucket", "path/to/directory/"),
        ("s3://my_bucket/path/to/file.txt", "my_bucket", "path/to/file.txt"),
    ],
)
def test_split_s3_url(path, bucket, prefix):
    assert file_util.split_s3_url(path) == (bucket, prefix)


@pytest.mark.parametrize(
    "path,bucket",
    [
        ("s3://bucket/folder/test.txt", "bucket"),
        ("s3://bucket_x/folder", "bucket_x"),
        ("s3://bucket-y/folder/", "bucket-y"),
        ("s3://bucketz", "bucketz"),
    ],
)
def test_get_s3_bucket(path, bucket):
    assert file_util.get_s3_bucket(path) == bucket


@pytest.mark.parametrize(
    "path,file_key",
    [
        ("s3://bucket/folder/test.txt", "folder/test.txt"),
        ("s3://bucket_x/file.csv", "file.csv"),
        ("s3://bucket-y/folder/path/to/abc.zip", "folder/path/to/abc.zip"),
        ("./folder/path", "./folder/path"),
        ("sftp://folder/filename", "filename"),
    ],
)
def test_get_s3_file_key(path, file_key):
    assert file_util.get_s3_file_key(path) == file_key


@pytest.mark.parametrize(
    "path,file_name",
    [
        ("s3://bucket/folder/test.txt", "test.txt"),
        ("s3://bucket_x/file.csv", "file.csv"),
        ("s3://bucket-y/folder/path/to/abc.zip", "abc.zip"),
        ("./folder/path", "path"),
        ("sftp://filename", "filename"),
    ],
)
def test_get_s3_file_name(path, file_name):
    assert file_util.get_file_name(path) == file_name


@pytest.mark.parametrize(
    "path,file_name",
    [
        ("s3://bucket/folder/test~test.txt", "testtest.txt"),
        ("s3://bucket_x/file.csv", "file.csv"),
        ("s3://bucket-y/folder/path/to/abc has spaces.zip", "abc_has_spaces.zip"),
        ("./folder/path file\\x", "path_filex"),
        ("sftp://../../..//filename.....", "filename"),
    ],
)
def test_get_secure_file_name(path, file_name):
    assert file_util.get_secure_file_name(path) == file_name


def test_get_file_length_bytes(tmp_path):
    test_content = "Hello, World!"
    test_file = tmp_path / "test.txt"
    test_file.write_text(test_content)

    size = file_util.get_file_length_bytes(str(test_file))

    # Verify size matches content length
    assert size == len(test_content)


def test_get_file_length_bytes_s3_with_content(mock_s3_bucket):
    """Test getting file size from S3 with actual content"""
    # Create test content
    test_content = b"Test content!"
    test_file_path = f"s3://{mock_s3_bucket}/test/file.txt"

    # Upload test content to mock S3
    s3_client = boto3.client("s3")
    s3_client.put_object(Bucket=mock_s3_bucket, Key="test/file.txt", Body=test_content)

    # Get file size using our utility
    size = file_util.get_file_length_bytes(test_file_path)

    # Verify size matches content length
    assert size == len(test_content)


def test_file_exists_local_filesystem(tmp_path):
    file_path1 = tmp_path / "test.txt"
    file_path2 = tmp_path / "test2.txt"
    file_path3 = tmp_path / "test3.txt"

    with file_util.open_stream(file_path1, "w") as outfile:
        outfile.write("hello")
    with file_util.open_stream(file_path2, "w") as outfile:
        outfile.write("hello")
    with file_util.open_stream(file_path3, "w") as outfile:
        outfile.write("hello")

    assert file_util.file_exists(file_path1) is True
    assert file_util.file_exists(file_path2) is True
    assert file_util.file_exists(file_path3) is True
    assert file_util.file_exists(tmp_path / "test4.txt") is False
    assert file_util.file_exists(tmp_path / "test5.txt") is False


def test_file_exists_s3(mock_s3_bucket):
    file_path1 = f"s3://{mock_s3_bucket}/test.txt"
    file_path2 = f"s3://{mock_s3_bucket}/test2.txt"
    file_path3 = f"s3://{mock_s3_bucket}/test3.txt"

    with file_util.open_stream(file_path1, "w") as outfile:
        outfile.write("hello")
    with file_util.open_stream(file_path2, "w") as outfile:
        outfile.write("hello")
    with file_util.open_stream(file_path3, "w") as outfile:
        outfile.write("hello")

    assert file_util.file_exists(file_path1) is True
    assert file_util.file_exists(file_path2) is True
    assert file_util.file_exists(file_path3) is True
    assert file_util.file_exists(f"s3://{mock_s3_bucket}/test4.txt") is False
    assert file_util.file_exists(f"s3://{mock_s3_bucket}/test5.txt") is False


def test_copy_file_s3(mock_s3_bucket, other_mock_s3_bucket):
    file_path = f"s3://{mock_s3_bucket}/my_file.txt"

    with file_util.open_stream(file_path, "w") as outfile:
        outfile.write(fake.sentence(25))

    other_file_path = f"s3://{other_mock_s3_bucket}/my_new_file.txt"
    file_util.copy_file(file_path, other_file_path)

    assert file_util.file_exists(file_path) is True
    assert file_util.file_exists(other_file_path) is True

    assert file_util.read_file(file_path) == file_util.read_file(other_file_path)


def test_copy_file_local_disk(tmp_path):
    file_path = tmp_path / "my_file.txt"

    with file_util.open_stream(file_path, "w") as outfile:
        outfile.write(fake.sentence(25))

    other_file_path = tmp_path / "my_file2.txt"
    file_util.copy_file(file_path, other_file_path)

    assert file_util.file_exists(file_path) is True
    assert file_util.file_exists(other_file_path) is True

    assert file_util.read_file(file_path) == file_util.read_file(other_file_path)


def test_move_file_s3(mock_s3_bucket, other_mock_s3_bucket):
    file_path = f"s3://{mock_s3_bucket}/my_file_to_copy.txt"

    contents = fake.sentence(25)
    with file_util.open_stream(file_path, "w") as outfile:
        outfile.write(contents)

    other_file_path = f"s3://{other_mock_s3_bucket}/my_destination_file.txt"
    file_util.move_file(file_path, other_file_path)

    assert file_util.file_exists(file_path) is False
    assert file_util.file_exists(other_file_path) is True

    assert file_util.read_file(other_file_path) == contents


def test_move_file_local_disk(tmp_path):
    file_path = tmp_path / "my_file_to_move.txt"

    contents = fake.sentence(25)
    with file_util.open_stream(file_path, "w") as outfile:
        outfile.write(contents)

    other_file_path = tmp_path / "my_moved_file.txt"
    file_util.move_file(file_path, other_file_path)

    assert file_util.file_exists(file_path) is False
    assert file_util.file_exists(other_file_path) is True

    assert file_util.read_file(other_file_path) == contents


@pytest.mark.parametrize(
    "s3_path,cdn_url,expected",
    [
        (
            "s3://local-mock-public-bucket/path/to/file.pdf",
            "https://cdn.example.com",
            "https://cdn.example.com/path/to/file.pdf",
        ),
        (
            "s3://local-mock-public-bucket/opportunities/9/attachments/79853231/manager.webm",
            "https://cdn.example.com",
            "https://cdn.example.com/opportunities/9/attachments/79853231/manager.webm",
        ),
        # Test with subdirectory in CDN URL
        (
            "s3://local-mock-public-bucket/file.txt",
            "https://cdn.example.com/assets",
            "https://cdn.example.com/assets/file.txt",
        ),
    ],
)
def test_convert_s3_to_cdn_url(s3_path, cdn_url, expected, s3_config):
    assert file_util.convert_public_s3_to_cdn_url(s3_path, cdn_url, s3_config) == expected


def test_convert_s3_to_cdn_url_invalid_path(s3_config):
    with pytest.raises(ValueError, match="Expected s3:// path"):
        file_util.convert_public_s3_to_cdn_url(
            "http://not-s3/file.txt", "cdn.example.com", s3_config
        )


def test_presign_or_s3_cdnify_url_returns_cdn_url_when_cdn_configured(mock_s3_bucket, s3_config):
    s3_config.cdn_url = "https://cdn.example.com"
    file_path = f"s3://{mock_s3_bucket}/path/to/file.pdf"

    url = file_util.presign_or_s3_cdnify_url(file_path, s3_config=s3_config)

    assert url == "https://cdn.example.com/path/to/file.pdf"
    # CDN branch must not produce a signed URL
    assert "X-Amz-Expires" not in url
    assert "X-Amz-Signature" not in url


def test_presign_or_s3_cdnify_url_returns_presigned_url_when_cdn_unset(mock_s3_bucket, s3_config):
    assert s3_config.cdn_url is None
    file_path = f"s3://{mock_s3_bucket}/path/to/file.pdf"

    url = file_util.presign_or_s3_cdnify_url(file_path, s3_config=s3_config)

    query = parse_qs(urlparse(url).query)
    assert "X-Amz-Expires" in query
    assert_presigned_url_targets_s3_path(url, mock_s3_bucket, "path/to/file.pdf")


def test_presign_or_s3_cdnify_url_raises_for_non_s3_path_when_cdn_set(s3_config):
    s3_config.cdn_url = "https://cdn.example.com"

    with pytest.raises(ValueError, match="Expected s3:// path"):
        file_util.presign_or_s3_cdnify_url("http://not-s3/file.txt", s3_config=s3_config)


def test_write_to_file(tmp_path):
    contents = fake.sentence(25)
    file_path = tmp_path / "my_file_to_write.txt"
    assert file_util.file_exists(file_path) is False
    file_util.write_to_file(file_path, contents)
    assert file_util.file_exists(file_path) is True
    assert file_util.read_file(file_path) == contents


def test_pre_sign_file_location_uses_configured_duration(mock_s3_bucket):
    """Presigned URLs use the duration from S3Config (defaults to 15 minutes)."""
    s3_config = S3Config(
        PUBLIC_FILES_BUCKET=f"s3://{mock_s3_bucket}",
        DRAFT_FILES_BUCKET=f"s3://{mock_s3_bucket}",
    )

    url = file_util.pre_sign_file_location(
        f"s3://{mock_s3_bucket}/some/file.txt", s3_config=s3_config
    )

    query = parse_qs(urlparse(url).query)
    assert int(query["X-Amz-Expires"][0]) == 900


@pytest.mark.parametrize(
    "key",
    [
        "file.txt",
        "path/to/nested/file.txt",
        "path/to/my file.txt",
        "path/to/file (1) [copy].txt",
    ],
)
def test_pre_sign_file_location_uses_bucket_and_key_from_s3_path(mock_s3_bucket, s3_config, key):
    file_path = f"s3://{mock_s3_bucket}/{key}"
    bucket, parsed_key = file_util.split_s3_url(file_path)
    assert bucket == mock_s3_bucket
    assert parsed_key == key

    url = file_util.pre_sign_file_location(file_path, s3_config=s3_config)
    assert_presigned_url_targets_s3_path(url, bucket, key)


def test_pre_sign_file_location_localhost_override_when_endpoint_set(mock_s3_bucket, s3_config):
    s3_config.aws_s3_endpoint_url = "http://mocks3:9090"

    url = file_util.pre_sign_file_location(
        f"s3://{mock_s3_bucket}/some/file.txt", s3_config=s3_config
    )

    assert url.startswith("http://localhost:9090")
    assert "mocks3" not in url


def test_pre_sign_file_location_leaves_url_untouched_without_endpoint(mock_s3_bucket, s3_config):
    assert s3_config.aws_s3_endpoint_url is None

    url = file_util.pre_sign_file_location(
        f"s3://{mock_s3_bucket}/some/file.txt", s3_config=s3_config
    )

    assert not url.startswith("http://localhost:9090")
    assert_presigned_url_targets_s3_path(url, mock_s3_bucket, "some/file.txt")


def test_pre_sign_file_location_uses_non_default_duration(mock_s3_bucket, s3_config):
    s3_config.presigned_s3_duration = 3600

    url = file_util.pre_sign_file_location(
        f"s3://{mock_s3_bucket}/some/file.txt", s3_config=s3_config
    )

    query = parse_qs(urlparse(url).query)
    assert int(query["X-Amz-Expires"][0]) == 3600


def test_presigned_post_local_override_with_s3_endpoint_url(mock_s3_bucket, s3_config):
    file_id = uuid.uuid4()
    user_id = uuid.uuid4()

    s3_config.aws_s3_endpoint_url = "http://mocks3:9090"

    result = file_util.pre_sign_upload(
        file_path=f"s3://{mock_s3_bucket}/some/file.txt",
        content_type="text/plain",
        metadata={
            "file-id": str(file_id),
            "user-id": str(user_id),
        },
        s3_config=s3_config,
    )

    assert result["url"].startswith("http://localhost:9090")


def test_pre_sign_upload_pins_content_type_and_metadata(mock_s3_bucket, s3_config):
    """Content-Type and each metadata entry appear in both Fields and Conditions."""
    file_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    content_type = "application/pdf"
    metadata = {"file-id": file_id, "user-id": user_id}

    result = file_util.pre_sign_upload(
        file_path=f"s3://{mock_s3_bucket}/unscanned/{file_id}/report.pdf",
        content_type=content_type,
        metadata=metadata,
        s3_config=s3_config,
    )

    fields = result["fields"]
    assert fields["Content-Type"] == content_type
    assert fields["x-amz-meta-file-id"] == file_id
    assert fields["x-amz-meta-user-id"] == user_id

    conditions = decode_presigned_post_policy(fields)["conditions"]
    assert {"Content-Type": content_type} in conditions
    assert {"x-amz-meta-file-id": file_id} in conditions
    assert {"x-amz-meta-user-id": user_id} in conditions


def test_pre_sign_upload_content_length_range_tracks_file_config(
    mock_s3_bucket, s3_config, monkeypatch
):
    """content-length-range uses FileConfig.max_file_upload_size_bytes, not a hardcoded cap."""
    custom_max = 5 * 1024 * 1024
    monkeypatch.setattr(
        file_util,
        "get_default_file_config",
        lambda: SimpleNamespace(max_file_upload_size_bytes=custom_max),
    )

    result = file_util.pre_sign_upload(
        file_path=f"s3://{mock_s3_bucket}/some/file.txt",
        content_type="text/plain",
        metadata={"file-id": str(uuid.uuid4())},
        s3_config=s3_config,
    )

    conditions = decode_presigned_post_policy(result["fields"])["conditions"]
    assert ["content-length-range", 1, custom_max] in conditions
    # Guard against accidentally hardcoding the 2 GiB default
    assert ["content-length-range", 1, 2 * 1024 * 1024 * 1024] not in conditions


@pytest.mark.parametrize("include_if_none_match", [True, False])
def test_pre_sign_upload_include_if_none_match(mock_s3_bucket, s3_config, include_if_none_match):
    result = file_util.pre_sign_upload(
        file_path=f"s3://{mock_s3_bucket}/some/file.txt",
        content_type="text/plain",
        metadata={"file-id": str(uuid.uuid4())},
        s3_config=s3_config,
        include_if_none_match=include_if_none_match,
    )

    conditions = decode_presigned_post_policy(result["fields"])["conditions"]
    if_none_match_condition = {"IfNoneMatch": "*"}
    if include_if_none_match:
        assert if_none_match_condition in conditions
    else:
        assert if_none_match_condition not in conditions


def test_pre_sign_upload_returns_url_and_signed_fields(mock_s3_bucket, s3_config):
    result = file_util.pre_sign_upload(
        file_path=f"s3://{mock_s3_bucket}/some/file.txt",
        content_type="text/plain",
        metadata={"file-id": str(uuid.uuid4())},
        s3_config=s3_config,
    )

    assert "url" in result
    assert result["url"].startswith("http")
    assert mock_s3_bucket in result["url"]

    fields = result["fields"]
    assert "policy" in fields
    # Presence of a signature field not its value, which changes with botocore
    assert "x-amz-signature" in fields or "signature" in fields
    # Policy must be decodable JSON with conditions (structure, not signature bytes)
    policy = decode_presigned_post_policy(fields)
    assert "conditions" in policy
    assert isinstance(policy["conditions"], list)
