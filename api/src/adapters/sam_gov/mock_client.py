"""Mock client for SAM.gov API for local development and testing."""

import json
import logging
import os
import shutil
from datetime import datetime, timezone

from src.adapters.sam_gov.client import BaseSamGovClient
from src.adapters.sam_gov.models import (
    EntityStatus,
    EntityType,
    SamEntityRequest,
    SamEntityResponse,
    SamExtractRequest,
    SamExtractResponse,
    SensitivityLevel,
)

logger = logging.getLogger(__name__)

# Example entities to use as mock data
MOCK_ENTITIES: dict[str, SamEntityResponse] = {
    "ABCDEFGHIJK1": SamEntityResponse(
        uei="ABCDEFGHIJK1",
        legal_business_name="ACME Corporation",
        physical_address={
            "address_line_1": "123 Main St",
            "city": "Anytown",
            "state_or_province": "MD",
            "zip_code": "20002",
            "country": "UNITED STATES",
        },
        mailing_address={
            "address_line_1": "PO Box 123",
            "city": "Anytown",
            "state_or_province": "MD",
            "zip_code": "20002",
            "country": "UNITED STATES",
        },
        congressional_district="MD-01",
        entity_status=EntityStatus.ACTIVE,
        entity_type=EntityType.BUSINESS,
        expiration_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        created_date=datetime(2020, 1, 1, tzinfo=timezone.utc),
        last_updated_date=datetime(2023, 1, 1, tzinfo=timezone.utc),
    ),
    "LMNOPQRSTUV2": SamEntityResponse(
        uei="LMNOPQRSTUV2",
        legal_business_name="State University",
        physical_address={
            "address_line_1": "456 College Ave",
            "city": "College Town",
            "state_or_province": "CA",
            "zip_code": "90001",
            "country": "UNITED STATES",
        },
        mailing_address=None,
        congressional_district="CA-12",
        entity_status=EntityStatus.ACTIVE,
        entity_type=EntityType.GOVERNMENT,
        expiration_date=datetime(2025, 6, 30, tzinfo=timezone.utc),
        created_date=datetime(2019, 5, 15, tzinfo=timezone.utc),
        last_updated_date=datetime(2023, 3, 10, tzinfo=timezone.utc),
    ),
    "WXYZABCDEFG3": SamEntityResponse(
        uei="WXYZABCDEFG3",
        legal_business_name="John Smith Consulting",
        physical_address={
            "address_line_1": "789 Oak St",
            "city": "Smallville",
            "state_or_province": "TX",
            "zip_code": "75001",
            "country": "UNITED STATES",
        },
        mailing_address={
            "address_line_1": "789 Oak St",
            "city": "Smallville",
            "state_or_province": "TX",
            "zip_code": "75001",
            "country": "UNITED STATES",
        },
        congressional_district="TX-05",
        entity_status=EntityStatus.INACTIVE,
        entity_type=EntityType.INDIVIDUAL,
        expiration_date=None,
        created_date=datetime(2021, 8, 22, tzinfo=timezone.utc),
        last_updated_date=datetime(2022, 12, 5, tzinfo=timezone.utc),
    ),
}

# Example SAM.gov extract files
MOCK_EXTRACTS = {
    "SAM_PUBLIC_MONTHLY_V2_20220406.ZIP": {
        "size": 1024 * 1024 * 5,  # 5MB
        "content_type": "application/zip",
        "sensitivity": SensitivityLevel.PUBLIC,
    },
    "SAM_FOUO_MONTHLY_V2_20220406.ZIP": {
        "size": 1024 * 1024 * 10,  # 10MB
        "content_type": "application/zip",
        "sensitivity": SensitivityLevel.FOUO,
    },
    "SAM_SENSITIVE_MONTHLY_V3_20220406.ZIP": {
        "size": 1024 * 1024 * 15,  # 15MB
        "content_type": "application/zip",
        "sensitivity": SensitivityLevel.SENSITIVE,
    },
    "SAM_Exclusions_Public_Extract_V2_22096.ZIP": {
        "size": 1024 * 1024 * 2,  # 2MB
        "content_type": "application/zip",
        "sensitivity": SensitivityLevel.PUBLIC,
    },
    "FASCSAOrders23277.CSV": {
        "size": 1024 * 512,  # 512KB
        "content_type": "text/csv",
        "sensitivity": SensitivityLevel.PUBLIC,
    },
}


