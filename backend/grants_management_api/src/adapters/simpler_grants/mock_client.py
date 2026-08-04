from uuid import UUID

from src.adapters.simpler_grants.client import (
    BaseSimplerGrantsClient,
    SimplerResponseError,
    SimplerResponseException,
)
from src.adapters.simpler_grants.models import SimplerOpportunityGetResponse


class MockSimplerGrantsClient(BaseSimplerGrantsClient):
    """Mock implementation of SimplerGrantsClient for testing, without hitting the real Simpler Grants API."""

    def __init__(self) -> None:
        """Initialize the mock client with empty response storage."""
        self.responses: dict[UUID, SimplerOpportunityGetResponse] = {}
        self.errors: dict[UUID, SimplerResponseException] = {}

    def add_opportunity_response(
        self, opportunity_id: UUID, response: SimplerOpportunityGetResponse
    ) -> None:
        """Configure mock to return this response for the given opportunity ID."""
        self.responses[opportunity_id] = response

    def add_error_response(self, opportunity_id: UUID, error: SimplerResponseException) -> None:
        """Configure mock to raise this error for the given opportunity ID."""
        self.errors[opportunity_id] = error

    def get_opportunity(self, opportunity_id: UUID) -> SimplerOpportunityGetResponse:
        """Get a mocked opportunity response.

        Returns the configured response or raises the configured error.
        If no response is configured, raises a 404 error.
        """
        if opportunity_id in self.errors:
            raise self.errors[opportunity_id]

        if opportunity_id in self.responses:
            return self.responses[opportunity_id]

        # Default: raise 404
        error = SimplerResponseError(
            message="Opportunity not found",
            status_code=404,
            errors=None,
        )
        raise SimplerResponseException(error)
