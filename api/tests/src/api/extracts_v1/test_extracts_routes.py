from datetime import datetime, timedelta

import pytest

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
    ExtractMetadataFactory.create_batch(
        2,
        extract_type=ExtractType.OPPORTUNITIES_XML,
    )

    payload = {
        "filters": {"extract_type": "opportunities_xml"},
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
    assert data[0]["extract_type"] == "opportunities_xml"


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


def test_extract_metadata_get_with_type_filter(
    client, api_auth_token, enable_factory_create, db_session
):
    """Test filtering by extract_type"""
    ExtractMetadataFactory(extract_type=ExtractType.OPPORTUNITIES_XML)
    ExtractMetadataFactory(extract_type=ExtractType.OPPORTUNITIES_CSV)

    payload = {
        "filters": {"extract_type": "opportunities_xml"},
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
    assert data[0]["extract_type"] == "opportunities_xml"


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
