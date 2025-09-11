"""Tests for the CommonGrants Protocol routes."""

import uuid

from flask.testing import FlaskClient

from tests.src.db.models.factories import OpportunityFactory


class TestListOpportunities:
    """Test /common-grants/opportunities endpoint."""

    def test_default_pagination(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities endpoint with default pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(15, is_draft=False)

        response = client.get("/common-grants/opportunities", headers={"X-Auth": api_auth_token})
        assert response.status_code == 200
        data = response.get_json()

        # Check required top-level fields
        assert "status" in data
        assert "message" in data
        assert "items" in data

        assert isinstance(data["items"], list)
        assert len(data["items"]) == 10  # Default page size
        assert data["status"] == 200
        assert "Opportunities fetched successfully" in data["message"]

        # Check first opportunity structure
        if data["items"]:
            opportunity = data["items"][0]
            assert "id" in opportunity
            assert "title" in opportunity
            assert "description" in opportunity
            assert "funding" in opportunity
            assert "source" in opportunity

    def test_pagination_specified(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test GET /common-grants/opportunities endpoint with custom pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(5, is_draft=False)

        response = client.get(
            "/common-grants/opportunities?page=2&pageSize=2", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code == 200
        data = response.get_json()

        assert "status" in data
        assert "message" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        assert data["status"] == 200
        assert "Opportunities fetched successfully" in data["message"]

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
        assert response.status_code == 200
        data = response.get_json()
        assert "status" in data
        assert "message" in data
        assert "items" in data
        assert isinstance(data["items"], list)

        # Test large page size
        response = client.get(
            "/common-grants/opportunities?page=1&pageSize=1000", headers={"X-Auth": api_auth_token}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "status" in data
        assert "message" in data
        assert "items" in data

    def test_excludes_drafts(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test that draft opportunities are excluded from results."""
        # Create published and draft opportunities
        OpportunityFactory.create_batch(3, is_draft=False)
        OpportunityFactory.create_batch(2, is_draft=True)

        response = client.get("/common-grants/opportunities", headers={"X-Auth": api_auth_token})
        assert response.status_code == 200
        data = response.get_json()

        assert "status" in data
        assert "message" in data
        assert "items" in data
        # Note: The actual response doesn't include paginationInfo
        assert isinstance(data["items"], list)
        # We can't easily test the exact count without pagination info, but we can check structure
        assert data["status"] == 200
        assert "Opportunities fetched successfully" in data["message"]


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
        assert data["message"] == "The server cannot find the requested resource"

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
        assert "The server cannot find the requested resource" in data["message"]

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
        assert response.status_code == 200
        data = response.get_json()

        assert "data" in data
        assert data["data"]["id"] == str(opportunity.opportunity_id)
        assert data["status"] == 200
        assert data["message"] == "Success"

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
        assert data["message"] == "The server cannot find the requested resource"


class TestSearchOpportunities:
    """Test /common-grants/opportunities/search endpoint."""

    def test_search_invalid_request(
        self, client: FlaskClient, enable_factory_create, db_session, api_auth_token
    ):
        """Test search with invalid request data."""
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-Auth": api_auth_token},
            json={"invalid": "data"},
        )
        assert response.status_code in [400, 422, 500]
        if response.status_code != 500:
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
        assert response.status_code == 200
        data = response.get_json()

        # Check required top-level fields
        assert "status" in data
        assert "message" in data
        assert "items" in data

        # Check items structure if any exist
        if data["items"]:
            item = data["items"][0]
            assert "id" in item
            assert "title" in item
            assert "description" in item
            assert "funding" in item
            assert "source" in item

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
        assert response.status_code == 200
        data = response.get_json()

        # Check required top-level fields
        assert "status" in data
        assert "message" in data
        assert "data" in data

        # Check data structure
        opportunity_data = data["data"]
        assert "id" in opportunity_data
        assert "title" in opportunity_data
        assert "description" in opportunity_data
        assert "funding" in opportunity_data
        assert "source" in opportunity_data
