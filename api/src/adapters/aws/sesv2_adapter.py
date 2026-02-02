import logging
from abc import ABC, ABCMeta, abstractmethod
from datetime import datetime

import boto3
import botocore.client
from botocore.exceptions import ClientError
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
    next_token: str | None = Field(alias="NextToken", default=None)


class BaseSESV2Client(ABC, metaclass=ABCMeta):
    @abstractmethod
    def list_suppressed_destinations(self, start_time: datetime | None = None) -> SESV2Response:
        pass


class SESV2Client(BaseSESV2Client):
    def __init__(self) -> None:
        self.client = get_boto_sesv2_client()

    def list_suppressed_destinations(self, start_time: datetime | None = None) -> SESV2Response:
        request_params: dict[str, datetime | str] = {}
        if start_time:
            request_params["StartDate"] = start_time

        all_summaries: list[SuppressedDestination] = []
        next_token = None

        try:
            logger.info("Retrieving suppressed destinations")
            iterations = 0
            while True:
                iterations += 1

                if next_token:
                    request_params["NextToken"] = next_token

                response = self.client.list_suppressed_destinations(**request_params)
                logger.info(
                    "Raw count of suppressed emails returned: %d",
                    len(response.get("SuppressedDestinationSummaries", [])),
                )

                response_object = SESV2Response.model_validate(response)
                all_summaries.extend(response_object.suppressed_destination_summaries)

                next_token = response_object.next_token
                if not next_token:
                    break
                if iterations > 100:
                    logger.error(
                        "Stopping iteration of response from list suppression API after 100 iterations"
                    )
                    break

        except ClientError:
            logger.exception("Error calling list_suppressed_destinations")
            raise

        return SESV2Response(SuppressedDestinationSummaries=all_summaries)


class MockSESV2Client(BaseSESV2Client):
    def __init__(self, page_size: int = 1) -> None:
        self.mock_responses: list[SuppressedDestination] = []

    def add_mock_responses(self, response: SuppressedDestination) -> None:
        """Seed mock responses list with test data."""
        self.mock_responses.append(response)

    def list_suppressed_destinations(
        self,
        start_time: datetime | None = None,
        next_token: str | None = None,
    ) -> SESV2Response:
        """Return suppressed destination with optional time filter."""
        results = self.mock_responses
        if start_time:
            results = [r for r in results if r.last_update_time >= start_time]

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
