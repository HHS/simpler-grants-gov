from datetime import date

import pytest
from marshmallow import ValidationError

from src.api.extracts_v1.extract_schema import (
    ExtractMetadataListResponseSchema,
    ExtractMetadataRequestSchema,
    ExtractMetadataResponseSchema,
)
from src.db.models.extract_models import ExtractMetadata


@pytest.fixture
def sample_extract_metadata():
    return ExtractMetadata(
        extract_metadata_id=1,
        extract_type="opportunities_csv",
        file_name="test_extract.csv",
        file_path="/test/path/test_extract.csv",
        file_size_bytes=2048,
    )


def test_request_schema_validation():
    schema = ExtractMetadataRequestSchema()

    # Test valid data
    valid_data = {
        "filters": {
            "extract_type": "opportunities_csv",
            "start_date": "2023-10-01",
            "end_date": "2023-10-07",
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
    assert result["filters"]["start_date"] == date(2023, 10, 1)
    assert result["filters"]["end_date"] == date(2023, 10, 7)

    # Test invalid extract_type
    invalid_data = {"extract_type": "invalid_type", "start_date": "2023-10-01"}
    with pytest.raises(ValidationError):
        schema.load(invalid_data)


def test_response_schema_single(sample_extract_metadata):
    schema = ExtractMetadataResponseSchema()

    
    sample_extract_metadata.download_path = "http://www.example.com"
    extract_metadata = schema.dump(sample_extract_metadata)


    assert extract_metadata["download_path"] == "http://www.example.com"

    assert extract_metadata["extract_metadata_id"] == 1
    assert extract_metadata["extract_type"] == "opportunities_csv"
    assert extract_metadata["download_path"] == "http://www.example.com"
    assert extract_metadata["file_size_bytes"] == 2048


def test_response_schema_list(sample_extract_metadata):
    schema = ExtractMetadataListResponseSchema()

    # Create a list of two metadata records
    metadata_list = {
        "data": [
            sample_extract_metadata,
            ExtractMetadata(
                extract_metadata_id=2,
                extract_type="opportunities_xml",
                file_name="test_extract2.xml",
                file_path="/test/path/test_extract2.xml",
                file_size_bytes=1024,
            ),
        ]
    }

    result = schema.dump(metadata_list)

    assert len(result["data"]) == 2
    assert result["data"][0]["extract_metadata_id"] == 1
    assert result["data"][0]["extract_type"] == "opportunities_csv"
    assert result["data"][1]["extract_metadata_id"] == 2
    assert result["data"][1]["extract_type"] == "opportunities_xml"


def test_request_schema_null_values():
    schema = ExtractMetadataRequestSchema()

    # Test with some null values
    data = {
        "filters": {"extract_type": None, "start_date": "2023-10-01", "end_date": None},
        "pagination": {
            "order_by": "created_at",
            "page_offset": 1,
            "page_size": 25,
            "sort_direction": "ascending",
        },
    }

    result = schema.load(data)
    assert result["filters"]["extract_type"] is None
    assert result["filters"]["start_date"] == date(2023, 10, 1)
    assert result["filters"]["end_date"] is None
