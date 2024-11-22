from datetime import datetime, timedelta

import boto3
import pytest
import requests

import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from tests.src.db.models.factories import ExtractMetadataFactory


@pytest.fixture(autouse=True)
def clear_extracts(db_session):
    db_session.query(ExtractMetadata).delete()
    db_session.commit()
    yield


def test_extract_metadata_get_default_dates(
    client, api_auth_token, enable_factory_create, db_session
):
    """Test that default date range (last 7 days) is applied when no dates provided"""

    # These should return in the default date range
    ExtractMetadataFactory.create_batch(2, extract_type=ExtractType.OPPORTUNITIES_JSON)

    # This should not return because it's outside the default date range
    ExtractMetadataFactory(
        created_at=datetime.now() - timedelta(days=15),
    )

    payload = {
        "filters": {"extract_type": "opportunities_json"},
        "pagination": {
            "page": 1,
            "page_size": 10,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }
    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)
    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 2
    assert data[0]["extract_type"] == "opportunities_json"


def test_extract_metadata_get_with_custom_dates(
    client, api_auth_token, enable_factory_create, db_session
):
    """Test with explicitly provided date range"""
    ExtractMetadataFactory.create_batch(
        2,
        created_at=datetime.now() - timedelta(days=10),
    )

    payload = {
        "filters": {
            "created_at": {
                "start_date": (datetime.now() - timedelta(days=15)).date().isoformat(),
                "end_date": datetime.now().date().isoformat(),
            }
        },
        "pagination": {
            "page": 1,
            "page_size": 10,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }

    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 2
    assert data[0]["download_path"].startswith("http://localhost:4566/bucket/key")


def test_extract_metadata_get_with_type_filter(
    client, api_auth_token, enable_factory_create, db_session
):
    """Test filtering by extract_type"""
    ExtractMetadataFactory(extract_type=ExtractType.OPPORTUNITIES_JSON)
    ExtractMetadataFactory(extract_type=ExtractType.OPPORTUNITIES_CSV)

    payload = {
        "filters": {"extract_type": "opportunities_json"},
        "pagination": {
            "page": 1,
            "page_size": 10,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }

    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1
    assert data[0]["extract_type"] == "opportunities_json"


def test_extract_metadata_get_pagination(client, api_auth_token, enable_factory_create, db_session):
    """Test pagination of results"""
    ExtractMetadataFactory.create_batch(2)

    payload = {
        "pagination": {
            "page": 1,
            "page_size": 1,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }

    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1

    # Test second page
    payload["pagination"]["page"] = 2
    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)
    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1


def test_extract_metadata_get_pagination_info(
    client, api_auth_token, enable_factory_create, db_session
):
    """Test pagination information in response"""
    # Create 5 extracts to test pagination
    ExtractMetadataFactory.create_batch(
        5, extract_type=ExtractType.OPPORTUNITIES_JSON, created_at=datetime_util.utcnow()
    )

    # Request 2 items per page
    payload = {
        "pagination": {
            "page_size": 2,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }

    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200

    # Verify data length matches page_size
    data = response.json["data"]
    assert len(data) == 2

    # Verify pagination info
    pagination = response.json["pagination_info"]
    assert pagination["total_records"] == 5
    assert pagination["total_pages"] == 3
    assert pagination["page_size"] == 2
    # Test last page
    payload["pagination"]["page_offset"] = 3
    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200
    data = response.json["data"]
    pagination = response.json["pagination_info"]

    assert len(data) == 1  # Last page should have 1 item


def test_extract_metadata_presigned_url(
    client, api_auth_token, enable_factory_create, db_session, mock_s3_bucket
):
    """Test that pre-signed URLs are generated correctly and can be used to download files"""

    # Create test extract with known file content
    test_content = b"test file content"
    test_file_path = f"s3://{mock_s3_bucket}/test/file.csv"

    # Create extract metadata
    ExtractMetadataFactory(
        extract_type=ExtractType.OPPORTUNITIES_CSV,
        file_path=test_file_path,
        file_size_bytes=len(test_content),
    )

    # Upload test file to mock S3
    s3_client = boto3.client("s3")
    s3_client.put_object(Bucket=mock_s3_bucket, Key="test/file.csv", Body=test_content)

    # Request extract metadata
    payload = {
        "filters": {"extract_type": "opportunities_csv"},
        "pagination": {
            "page_size": 10,
            "page_offset": 1,
            "order_by": "created_at",
            "sort_direction": "descending",
        },
    }

    response = client.post("/v1/extracts", headers={"X-Auth": api_auth_token}, json=payload)

    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1

    # Verify pre-signed URL format
    download_url = data[0]["download_path"]

    # Try downloading the file using the pre-signed URL
    download_response = requests.get(download_url)
    assert download_response.status_code == 200
    assert download_response.content == test_content
