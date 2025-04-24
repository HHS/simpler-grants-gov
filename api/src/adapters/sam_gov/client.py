"""SAM.gov API client implementation."""

import abc
import base64
import logging
import os
import re
from datetime import datetime
from typing import Any

import requests

from src.adapters.sam_gov.config import SamGovConfig
from src.adapters.sam_gov.models import (
    SamEntityRequest,
    SamEntityResponse,
    SamExtractRequest,
    SamExtractResponse,
    SensitivityLevel,
)

logger = logging.getLogger(__name__)


class BaseSamGovClient(abc.ABC, metaclass=abc.ABCMeta):
    """Base class for SAM.gov API clients."""

    @abc.abstractmethod
    def get_entity(self, request: SamEntityRequest) -> SamEntityResponse | None:
        """Get entity information from SAM.gov by UEI."""
        pass

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


class SamGovClient(BaseSamGovClient):
    """Client for interacting with the SAM.gov API."""

    def __init__(
        self,
        api_key: str | SamGovConfig | None = None,
        username: str | None = None,
        password: str | None = None,
        api_url: str | None = None,
        extract_url: str | None = None,
    ):
        """Initialize the client.

        Args:
            api_key: API key for SAM.gov API or a SamGovConfig object.
            username: Username for Basic Authentication (required for sensitive data).
            password: Password for Basic Authentication (required for sensitive data).
            api_url: URL for the SAM.gov API. If not provided, the value from environment variable will be used.
            extract_url: URL for the SAM.gov extract API. If not provided, the value from environment variable will be used.
        """
        # Extract config if provided
        config_api_key = None
        config_api_url = None
        config_extract_url = None
        if isinstance(api_key, SamGovConfig):
            config = api_key
            config_api_key = config.api_key
            config_api_url = config.base_url
            config_extract_url = config.extract_url
            api_key = None  # Clear api_key since we've extracted it from config

        # Set instance variables from parameters or environment
        self.api_key = config_api_key or api_key or os.environ.get("SAM_GOV_API_KEY")
        self.username = username or os.environ.get("SAM_GOV_USERNAME")
        self.password = password or os.environ.get("SAM_GOV_PASSWORD")
        self.api_url = config_api_url or api_url or os.environ.get("SAM_GOV_API_URL")
        self.extract_url = config_extract_url or extract_url or os.environ.get("SAM_GOV_EXTRACT_URL")

        if not self.api_url:
            raise ValueError(
                "API URL must be provided either directly, via config, or via environment variable."
            )

        if not self.extract_url:
            raise ValueError(
                "Extract URL must be provided either directly, via config, or via environment variable."
            )

        if not self.api_key:
            raise ValueError(
                "API key must be provided either directly or via environment variable."
            )

    def _build_headers(self, include_auth: bool = True) -> dict[str, str]:
        """Build headers for API requests.

        Args:
            include_auth: Whether to include authentication headers.

        Returns:
            Dictionary of headers.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if include_auth:
            # Add the API key authorization
            if self.api_key:
                headers["x-api-key"] = self.api_key

            # Add Basic Auth if username and password are provided (needed for sensitive data)
            if self.username and self.password:
                auth_string = f"{self.username}:{self.password}"
                encoded_auth = base64.b64encode(auth_string.encode()).decode()
                headers["Authorization"] = f"Basic {encoded_auth}"

        return headers

    def get_entity(self, request: SamEntityRequest) -> SamEntityResponse | None:
        """Get entity information from SAM.gov by UEI.

        Args:
            request: Request containing the UEI to retrieve.

        Returns:
            Entity information if found, None otherwise.
        """
        try:
            response = self._request("GET", f"/entity/{request.uei}")
            data = response.json()
            return SamEntityResponse.model_validate(data)
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.info(f"Entity with UEI {request.uei} not found in SAM.gov")
                return None
            raise
        except Exception as e:
            logger.exception(f"Error retrieving entity with UEI {request.uei} from SAM.gov: {e}")
            raise

    def download_extract(
        self, extract_request: SamExtractRequest, output_path: str
    ) -> SamExtractResponse:
        """Download SAM.gov data extract.

        Args:
            extract_request: Extract request parameters.
            output_path: Path to save the downloaded file.

        Returns:
            Response object with download information.

        Raises:
            ValueError: If the extract_request is not valid.
            IOError: If there is an issue saving the file.
            Exception: For any other errors.
        """
        # No validation call needed, Pydantic handles validation on creation

        # Check if we need Basic Auth for sensitive data
        sensitivity = extract_request.sensitivity or SensitivityLevel.PUBLIC
        needs_basic_auth = sensitivity in [SensitivityLevel.FOUO, SensitivityLevel.SENSITIVE]

        if needs_basic_auth and not (self.username and self.password):
            raise ValueError(
                f"Username and password are required for {sensitivity.value} sensitivity level data."
            )

        params = {}

        # Get extract by file name
        if extract_request.file_name:
            url = f"{self.extract_url}/download"
            params["fileName"] = extract_request.file_name
        else:
            # Get extract by parameters
            url = f"{self.extract_url}/v1"

            # Only include parameters for fields that exist
            params = {}

            if extract_request.file_type:
                params["fileType"] = extract_request.file_type.value

            if extract_request.sensitivity:
                params["sensitivity"] = extract_request.sensitivity.value

            if extract_request.extract_type:
                params["extractType"] = extract_request.extract_type.value

            if extract_request.format:
                params["format"] = extract_request.format.value

            if extract_request.create_date:
                params["createDate"] = extract_request.create_date

            if extract_request.include_expired is not None:
                params["includeExpired"] = str(extract_request.include_expired).lower()

        try:
            headers = self._build_headers()

            logging.info(f"Downloading SAM.gov extract from {url}")
            logging.debug(f"Request parameters: {params}")

            response = requests.get(url, params=params, headers=headers, stream=True)

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
            content_disposition = response.headers.get("Content-Disposition", "")
            content_length = int(response.headers.get("Content-Length", 0))

            # Try to extract the filename from Content-Disposition
            filename = None
            disposition_match = re.search(r'filename="?([^";]+)"?', content_disposition)
            if disposition_match:
                filename = disposition_match.group(1)

            # Save the file
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Build response object
            extract_response = SamExtractResponse(
                file_name=filename or os.path.basename(output_path),
                file_size=content_length or os.path.getsize(output_path),
                content_type=content_type,
                sensitivity=extract_request.sensitivity,
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
        use_basic_auth: bool = False,
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
            use_basic_auth: Whether to use Basic Authentication.
            **kwargs: Additional arguments to pass to requests.

        Returns:
            The HTTP response.

        Raises:
            requests.exceptions.RequestException: For various request errors.
        """
        url = f"{self.api_url}{endpoint}"

        if "timeout" not in kwargs:
            kwargs["timeout"] = 30  # Default timeout

        # Get headers with authorization
        headers = self._build_headers(include_auth=use_basic_auth)

        # Update Accept header if provided
        headers["Accept"] = accept_content_type

        try:
            response = requests.request(
                method, url, params=params, json=data, stream=stream, headers=headers, **kwargs
            )

            # Raise an exception for HTTP errors
            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            logger.error(f"Error when calling SAM.gov API: {e}")
            raise
