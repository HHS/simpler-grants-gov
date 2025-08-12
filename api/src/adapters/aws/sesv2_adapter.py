import logging
from abc import ABC, ABCMeta, abstractmethod
from datetime import datetime

import boto3
import botocore.client
from pydantic import BaseModel, Field

from src.adapters.aws import get_boto_session
from src.util.env_config import PydanticBaseEnvConfig

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
    def list_suppressed_destinations(self, start_date: datetime | None = None) -> SESV2Response:
        pass


class SESV2Client(BaseSESV2Client):
    def __init__(self) -> None:
        self.client = get_boto_sesv2_client()

    def list_suppressed_destinations(self, start_date: datetime | None = None) -> SESV2Response:
        request_params = {}
        if start_date:
            request_params["StartDate"] = start_date

        response = self.client.list_suppressed_destinations(**request_params)
        response_object = SESV2Response.model_validate(response["SuppressedDestinationSummaries"])

        return response_object


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


class SesConfig(PydanticBaseEnvConfig):
    use_mock_ses_client: bool = False

def get_sesv2_client() -> BaseSESV2Client:
    config = SesConfig()
    if config.use_mock_ses_client:
        return MockSESV2Client()
    else:
        return SESV2Client()


def get_boto_sesv2_client(session: boto3.Session | None = None) -> botocore.client.BaseClient:
    if session is None:
        session = get_boto_session()

    return session.client("sesv2")