"""SAM.gov API client implementation."""

import abc
import logging
from datetime import datetime
from typing import Any
from urllib.parse import urljoin

import requests
from pydantic import BaseModel

from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.models import SamExtractRequest, SamExtractResponse
from src.util.file_util import get_file_length_bytes, open_stream

logger = logging.getLogger(__name__)


class SamExtractInfo(BaseModel):
    """Information about a SAM.gov extract file"""

    url: str
    filename: str
    updated_at: datetime


class BaseSamGovClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for SAM.gov API clients."""

    @abc.abstractmethod
    def download_extract(self, request: SamExtractRequest, output_path: str) -> SamExtractResponse:
        """Download an extract file from SAM.gov.

        Args:
            request: The request containing parameters for the extract download.
            output_path: The path where the extract file should be saved.

        Returns:
            Metadata about the downloaded file.

        Raises:
            ValueError: If the request parameters are invalid or the extract is not found.
            IOError: If there is an error saving the file.
            requests.exceptions.RequestException: If there is an error with the API request.
        """
        pass

    @abc.abstractmethod
    def get_monthly_extract_info(self) -> SamExtractInfo | None:
        """Get information about the latest monthly extract"""
        pass

    @abc.abstractmethod
    def get_daily_extract_info(self) -> list[SamExtractInfo]:
        """Get information about available daily extracts"""
        pass


class SamGovClient(BaseSamGovClient):
    """Client for interacting with the SAM.gov API."""

    def __init__(
        self,
        config: SamGovConfig,
    ):
        """Initialize the client.

        Args:
            config: Configuration object for the SAM.gov client.
        """
        self.api_key = config.api_key
        self.api_url = config.base_url

    def _build_headers(self) -> dict[str, str]:
        """Build headers for API requests.

        Returns:
            Dictionary of headers.
        """
        if not self.api_key:
            raise ValueError("API key must be provided for SAM.gov API access")

        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-api-key": self.api_key,
        }

    def download_extract(
        self, extract_request: SamExtractRequest, output_path: str
    ) -> SamExtractResponse:
        """Download SAM.gov data extract.

        Args:
            extract_request: The request containing parameters for the extract download.
                             Primarily used for the file_name to download.
            output_path: Path to save the downloaded file. Can be a local file path or an S3 URI (s3://).

        Returns:
            Response object with download information.

        Raises:
            ValueError: If the request parameters are invalid or the extract is not found.
            IOError: If there is an issue saving the file.
            Exception: For any other errors.
        """

        # Validate that API key is provided
        if not self.api_key:
            raise ValueError("API key must be provided for SAM.gov API access")

        # Validate that API URL is provided
        if not self.api_url:
            raise ValueError("API URL must be provided for SAM.gov API access")

        # Build URL and parameters for file download
        url = urljoin(self.api_url, "data-services/v1/extracts")

        params = {"fileName": extract_request.file_name}

        try:
            headers = self._build_headers()

            logging.info(f"Downloading SAM.gov extract from {url}")
            logging.debug(f"Request parameters: {params}")

            response = requests.get(url, params=params, headers=headers, stream=True, timeout=30)

            if not response.ok:
                error_message = (
                    f"Failed to download extract: {response.status_code} {response.reason}"
                )
                try:
                    error_data = response.json()
                    error_message += f", Details: {error_data}"
                except Exception:
                    pass

                raise Exception(error_message)

            # Get headers for metadata
            content_type = response.headers.get("Content-Type", "")
            content_length = int(response.headers.get("Content-Length", 0))

            # Save the file
            with open_stream(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Get file size using file_util to properly handle both local and S3 paths
            file_size = content_length
            if not file_size:
                file_size = get_file_length_bytes(output_path)

            # Build response object
            extract_response = SamExtractResponse(
                file_name=extract_request.file_name,
                file_size=file_size,
                content_type=content_type,
                download_date=datetime.now(),
            )

            return extract_response

        except requests.RequestException as e:
            raise Exception(f"Request failed: {str(e)}") from e
        except IOError as e:
            raise IOError(f"Failed to save file: {str(e)}") from e
        except Exception as e:
            raise Exception(f"Error downloading extract: {str(e)}") from e

    def _request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        stream: bool = False,
        accept_content_type: str = "application/json",
        **kwargs: Any,
    ) -> requests.Response:
        """Make a request to the SAM.gov API.

        Args:
            method: HTTP method to use.
            endpoint: API endpoint to call.
            params: Optional query parameters.
            data: Optional request body data.
            stream: Whether to stream the response.
            accept_content_type: Content type to accept in the response.
            **kwargs: Additional arguments to pass to requests.

        Returns:
            The HTTP response.

        Raises:
            requests.exceptions.RequestException: For various request errors.
        """
        # Validate that API key is provided
        if not self.api_key:
            raise ValueError("API key must be provided for SAM.gov API access")

        # Validate that API URL is provided
        if not self.api_url:
            raise ValueError("API URL must be provided for SAM.gov API access")

        # Use urljoin to handle URL path concatenation properly
        url = urljoin(self.api_url, endpoint.lstrip("/"))

        # Add API key to query parameters
        if params is None:
            params = {}

        if "timeout" not in kwargs:
            kwargs["timeout"] = 30  # Default timeout

        # Get headers
        headers = self._build_headers()

        # Update Accept header if provided
        headers["Accept"] = accept_content_type

        try:
            response = requests.request(
                method, url, params=params, json=data, stream=stream, headers=headers, **kwargs
            )
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
            raise

    def get_monthly_extract_info(self) -> SamExtractInfo | None:
        """Get information about the latest monthly extract.

        Returns:
            Information about the latest monthly extract, or None if no extract is available.
        """
        try:
            response = self._request("GET", "data-services/v1/extracts/monthly")
            data = response.json()
            if not data:
                return None

            return SamExtractInfo(
                url=data["url"],
                filename=data["filename"],
                updated_at=datetime.fromisoformat(data["updated_at"]),
            )
        except Exception as e:
            logger.error(f"Failed to get monthly extract info: {str(e)}")
            return None

    def get_daily_extract_info(self) -> list[SamExtractInfo]:
        """Get information about available daily extracts.

        Returns:
            List of information about available daily extracts.
        """
        try:
            response = self._request("GET", "data-services/v1/extracts/daily")
            data = response.json()
            if not data:
                return []

            return [
                SamExtractInfo(
                    url=item["url"],
                    filename=item["filename"],
                    updated_at=datetime.fromisoformat(item["updated_at"]),
                )
                for item in data
            ]
        except Exception as e:
            logger.error(f"Failed to get daily extract info: {str(e)}")
            return []
