"""Client for interacting with the Simpler Grants API."""

import abc
import logging
from typing import Any
from urllib.parse import urljoin
from uuid import UUID

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_fixed,
    wait_random_exponential,
)

from src.adapters.simpler_grants.config import SimplerGrantsConfig
from src.adapters.simpler_grants.models import OpportunityGetResponse

logger = logging.getLogger(__name__)


class BaseSimplerGrantsClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for Simpler Grants API clients."""

    @abc.abstractmethod
    def get_opportunity(self, opportunity_id: UUID) -> OpportunityGetResponse:
        """Get an opportunity by ID.

        Args:
            opportunity_id: The UUID of the opportunity to retrieve.

        Returns:
            The opportunity data.

        Raises:
            requests.HTTPError: If the API returns an error response (4xx, 5xx).
            requests.RequestException: If there is a network error.
            pydantic.ValidationError: If there is an error parsing the response.
        """
        pass


class SimplerGrantsClient(BaseSimplerGrantsClient):
    """Client for interacting with the Simpler Grants API."""

    def __init__(self, config: SimplerGrantsConfig):
        """Initialize the client.

        Args:
            config: Configuration object for the Simpler Grants client.
        """
        self.config = config
        self.base_url = config.base_url
        self.api_key = config.api_key
        self.timeout = config.timeout

    def _build_headers(self) -> dict[str, str]:
        """Build headers for API requests.

        Returns:
            Dictionary of headers.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if self.api_key:
            headers["X-API-Key"] = self.api_key

        return headers

    def _build_url(self, path: str) -> str:
        """Build the full URL for an API endpoint.

        Args:
            path: The API endpoint path (e.g., "/v1/opportunities/123").

        Returns:
            The full URL.
        """
        return urljoin(self.base_url, path)

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        """Make a request to the API with error handling.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: API endpoint path.
            **kwargs: Additional arguments to pass to requests.

        Returns:
            The response object.

        Raises:
            requests.HTTPError: If the API returns an error response (4xx, 5xx).
            requests.RequestException: If there is a network error (timeout, connection error, etc.).
        """
        url = self._build_url(path)
        headers = self._build_headers()

        # Merge provided headers with default headers
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))

        # Set default timeout if not provided
        if "timeout" not in kwargs:
            kwargs["timeout"] = self.timeout

        logger.info(
            "Making request to Simpler Grants API",
            extra={"method": method, "url": url},
        )

        try:
            response = _do_request_with_retry(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException:
            logger.exception("Request to Simpler Grants API failed")
            raise

    def get_opportunity(self, opportunity_id: UUID) -> OpportunityGetResponse:
        """Get an opportunity by ID.

        Args:
            opportunity_id: The UUID of the opportunity to retrieve.

        Returns:
            The opportunity data.

        Raises:
            requests.HTTPError: If the API returns an error response (4xx, 5xx).
            requests.RequestException: If there is a network error.
            pydantic.ValidationError: If there is an error parsing the response.
        """
        path = f"/v1/opportunities/{opportunity_id}"

        logger.info(
            "Fetching opportunity from Simpler Grants API",
            extra={"opportunity_id": str(opportunity_id)},
        )

        response = self._request("GET", path)
        return OpportunityGetResponse.model_validate_json(response.text)


@retry(
    stop=stop_after_attempt(3),
    # Wait at least 1 second between retries with some random exponential backoff jitter
    wait=wait_fixed(1) + wait_random_exponential(multiplier=1, max=10),
    # Only retry for timeouts and 5xx errors
    retry=retry_if_exception_type((requests.Timeout, requests.exceptions.ConnectionError)),
    # Raise the actual error, not a retry wrapped error
    reraise=True,
)
def _do_request_with_retry(
    method: str, url: str, headers: dict, **kwargs: Any
) -> requests.Response:
    """Make an HTTP request with retry logic.

    Args:
        method: HTTP method.
        url: Full URL to request.
        headers: Request headers.
        **kwargs: Additional arguments for requests.

    Returns:
        The response object.
    """
    return requests.request(method, url, headers=headers, **kwargs)
