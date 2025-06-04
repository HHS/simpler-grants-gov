from datetime import date

import pytest
from marshmallow import ValidationError

import src.util.file_util as file_util
from src.api.extracts_v1.extract_schema import (
    ExtractMetadataListResponseSchema,
    ExtractMetadataRequestSchema,
    ExtractMetadataResponseSchema,
)
from src.db.models.extract_models import ExtractMetadata


@pytest.fixture
def sample_extract_metadata():
    return ExtractMetadata(
        extract_type="opportunities_csv",
        file_name="test_extract.csv",
        file_path="s3://local-mock-public-bucket/test/path/test_extract.csv",
        file_size_bytes=2048,
    )


def test_request_schema_validation():
    schema = ExtractMetadataRequestSchema()

    # Test valid data
    valid_data = {
        "filters": {
            "extract_type": "opportunities_csv",
            "created_at": {
                "start_date": "2023-10-01",
                "end_date": "2023-10-07",
            },
        },
        "pagination": {
            "order_by": "created_at",
            "page_offset": 1,
            "page_size": 25,
            "sort_direction": "ascending",
        },
    }
    result = schema.load(valid_data)
    assert result["filters"]["extract_type"] == "opportunities_csv"
    assert result["filters"]["created_at"]["start_date"] == date(2023, 10, 1)
    assert result["filters"]["created_at"]["end_date"] == date(2023, 10, 7)

    # Test invalid extract_type
    invalid_data = {"extract_type": "invalid_type", "start_date": "2023-10-01"}
    with pytest.raises(ValidationError):
        schema.load(invalid_data)


def test_response_schema_single(sample_extract_metadata):
    schema = ExtractMetadataResponseSchema()

    extract_metadata = schema.dump(sample_extract_metadata)

    assert (
        extract_metadata["download_path"]
        == "http://localhost:4566/local-mock-public-bucket/test/path/test_extract.csv"
    )
    assert extract_metadata["extract_metadata_id"] == sample_extract_metadata.extract_metadata_id
    assert extract_metadata["extract_type"] == "opportunities_csv"
    assert extract_metadata["file_size_bytes"] == 2048


def test_response_schema_list(sample_extract_metadata):
    schema = ExtractMetadataListResponseSchema()

    # Create a list of two metadata records
    other_extract_metadata = ExtractMetadata(
        extract_type="opportunities_json",
        file_name="test_extract2.xml",
        file_path="s3://local-mock-public-bucket/test/path/test_extract2.xml",
        file_size_bytes=1024,
    )

    metadata_list = {"data": [sample_extract_metadata, other_extract_metadata]}

    result = schema.dump(metadata_list)

    assert len(result["data"]) == 2
    assert result["data"][0]["extract_metadata_id"] == sample_extract_metadata.extract_metadata_id
    assert result["data"][0]["extract_type"] == "opportunities_csv"
    assert (
        result["data"][0]["download_path"]
        == "http://localhost:4566/local-mock-public-bucket/test/path/test_extract.csv"
    )
    assert result["data"][1]["extract_metadata_id"] == other_extract_metadata.extract_metadata_id
    assert result["data"][1]["extract_type"] == "opportunities_json"
    assert (
        result["data"][1]["download_path"]
        == "http://localhost:4566/local-mock-public-bucket/test/path/test_extract2.xml"
    )


def test_request_schema_null_values():
    schema = ExtractMetadataRequestSchema()

    # Test with some null values
    data = {
        "filters": {
            "extract_type": None,
            "created_at": {"start_date": "2023-10-01", "end_date": None},
        },
        "pagination": {
            "order_by": "created_at",
            "page_offset": 1,
            "page_size": 25,
            "sort_direction": "ascending",
        },
    }

    result = schema.load(data)
    assert result["filters"]["extract_type"] is None
    assert result["filters"]["created_at"]["start_date"] == date(2023, 10, 1)
    assert result["filters"]["created_at"]["end_date"] is None


def test_extract_metadata_with_presigned_url(monkeypatch):
    """Test that when cdn_url is None, presigning is used instead of CDN URLs"""
    # Reset the global _s3_config to ensure a fresh config is created
    monkeypatch.setattr(file_util, "_s3_config", None)

    # Create a metadata object with a valid S3 path
    extract = ExtractMetadata(
        extract_type="opportunities_csv",
        file_name="test_presign.csv",
        file_path="s3://local-mock-public-bucket/presign-test/test_presign.csv",
        file_size_bytes=1024,
    )

    # Set environment variables instead of creating a mock config
    monkeypatch.setenv("CDN_URL", "")  # Empty string to ensure no CDN is used
    monkeypatch.setenv("S3_ENDPOINT_URL", "http://localstack:4566")
    monkeypatch.setenv("PUBLIC_FILES_BUCKET", "s3://local-mock-public-bucket")

    # Get the download_path which should now use the presigned URL path
    result_url = extract.download_path

    # Verify we got the presigned URL (not a CDN URL)
    assert "X-Amz-Signature" in result_url
