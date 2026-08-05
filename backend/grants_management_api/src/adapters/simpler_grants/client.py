"""Client for interacting with the Simpler Grants API."""

import abc
import logging
from typing import Any
from urllib.parse import urljoin
from uuid import UUID

import requests
from grants_shared.api.response import ValidationErrorDetail
from pydantic import BaseModel, ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_fixed,
    wait_random_exponential,
)

from src.adapters.simpler_grants.config import SimplerGrantsConfig
from src.adapters.simpler_grants.models import SimplerOpportunityGetResponse

logger = logging.getLogger(__name__)


class SimplerResponseError(BaseModel):
    """Error response from the Simpler Grants API."""

    message: str
    status_code: int
    errors: list[ValidationErrorDetail] | None = None


class SimplerResponseException(Exception):
    """Exception raised when the Simpler Grants API returns an error response."""

    def __init__(self, simpler_response_error: SimplerResponseError):
        """Initialize the exception with the error response.

        Args:
            simpler_response_error: The parsed error response from the API.
        """
        super().__init__(simpler_response_error.message)
        self.simpler_response_error = simpler_response_error


class BaseSimplerGrantsClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for Simpler Grants API clients."""

    @abc.abstractmethod
    def get_opportunity(self, opportunity_id: UUID) -> SimplerOpportunityGetResponse:
        """Get an opportunity by ID.

        Args:
            opportunity_id: The UUID of the opportunity to retrieve.

        Returns:
            The opportunity data.

        Raises:
            SimplerResponseException: If the API returns an error response (4xx, 5xx).
            requests.Timeout: If the request times out.
            requests.ConnectionError: If unable to connect to the API.
            ValidationError: If the API returns a 2xx response but the data doesn't match the expected schema.
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

    def _build_headers(self) -> dict[str, str]:
        """Build headers for API requests.

        Returns:
            Dictionary of headers.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if self.config.api_key:
            headers["X-API-Key"] = self.config.api_key

        return headers

    def _build_url(self, path: str) -> str:
        """Build the full URL for an API endpoint.

        Args:
            path: The API endpoint path (e.g., "/v1/opportunities/123").

        Returns:
            The full URL.
        """
        return urljoin(self.config.base_url, path)

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        """Make a request to the API with error handling.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: API endpoint path.
            **kwargs: Additional arguments to pass to requests.

        Returns:
            The response object.

        Raises:
            SimplerResponseException: If the API returns an error response (4xx, 5xx).
            requests.Timeout: If the request times out.
            requests.ConnectionError: If unable to connect to the API.
        """
        url = self._build_url(path)
        headers = self._build_headers()

        # Merge provided headers with default headers
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))

        # Set default timeout if not provided
        if "timeout" not in kwargs:
            kwargs["timeout"] = self.config.timeout

        logger.info(
            "Making request to Simpler Grants API",
            extra={"method": method, "url": url},
        )

        response = _do_request_with_retry(method, url, headers=headers, **kwargs)

        # If response is not successful, parse error and raise custom exception
        if not response.ok:
            self._handle_error_response(response)

        return response

    def _handle_error_response(self, response: requests.Response) -> None:
        """Parse error response and raise SimplerResponseException.

        Args:
            response: The error response from the API.

        Raises:
            SimplerResponseException: Always raised with parsed error details.
        """
        try:
            # Attempt to parse the error response as JSON
            error_data = response.json()
            errors = None

            # Extract validation errors if present
            if "errors" in error_data and isinstance(error_data["errors"], list):
                errors = [
                    ValidationErrorDetail(
                        type=err.get("type", "unknown"),
                        message=err.get("message", ""),
                        field=err.get("field"),
                        value=err.get("value"),
                    )
                    for err in error_data["errors"]
                ]

            simpler_error = SimplerResponseError(
                message=error_data.get("message", response.reason),
                status_code=response.status_code,
                errors=errors,
            )
        except ValueError, KeyError, ValidationError:
            # If we can't parse the error response, use text or reason
            # priority: text (actual response body) > reason (HTTP status) > "Unknown error" (last fall back message)
            message = response.text or response.reason or "Unknown error"
            simpler_error = SimplerResponseError(
                message=message,
                status_code=response.status_code,
                errors=None,
            )

        raise SimplerResponseException(simpler_error)

    def get_opportunity(self, opportunity_id: UUID) -> SimplerOpportunityGetResponse:
        path = f"/v1/opportunities/{opportunity_id}"

        logger.info(
            "Fetching opportunity from Simpler Grants API",
            extra={"opportunity_id": opportunity_id},
        )

        response = self._request("GET", path)
        return SimplerOpportunityGetResponse.model_validate_json(response.text)


@retry(
    stop=stop_after_attempt(3),
    # Wait at least 1 second between retries with some random exponential backoff jitter
    wait=wait_fixed(1) + wait_random_exponential(multiplier=1, max=10),
    # Only retry for timeouts and connection errors
    retry=retry_if_exception_type((requests.Timeout, requests.exceptions.ConnectionError)),
    # Raise the actual error, not a retry wrapped error
    reraise=True,
)
def _do_request_with_retry(
    method: str, url: str, headers: dict, **kwargs: Any
) -> requests.Response:
    """Make an HTTP request with retry logic.

    Retries up to 3 times for timeout and connection errors with exponential backoff.

    Args:
        method: HTTP method.
        url: Full URL to request.
        headers: Request headers.
        **kwargs: Additional arguments for requests.

    Returns:
        The response object.

    Raises:
        requests.Timeout: If the request times out after retries.
        requests.ConnectionError: If unable to connect after retries.
    """
    return requests.request(method, url, headers=headers, **kwargs)
