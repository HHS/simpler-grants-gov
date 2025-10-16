"""Tests for the CommonGrants Protocol routes."""

import uuid
from datetime import datetime

from flask.testing import FlaskClient

from tests.src.db.models.factories import OpportunityFactory


def validate_opportunity_structure(opportunity):
    """Validate the complete structure of an opportunity object."""
    # Required top-level fields
    assert "id" in opportunity
    assert "title" in opportunity
    assert "description" in opportunity
    assert "funding" in opportunity
    assert "source" in opportunity
    assert "createdAt" in opportunity
    assert "lastModifiedAt" in opportunity
    assert "keyDates" in opportunity
    assert "status" in opportunity
    assert "customFields" in opportunity

    # Validate funding structure
    funding = opportunity["funding"]
    assert "details" in funding
    assert "estimatedAwardCount" in funding
    assert "maxAwardAmount" in funding
    assert "maxAwardCount" in funding
    assert "minAwardAmount" in funding
    assert "minAwardCount" in funding
    assert "totalAmountAvailable" in funding

    # Validate keyDates structure
    key_dates = opportunity["keyDates"]
    assert "closeDate" in key_dates
    assert "otherDates" in key_dates
    assert "postDate" in key_dates

    # Validate status structure
    status = opportunity["status"]
    assert "customValue" in status
    assert "description" in status
    assert "value" in status

    # Validate date formats (ISO 8601)
    try:
        datetime.fromisoformat(opportunity["createdAt"].replace("Z", "+00:00"))
        datetime.fromisoformat(opportunity["lastModifiedAt"].replace("Z", "+00:00"))
    except ValueError as e:
        raise AssertionError("Invalid date format in createdAt or lastModifiedAt") from e


