import os

import pytest
from smart_open import open as smart_open

import src.util.file_util as file_util


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
        ("./folder/path", "/folder/path"),
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
