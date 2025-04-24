"""Tests for the SAM.gov mock client."""

import json
import os
import tempfile
from datetime import datetime, timezone

from src.adapters.sam_gov.mock_client import MockSamGovClient
from src.adapters.sam_gov.models import (
    EntityStatus,
    EntityType,
    SamEntityRequest,
    SamEntityResponse,
)


class TestMockSamGovClient:
    """Tests for the SAM.gov mock client."""

    def test_get_entity_existing(self):
        """Test getting an entity that exists in the mock data."""
        client = MockSamGovClient()

        # Request an entity that should exist in the mock data
        request = SamEntityRequest(uei="ABCDEFGHIJK1")
        response = client.get_entity(request)

        # Verify the response
        assert response is not None
        assert response.uei == "ABCDEFGHIJK1"
        assert response.legal_business_name == "ACME Corporation"
        assert response.entity_status == EntityStatus.ACTIVE
        assert response.entity_type == EntityType.BUSINESS

    def test_get_entity_nonexistent(self):
        """Test getting an entity that does not exist in the mock data."""
        client = MockSamGovClient()

        # Request an entity that should not exist
        request = SamEntityRequest(uei="NONEXISTENT1")
        response = client.get_entity(request)

        # Verify the response is None
        assert response is None

    def test_add_mock_entity(self):
        """Test adding a new mock entity."""
        client = MockSamGovClient()

        # Create a new entity
        new_entity = SamEntityResponse(
            uei="NEWENTITY123",
            legal_business_name="New Test Entity",
            physical_address={
                "address_line_1": "555 Test St",
                "city": "Test City",
                "state_or_province": "NY",
                "zip_code": "10001",
                "country": "UNITED STATES",
            },
            entity_status=EntityStatus.ACTIVE,
            entity_type=EntityType.BUSINESS,
            created_date=datetime(2023, 1, 1, tzinfo=timezone.utc),
            last_updated_date=datetime(2023, 1, 1, tzinfo=timezone.utc),
        )

        # Add the entity to the mock client
        client.add_mock_entity(new_entity)

        # Verify the entity was added
        request = SamEntityRequest(uei="NEWENTITY123")
        response = client.get_entity(request)

        assert response is not None
        assert response.uei == "NEWENTITY123"
        assert response.legal_business_name == "New Test Entity"

    def test_update_mock_entity(self):
        """Test updating an existing mock entity."""
        client = MockSamGovClient()

        # Update an existing entity
        updated_entity = SamEntityResponse(
            uei="ABCDEFGHIJK1",
            legal_business_name="Updated ACME Corporation",
            physical_address={
                "address_line_1": "123 Main St",
                "city": "Anytown",
                "state_or_province": "MD",
                "zip_code": "20002",
                "country": "UNITED STATES",
            },
            entity_status=EntityStatus.INACTIVE,  # Changed from ACTIVE
            entity_type=EntityType.BUSINESS,
            created_date=datetime(2020, 1, 1, tzinfo=timezone.utc),
            last_updated_date=datetime(2023, 6, 15, tzinfo=timezone.utc),  # Updated
        )

        client.update_mock_entity(updated_entity)

        # Verify the entity was updated
        request = SamEntityRequest(uei="ABCDEFGHIJK1")
        response = client.get_entity(request)

        assert response is not None
        assert response.legal_business_name == "Updated ACME Corporation"
        assert response.entity_status == EntityStatus.INACTIVE
        assert response.last_updated_date == datetime(2023, 6, 15, tzinfo=timezone.utc)

    def test_delete_mock_entity(self):
        """Test deleting a mock entity."""
        client = MockSamGovClient()

        # Verify the entity exists first
        request = SamEntityRequest(uei="LMNOPQRSTUV2")
        response = client.get_entity(request)
        assert response is not None

        # Delete the entity
        client.delete_mock_entity("LMNOPQRSTUV2")

        # Verify it was deleted
        response = client.get_entity(request)
        assert response is None

    def test_load_mock_data_from_file(self):
        """Test loading mock data from a file."""
        # Create a temporary file with mock data
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as temp_file:
            mock_data = {
                "TESTFILE123": {
                    "uei": "TESTFILE123",
                    "legal_business_name": "File Test Entity",
                    "physical_address": {
                        "address_line_1": "999 File St",
                        "city": "Fileville",
                        "state_or_province": "FL",
                        "zip_code": "33333",
                        "country": "UNITED STATES",
                    },
                    "entity_status": "ACTIVE",
                    "entity_type": "BUSINESS",
                    "created_date": "2023-01-01T00:00:00+00:00",
                    "last_updated_date": "2023-01-01T00:00:00+00:00",
                }
            }
            json.dump(mock_data, temp_file)
            temp_file_path = temp_file.name

        try:
            # Initialize client with the temp file
            client = MockSamGovClient(mock_data_file=temp_file_path)

            # Verify the entity from the file was loaded
            request = SamEntityRequest(uei="TESTFILE123")
            response = client.get_entity(request)

            assert response is not None
            assert response.uei == "TESTFILE123"
            assert response.legal_business_name == "File Test Entity"
            assert response.entity_status == EntityStatus.ACTIVE
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