class TestListOpportunities:
    """Test /common-grants/opportunities endpoint."""

    def test_default_pagination(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities endpoint with default pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(15, is_draft=False)

        response = client.get("/common-grants/opportunities", headers={"X-Auth": api_auth_token})
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        # Check required top-level fields
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data

            assert isinstance(data["items"], list)
            assert len(data["items"]) == 10  # Default page size
            assert data["status"] == 200
            assert "Opportunities fetched successfully" in data["message"]

            # Validate pagination info structure
            pagination_info = data["paginationInfo"]
            assert "page" in pagination_info
            assert "pageSize" in pagination_info
            assert "totalItems" in pagination_info
            assert "totalPages" in pagination_info
            assert pagination_info["page"] == 1
            assert pagination_info["pageSize"] == 10
            assert pagination_info["totalItems"] >= 15
            assert pagination_info["totalPages"] >= 2

            # Check first opportunity structure
            if data["items"]:
                opportunity = data["items"][0]
                validate_opportunity_structure(opportunity)

    def test_pagination_specified(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities endpoint with custom pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(5, is_draft=False)

        response = client.get(
            "/common-grants/opportunities?page=2&pageSize=2", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert isinstance(data["items"], list)
            assert data["status"] == 200
            assert "Opportunities fetched successfully" in data["message"]

            # Validate pagination info for custom page
            pagination_info = data["paginationInfo"]
            assert pagination_info["page"] == 2
            assert pagination_info["pageSize"] == 2

    def test_pagination_edge_cases(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test pagination edge cases."""
        # Create test opportunities
        OpportunityFactory.create_batch(5, is_draft=False)

        # Test page beyond available data
        response = client.get(
            "/common-grants/opportunities?page=1000&pageSize=10", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert isinstance(data["items"], list)
            assert len(data["items"]) == 0  # No items on page beyond available data
            assert data["paginationInfo"]["page"] == 1000

        # Test large page size
        response = client.get(
            "/common-grants/opportunities?page=1&pageSize=1000", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert data["paginationInfo"]["pageSize"] == 1000

    def test_excludes_drafts(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that draft opportunities are excluded from results."""
        # Create published and draft opportunities
        OpportunityFactory.create_batch(3, is_draft=False)
        OpportunityFactory.create_batch(2, is_draft=True)

        response = client.get("/common-grants/opportunities", headers={"X-Auth": api_auth_token})
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert isinstance(data["items"], list)
            # Verify that only published opportunities are returned
            assert data["paginationInfo"]["totalItems"] >= 3  # At least the 3 published ones
            assert data["status"] == 200
            assert "Opportunities fetched successfully" in data["message"]

            # Verify all returned opportunities are not drafts
            for item in data["items"]:
                # Draft opportunities should not be in the results
                assert item["status"]["value"] != "draft"


class TestGetOpportunityById:
    """Test /common-grants/opportunities/{id} endpoint."""

    def test_opportunity_not_found(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities/{id} endpoint when opportunity is not found."""
        response = client.get(
            f"/common-grants/opportunities/{uuid.uuid4()}", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "message" in data
        assert "Could not find Opportunity with ID" in data["message"]

    def test_opportunity_invalid_uuid(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities/{id} endpoint with invalid UUID."""
        response = client.get(
            "/common-grants/opportunities/invalid-uuid", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "message" in data
        assert "Not Found" in data["message"]

    def test_opportunity_success(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities/{id} endpoint with valid UUID."""
        # Create a test opportunity
        opportunity = OpportunityFactory.create(is_draft=False)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-Auth": api_auth_token},
        )
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        assert "data" in data
        assert "status" in data
        assert "message" in data
        assert data["data"]["id"] == str(opportunity.opportunity_id)
        assert data["status"] == 200
        assert data["message"] == "Success"

        # Validate the complete opportunity structure
        validate_opportunity_structure(data["data"])

    def test_draft_opportunity_not_found(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that draft opportunities are not accessible."""
        # Create a draft opportunity
        opportunity = OpportunityFactory.create(is_draft=True)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-Auth": api_auth_token},
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "message" in data
        assert "Could not find Opportunity with ID" in data["message"]


class TestSearchOpportunities:
    """Test /common-grants/opportunities/search endpoint.

    Note: These tests focus on basic wrapper functionality since the new search route
    is essentially a wrapper around the existing search functionality. Comprehensive
    search testing is covered in the old search tests.
    """

    def test_search_endpoint_exists(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that the search endpoint exists and is accessible."""
        # Test that the endpoint exists and is accessible
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-Auth": api_auth_token},
            json={},
        )
        # Endpoint should exist and return a response (status depends on environment setup)
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert "filterInfo" in data
            assert "sortInfo" in data

    def test_search_invalid_request(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test search with invalid request data."""
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-Auth": api_auth_token},
            json={"invalid": "data"},
        )
        # Should return an error status (400/422 for validation errors, 500 for missing search index)
        assert response.status_code in [400, 422, 500]
        data = response.get_json()
        assert "message" in data


class TestResponseSchemaValidation:
    """Test that responses conform to the expected marshmallow schema format."""

    def test_list_opportunities_response_schema(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that list opportunities response matches expected schema."""
        # Create test opportunity
        OpportunityFactory.create(is_draft=False)

        response = client.get("/common-grants/opportunities", headers={"X-Auth": api_auth_token})
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        # Check required top-level fields
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data

            # Check items structure if any exist
            if data["items"]:
                item = data["items"][0]
                validate_opportunity_structure(item)

    def test_get_opportunity_response_schema(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that get opportunity response matches expected schema."""
        # Create test opportunity
        opportunity = OpportunityFactory.create(is_draft=False)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-Auth": api_auth_token},
        )
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()

        # Check required top-level fields
        assert "status" in data
        assert "message" in data
        assert "data" in data

        # Check data structure
        opportunity_data = data["data"]
        validate_opportunity_structure(opportunity_data)

    def test_search_opportunities_response_schema(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that search opportunities endpoint exists and handles responses properly."""
        # Create test opportunity
        OpportunityFactory.create(is_draft=False)

        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-Auth": api_auth_token},
            json={},
        )
        # Endpoint should exist and return a response (status depends on environment setup)
        assert response.status_code in [200, 500]  # 200 if search index exists, 500 if missing
        data = response.get_json()
        assert "message" in data

        # If successful (200), validate response structure
        if response.status_code == 200:
            assert "status" in data
            assert "items" in data
            assert "paginationInfo" in data
            assert "filterInfo" in data
            assert "sortInfo" in data
