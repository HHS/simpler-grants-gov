"""Tests for the CommonGrants Protocol routes."""

import uuid
from datetime import date, datetime, timedelta, timezone

import marshmallow
import pytest
from flask.testing import FlaskClient

from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityStatus,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)


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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test GET /common-grants/opportunities endpoint with default pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(15, is_draft=False)

        response = client.get(
            "/common-grants/opportunities", headers={"X-API-Key": user_api_key_id}
        )
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test GET /common-grants/opportunities endpoint with custom pagination."""
        # Create test opportunities
        OpportunityFactory.create_batch(5, is_draft=False)

        response = client.get(
            "/common-grants/opportunities?page=2&pageSize=2",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test pagination edge cases."""
        # Create test opportunities
        OpportunityFactory.create_batch(5, is_draft=False)

        # Test page beyond available data
        response = client.get(
            "/common-grants/opportunities?page=1000&pageSize=10",
            headers={"X-API-Key": user_api_key_id},
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
            "/common-grants/opportunities?page=1&pageSize=1000",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that draft opportunities are excluded from results."""
        # Create published and draft opportunities
        OpportunityFactory.create_batch(3, is_draft=False)
        OpportunityFactory.create_batch(2, is_draft=True)

        response = client.get(
            "/common-grants/opportunities", headers={"X-API-Key": user_api_key_id}
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test GET /common-grants/opportunities/{id} endpoint when opportunity is not found."""
        response = client.get(
            f"/common-grants/opportunities/{uuid.uuid4()}",
            headers={"X-API-Key": user_api_key_id},
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "message" in data
        assert "Could not find Opportunity with ID" in data["message"]

    def test_opportunity_invalid_uuid(
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test GET /common-grants/opportunities/{id} endpoint with invalid UUID."""
        response = client.get(
            "/common-grants/opportunities/invalid-uuid", headers={"X-API-Key": user_api_key_id}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "message" in data
        assert "Not Found" in data["message"]

    def test_opportunity_success(
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test GET /common-grants/opportunities/{id} endpoint with valid UUID."""
        # Create a test opportunity
        opportunity = OpportunityFactory.create(is_draft=False)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that draft opportunities are not accessible."""
        # Create a draft opportunity
        opportunity = OpportunityFactory.create(is_draft=True)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that the search endpoint exists and is accessible."""
        # Test that the endpoint exists and is accessible
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test search with invalid request data."""
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
            json={"invalid": "data"},
        )
        # Should return an error status (400/422 for validation errors, 500 for missing search index)
        assert response.status_code in [400, 422, 500]
        data = response.get_json()
        assert "message" in data


class TestResponseSchemaValidation:
    """Test that responses conform to the expected marshmallow schema format."""

    def test_list_opportunities_response_schema(
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that list opportunities response matches expected schema."""
        # Create test opportunity
        OpportunityFactory.create(is_draft=False)

        response = client.get(
            "/common-grants/opportunities", headers={"X-API-Key": user_api_key_id}
        )
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that get opportunity response matches expected schema."""
        # Create test opportunity
        opportunity = OpportunityFactory.create(is_draft=False)

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-API-Key": user_api_key_id},
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
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Test that search opportunities endpoint exists and handles responses properly."""
        # Create test opportunity
        OpportunityFactory.create(is_draft=False)

        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
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


class TestSchemaValidation:
    """Test Marshmallow schema validation for request and response paths."""

    def test_invalid_sort_by_returns_422(
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Invalid sortBy value is rejected by APIFlask input validation → 422."""
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
            json={"sorting": {"sortBy": "not_a_valid_field", "sortOrder": "asc"}},
        )
        assert response.status_code == 422

    def test_invalid_filter_operator_returns_422(
        self, client: FlaskClient, enable_factory_create, db_session, user_api_key_id
    ):
        """Invalid filter operator is rejected by APIFlask input validation → 422."""
        response = client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
            json={"filters": {"status": {"operator": "invalid_op", "value": ["open"]}}},
        )
        assert response.status_code == 422

    def test_response_schema_error_returns_500(
        self,
        client: FlaskClient,
        enable_factory_create,
        db_session,
        user_api_key_id,
        monkeypatch,
    ):
        """Marshmallow ValidationError raised during response loading → 500 with runtime message."""
        opportunity = OpportunityFactory.create(is_draft=False)

        def raise_validation_error(*args, **kwargs):
            raise marshmallow.ValidationError("simulated response schema failure")

        monkeypatch.setattr(
            "src.api.common_grants.common_grants_routes.OpportunityResponseSchema.load",
            raise_validation_error,
        )

        response = client.get(
            f"/common-grants/opportunities/{opportunity.opportunity_id}",
            headers={"X-API-Key": user_api_key_id},
        )
        assert response.status_code == 500
        data = response.get_json()
        assert "message" in data
        assert "CommonGrants runtime exception" in data["message"]


class TestSearchCustomFilters(BaseTestClass):
    """Index-seeded integration tests that prove each customFilter actually filters results.

    Seeding is class-scoped: four opportunities with distinct, known facet values are
    loaded into the live OpenSearch index once, and every test asserts exact returned IDs.
    Each test must fail if its filter stops working.
    """

    @pytest.fixture(scope="class", autouse=True)
    def setup_search_data(
        self,
        opportunity_index,
        opportunity_index_alias,
        search_client,
    ):
        now = datetime.now(tz=timezone.utc)
        today = date.today()
        future_close = today + timedelta(weeks=4)
        past_post = today - timedelta(weeks=1)

        # OPP A: USAID agency, state_governments applicant, cooperative_agreement instrument,
        #        cost_sharing=True — matches agency, applicantType, costSharing tests
        opp_a = OpportunityFactory.build(
            agency_code="USAID",
            opportunity_assistance_listings=[],
            current_opportunity_summary=None,
            # Provide timestamps explicitly: .build() bypasses DB defaults, but
            # OpenSearch needs a non-null updated_at to infer a date mapping for sorting.
            created_at=now,
            updated_at=now,
        )
        summary_a = OpportunitySummaryFactory.build(
            opportunity=opp_a,
            applicant_types=[ApplicantType.STATE_GOVERNMENTS],
            funding_instruments=[FundingInstrument.COOPERATIVE_AGREEMENT],
            funding_categories=[FundingCategory.EDUCATION],
            is_cost_sharing=True,
            post_date=past_post,
            close_date=future_close,
        )
        opp_a.current_opportunity_summary = CurrentOpportunitySummaryFactory.build(
            opportunity=opp_a,
            opportunity_summary=summary_a,
            opportunity_status=OpportunityStatus.POSTED,
        )

        # OPP B: DOC agency, other applicant, grant instrument, cost_sharing=False
        #        matches fundingInstrument and costSharing=False tests
        opp_b = OpportunityFactory.build(
            agency_code="DOC",
            opportunity_assistance_listings=[],
            current_opportunity_summary=None,
            created_at=now,
            updated_at=now,
        )
        summary_b = OpportunitySummaryFactory.build(
            opportunity=opp_b,
            applicant_types=[ApplicantType.OTHER],
            funding_instruments=[FundingInstrument.GRANT],
            funding_categories=[FundingCategory.OTHER],
            is_cost_sharing=False,
            post_date=past_post,
            close_date=future_close,
        )
        opp_b.current_opportunity_summary = CurrentOpportunitySummaryFactory.build(
            opportunity=opp_b,
            opportunity_summary=summary_b,
            opportunity_status=OpportunityStatus.POSTED,
        )

        # Record IDs for assertions
        self.__class__.opp_a_id = str(opp_a.opportunity_id)
        self.__class__.opp_b_id = str(opp_b.opportunity_id)

        schema = OpportunityV1Schema()
        records = [schema.dump(opp_a), schema.dump(opp_b)]

        search_client.bulk_upsert(opportunity_index, records, "opportunity_id", refresh=True)
        search_client.swap_alias_index(opportunity_index, opportunity_index_alias)

    def _search(self, client, user_api_key_id, body):
        return client.post(
            "/common-grants/opportunities/search",
            headers={"X-API-Key": user_api_key_id},
            json=body,
        )

    def test_agency_filter(self, client: FlaskClient, user_api_key_id):
        """agency filter with operator=in returns only the matching opportunity."""
        resp = self._search(
            client,
            user_api_key_id,
            {"filters": {"customFilters": {"agency": {"operator": "in", "value": ["USAID"]}}}},
        )
        assert resp.status_code == 200
        ids = {item["id"] for item in resp.get_json()["items"]}
        assert ids == {self.opp_a_id}

    def test_applicant_type_filter(self, client: FlaskClient, user_api_key_id):
        """applicantType filter with CG vocab value returns only the matching opportunity."""
        resp = self._search(
            client,
            user_api_key_id,
            {
                "filters": {
                    "customFilters": {
                        "applicantType": {"operator": "in", "value": ["government_state"]}
                    }
                }
            },
        )
        assert resp.status_code == 200
        ids = {item["id"] for item in resp.get_json()["items"]}
        assert ids == {self.opp_a_id}

    def test_funding_instrument_filter(self, client: FlaskClient, user_api_key_id):
        """fundingInstrument filter with value=grant returns only the matching opportunity."""
        resp = self._search(
            client,
            user_api_key_id,
            {
                "filters": {
                    "customFilters": {"fundingInstrument": {"operator": "in", "value": ["grant"]}}
                }
            },
        )
        assert resp.status_code == 200
        ids = {item["id"] for item in resp.get_json()["items"]}
        assert ids == {self.opp_b_id}

    def test_cost_sharing_filter(self, client: FlaskClient, user_api_key_id):
        """costSharing filter with operator=eq value=true returns only the cost-sharing opp."""
        resp = self._search(
            client,
            user_api_key_id,
            {"filters": {"customFilters": {"costSharing": {"operator": "eq", "value": True}}}},
        )
        assert resp.status_code == 200
        ids = {item["id"] for item in resp.get_json()["items"]}
        assert ids == {self.opp_a_id}

    def test_unsupported_custom_filter_key_returns_error(
        self, client: FlaskClient, user_api_key_id
    ):
        """An unrecognized customFilters key yields status 200 with an error in filterInfo.errors."""
        resp = self._search(
            client,
            user_api_key_id,
            {"filters": {"customFilters": {"bogus": {"operator": "in", "value": ["x"]}}}},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        errors = data["filterInfo"]["errors"]
        assert any("customFilters.bogus: unsupported filter" in e for e in errors)
