"""Mock client for SAM.gov API for local development and testing."""

import json
import logging
import os
from datetime import datetime, timedelta

from src.adapters.sam_gov.client import BaseSamGovClient, SamExtractInfo
from src.adapters.sam_gov.models import SamExtractRequest, SamExtractResponse
from src.util import datetime_util
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

    def __init__(
        self, mock_data_file: str | None = None, mock_extract_dir: str | None = None
    ) -> None:
        """Initialize the mock client.

        Args:
            mock_data_file: Optional path to a JSON file containing mock data.
            mock_extract_dir: Optional path to a directory containing mock extract files.
        """
        self.extracts = MOCK_EXTRACTS.copy()
        self.mock_data_file = mock_data_file
        self.mock_extract_dir = mock_extract_dir

        # Load mock data from file if provided
        if mock_data_file and os.path.exists(mock_data_file):
            try:
                with open(mock_data_file, "r") as f:
                    mock_data = json.load(f)
                    if "extracts" in mock_data:
                        self.extracts.update(mock_data["extracts"])
            except Exception as e:
                logger.error(f"Failed to load mock data from {mock_data_file}: {str(e)}")

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
            file_name=file_name,
            file_size=self.extracts[file_name]["size"],
            content_type=self.extracts[file_name]["content_type"],
            download_date=datetime.now(),
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
            size: Size in bytes of the extract file. If file_path is provided, this might be overwritten.
            content_type: Content type of the extract file.
            file_path: Optional path to an actual file to use as the extract.
                      If provided, the size will be derived from the file.
        """
        actual_size = size
        if file_path and os.path.exists(file_path):
            actual_size = os.path.getsize(file_path)
            # Note: The file content itself is not stored or copied anymore,
            # only its metadata (name, size, content_type) is used.
            # The download_extract method will generate random content
            # based on this metadata if the file isn't in MOCK_EXTRACTS.

        self.extracts[file_name] = {
            "size": actual_size,
            "content_type": content_type,
        }

    def get_monthly_extract_info(self) -> SamExtractInfo | None:
        """
        Get mock information about the latest monthly extract

        Returns a fixed mock response
        """
        logger.info("Using mock SAM.gov client to get monthly extract info")

        # Return mock data for the first day of the current month
        current_date = datetime_util.utcnow()
        first_day_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return SamExtractInfo(
            url="https://example.com/sam/monthly/extract.zip",
            filename=f"sam_monthly_extract_{first_day_of_month.strftime('%Y%m')}.zip",
            updated_at=first_day_of_month,
        )

    def get_daily_extract_info(self) -> list[SamExtractInfo]:
        """
        Get mock information about available daily extracts

        Returns fixed mock responses for the last 5 days
        """
        logger.info("Using mock SAM.gov client to get daily extract info")

        # Generate mock data for the last 5 days
        current_date = datetime_util.utcnow()
        daily_extracts = []

        for day_offset in range(5):
            date = current_date - timedelta(days=day_offset)
            date = date.replace(hour=0, minute=0, second=0, microsecond=0)

            daily_extracts.append(
                SamExtractInfo(
                    url=f"https://example.com/sam/daily/extract_{date.strftime('%Y%m%d')}.zip",
                    filename=f"sam_daily_extract_{date.strftime('%Y%m%d')}.zip",
                    updated_at=date,
                )
            )

        return daily_extracts
