import logging
from datetime import datetime

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SuppressedDestination(BaseModel):
    email_address: str = Field(alias="EmailAddress")
    reason: str = Field(alias="Reason")
    last_update_time: datetime = Field(alias="LastUpdateTime")


class MockSESV2Client:
    def __init__(self) -> None:
        self.mock_responses: list[SuppressedDestination] = []

    def add_mock_responses(self, response: SuppressedDestination) -> None:
        """Seed mock responses list with test data."""
        self.mock_responses.append(response)

    def list_suppressed_destinations(
        self,
        start_date: datetime | None = None,
    ) -> dict:
        """Return suppressed destination filtered by date range."""
        results = self.mock_responses

        if start_date:
            results = [r for r in results if r.last_update_time >= start_date]

        return {"SuppressedDestinationSummaries": [r.model_dump(by_alias=True) for r in results]}
