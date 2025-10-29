"""Mock client for SAM.gov API for local development and testing."""

import json
import logging
import os
import shutil

from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.models import SamExtractRequest, SamExtractResponse
from src.util.file_util import copy_file, open_stream

logger = logging.getLogger(__name__)

# Example SAM.gov extract files
MOCK_EXTRACTS = {
    "SAM_PUBLIC_MONTHLY_V2_20220406.ZIP": {
        "size": 1024 * 1024 * 5,  # 5MB
        "content_type": "application/zip",
    },
    "SAM_FOUO_MONTHLY_V2_20220406.ZIP": {
        "size": 1024 * 1024 * 10,  # 10MB
        "content_type": "application/zip",
    },
    "SAM_SENSITIVE_MONTHLY_V3_20220406.ZIP": {
        "size": 1024 * 1024 * 15,  # 15MB
        "content_type": "application/zip",
    },
    "SAM_Exclusions_Public_Extract_V2_22096.ZIP": {
        "size": 1024 * 1024 * 2,  # 2MB
        "content_type": "application/zip",
    },
    "FASCSAOrders23277.CSV": {
        "size": 1024 * 512,  # 512KB
        "content_type": "text/csv",
    },
}


class MockSamGovClient(BaseSamGovClient):
    """Mock client for SAM.gov API for local development and testing."""

    def __init__(self, mock_data_file: str | None = None, mock_extract_dir: str | None = None):
        """Initialize the mock client.

        Args:
            mock_data_file: Optional path to a JSON file containing mock extract metadata.
                           If provided, will load mock extracts data from this file.
            mock_extract_dir: Optional path to a directory containing mock extract files.
                           If provided, will use these files for extract downloads.
        """
        self.extracts = MOCK_EXTRACTS.copy()
        self.mock_extract_dir = mock_extract_dir

        # Load additional mock data from file if provided
        if mock_data_file and os.path.exists(mock_data_file):
            try:
                with open(mock_data_file) as f:
                    additional_data = json.load(f)

                # Add custom extract definitions if available
                if "extracts" in additional_data and isinstance(additional_data["extracts"], dict):
                    self.extracts.update(additional_data["extracts"])
            except Exception as e:
                logger.error(f"Error loading mock data from {mock_data_file}: {e}")

    def download_extract(self, request: SamExtractRequest, output_path: str) -> SamExtractResponse:
        """Download a mock extract file.

        Args:
            request: The request containing the file name to download.
            output_path: The path where the extract file should be saved.
                         Should be an S3 URI (s3://).

        Returns:
            Metadata about the downloaded file.

        Raises:
            ValueError: If the extract is not found.
            IOError: If there is an error saving the file.
        """
        file_name = request.file_name

        # Check if the requested file exists in our mock data
        if file_name not in self.extracts:
            # Check if the requested file exists in the mock_extract_dir
            if self.mock_extract_dir and os.path.exists(
                os.path.join(self.mock_extract_dir, file_name)
            ):
                # Add it to our extracts dictionary
                self.extracts[file_name] = {
                    "size": os.path.getsize(os.path.join(self.mock_extract_dir, file_name)),
                    "content_type": "application/zip" if file_name.endswith(".ZIP") else "text/csv",
                }
            else:
                raise ValueError(f"Mock extract file not found: {file_name}")

        # If we have the file in mock_extract_dir, copy it to the output path
        if self.mock_extract_dir and os.path.exists(os.path.join(self.mock_extract_dir, file_name)):
            source_file_path = os.path.join(self.mock_extract_dir, file_name)

            # Always use copy_file, assuming it can handle S3 paths for destination
            copy_file(source_file_path, output_path)
        else:
            # Create a mock file with random content
            with open_stream(output_path, "wb") as f:
                # Write random bytes to simulate file content
                extract_size = self.extracts[file_name]["size"]
                size_value = extract_size if isinstance(extract_size, int) else 1024 * 1024
                mock_file_size = min(size_value, 1024 * 1024)  # Max 1MB for mock files
                f.write(os.urandom(mock_file_size))

        return SamExtractResponse(
            file_name=output_path,
        )

    def add_mock_extract(
        self,
        file_name: str,
        size: int = 1024 * 1024,
        content_type: str = "application/zip",
        file_path: str | None = None,
    ) -> None:
        """Add a mock extract file to the available extracts.

        Args:
            file_name: Name of the extract file.
            size: Size in bytes of the extract file.
            content_type: Content type of the extract file.
            file_path: Optional path to an actual file to use as the extract.
                      If provided, the size parameter will be ignored.
        """
        self.extracts[file_name] = {
            "size": size,
            "content_type": content_type,
        }

        # If a file path is provided, copy it to the mock_extract_dir if available
        if file_path and self.mock_extract_dir:
            os.makedirs(self.mock_extract_dir, exist_ok=True)
            shutil.copyfile(file_path, os.path.join(self.mock_extract_dir, file_name))