class MockSamGovClient(BaseSamGovClient):
    """Mock client for SAM.gov API for local development and testing."""

    def __init__(self, mock_data_file: str | None = None, mock_extract_dir: str | None = None):
        """Initialize the mock client.

        Args:
            mock_data_file: Optional path to a JSON file containing mock entity data.
                           If provided, will load mock entity data from this file.
            mock_extract_dir: Optional path to a directory containing mock extract files.
                           If provided, will use these files for extract downloads.
        """
        self.entities = MOCK_ENTITIES.copy()
        self.extracts = MOCK_EXTRACTS.copy()
        self.mock_extract_dir = mock_extract_dir

        # Load additional mock data from file if provided
        if mock_data_file and os.path.exists(mock_data_file):
            try:
                with open(mock_data_file, "r") as f:
                    additional_data = json.load(f)

                for uei, entity_data in additional_data.items():
                    # Convert dates from strings to datetime objects
                    if "created_date" in entity_data:
                        entity_data["created_date"] = datetime.fromisoformat(
                            entity_data["created_date"]
                        )
                    if "last_updated_date" in entity_data:
                        entity_data["last_updated_date"] = datetime.fromisoformat(
                            entity_data["last_updated_date"]
                        )
                    if "expiration_date" in entity_data and entity_data["expiration_date"]:
                        entity_data["expiration_date"] = datetime.fromisoformat(
                            entity_data["expiration_date"]
                        )

                    self.entities[uei] = SamEntityResponse.model_validate(entity_data)
            except Exception as e:
                logger.error(f"Error loading mock data from {mock_data_file}: {e}")

    def get_entity(self, request: SamEntityRequest) -> SamEntityResponse | None:
        """Get entity information by UEI.

        Args:
            request: Request containing the UEI to retrieve.

        Returns:
            Entity information if found, None otherwise.
        """
        return self.entities.get(request.uei)

    def download_extract(self, request: SamExtractRequest, output_path: str) -> SamExtractResponse:
        """Download a mock extract file.

        Args:
            request: The request containing parameters for the extract download.
            output_path: The path where the extract file should be saved.

        Returns:
            Metadata about the downloaded file.

        Raises:
            ValueError: If the request parameters are invalid or the extract is not found.
            IOError: If there is an error saving the file.
        """
        # Validate request parameters
        if not request.file_name and not request.file_type:
            raise ValueError("Either file_name or file_type must be provided")

        # If file_name is provided, check if it exists in our mock data
        file_name = request.file_name

        if file_name and file_name not in self.extracts:
            # Check if the requested file exists in the mock_extract_dir
            if self.mock_extract_dir and os.path.exists(
                os.path.join(self.mock_extract_dir, file_name)
            ):
                # Add it to our extracts dictionary
                self.extracts[file_name] = {
                    "size": os.path.getsize(os.path.join(self.mock_extract_dir, file_name)),
                    "content_type": "application/zip" if file_name.endswith(".ZIP") else "text/csv",
                    "sensitivity": (
                        SensitivityLevel.SENSITIVE
                        if "SENSITIVE" in file_name
                        else (
                            SensitivityLevel.FOUO
                            if "FOUO" in file_name
                            else SensitivityLevel.PUBLIC
                        )
                    ),
                }
            else:
                raise ValueError(f"Mock extract file not found: {file_name}")

        # If file_name is not provided, generate one based on the request parameters
        if not file_name:
            # Create a file name based on the request parameters
            date_str = datetime.now().strftime("%Y%m%d")
            sensitivity = request.sensitivity.value if request.sensitivity else "PUBLIC"
            format_str = "UTF-8_" if request.format and request.format.value == "UTF8" else ""
            extract_type = request.extract_type.value if request.extract_type else "MONTHLY"

            file_name = f"SAM_{sensitivity}_{format_str}{extract_type}_V2_{date_str}.ZIP"

            # Add to extracts dictionary if not already there
            if file_name not in self.extracts:
                self.extracts[file_name] = {
                    "size": 1024 * 1024 * 5,  # 5MB default size
                    "content_type": "application/zip",
                    "sensitivity": request.sensitivity or SensitivityLevel.PUBLIC,
                }

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        # If we have the file in mock_extract_dir, copy it
        if self.mock_extract_dir and os.path.exists(os.path.join(self.mock_extract_dir, file_name)):
            shutil.copyfile(os.path.join(self.mock_extract_dir, file_name), output_path)
        else:
            # Create a mock file with random content
            with open(output_path, "wb") as f:
                # Write random bytes to simulate file content
                extract_size = self.extracts[file_name]["size"]
                size_value = extract_size if isinstance(extract_size, int) else 1024 * 1024
                mock_file_size = min(size_value, 1024 * 1024)  # Max 1MB for mock files
                f.write(os.urandom(mock_file_size))

        return SamExtractResponse(
            file_name=file_name,
            file_size=self.extracts[file_name]["size"],
            content_type=self.extracts[file_name]["content_type"],
            sensitivity=self.extracts[file_name]["sensitivity"],
            download_date=datetime.now(),
        )

    def add_mock_entity(self, entity: SamEntityResponse) -> None:
        """Add a mock entity to the client.

        Args:
            entity: Entity to add.
        """
        self.entities[entity.uei] = entity

    def update_mock_entity(self, entity: SamEntityResponse) -> None:
        """Update a mock entity in the client.

        Args:
            entity: Entity to update.
        """
        self.entities[entity.uei] = entity

    def delete_mock_entity(self, uei: str) -> None:
        """Delete a mock entity from the client.

        Args:
            uei: UEI of the entity to delete.
        """
        if uei in self.entities:
            del self.entities[uei]

    def add_mock_extract(
        self,
        file_name: str,
        size: int = 1024 * 1024,
        content_type: str = "application/zip",
        sensitivity: SensitivityLevel = SensitivityLevel.PUBLIC,
        file_path: str | None = None,
    ) -> None:
        """Add a mock extract file to the client.

        Args:
            file_name: The name of the extract file.
            size: The size of the extract file in bytes.
            content_type: The content type of the extract file.
            sensitivity: The sensitivity level of the extract.
            file_path: Optional path to an actual file to use for the extract.
                     If provided, the size will be updated to match the actual file size.
        """
        if file_path and os.path.exists(file_path):
            size = os.path.getsize(file_path)
            if not self.mock_extract_dir:
                self.mock_extract_dir = os.path.dirname(file_path)

        self.extracts[file_name] = {
            "size": size,
            "content_type": content_type,
            "sensitivity": sensitivity,
        }
