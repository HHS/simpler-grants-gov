import logging
from abc import ABC, ABCMeta, abstractmethod
from datetime import datetime

import boto3
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SuppressedDestination(BaseModel):
    email_address: str = Field(alias="EmailAddress")
    reason: str = Field(alias="Reason")
    last_update_time: datetime = Field(alias="LastUpdateTime")


class SESV2Response(BaseModel):
    suppressed_destination_summaries: list[SuppressedDestination] = Field(
        alias="SuppressedDestinationSummaries", default_factory=list
    )


class BaseSESV2Client(ABC, metaclass=ABCMeta):
    @abstractmethod
    def list_suppressed_destinations(self) -> SESV2Response:
        pass


class SESV2Client(BaseSESV2Client):
    def __init__(self) -> None:
        self.client = boto3.client("sesv2")

    def list_suppressed_destinations(self, start_date: datetime | None = None) -> SESV2Response:
        request_params = {}
        if start_date:
            request_params["StartDate"] = start_date

        response = self.client.list_suppressed_destinations(**request_params)

        return SESV2Response(**response)


class MockSESV2Client(BaseSESV2Client):
    def __init__(self) -> None:
        self.mock_responses: list[SuppressedDestination] = []

    def add_mock_responses(self, response: SuppressedDestination) -> None:
        """Seed mock responses list with test data."""
        self.mock_responses.append(response)

    def list_suppressed_destinations(
        self,
        start_date: datetime | None = None,
    ) -> SESV2Response:
        """Return suppressed destination filtered by date range."""
        results = self.mock_responses
        if start_date:
            results = [r for r in results if r.last_update_time >= start_date]

        return SESV2Response(
            SuppressedDestinationSummaries=[r.model_dump(by_alias=True) for r in results]
        )
