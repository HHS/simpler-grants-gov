"""Tests for the mock SAM.gov API client."""

import json
import os
import tempfile

from src.adapters.sam_gov.mock_client import MockSamGovClient
from src.adapters.sam_gov.models import SamExtractRequest


class TestMockSamGovClient:
    """Tests for the SAM.gov mock client."""

    def test_load_mock_data_from_file(self):
        """Test loading mock data from a file."""
        # Create a temporary file with mock extract data
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as temp_file:
            mock_data = {
                "extracts": {
                    "TEST_EXTRACT_FILE.ZIP": {
                        "size": 1024 * 1024,  # 1MB
                        "content_type": "application/zip",
                        "sensitivity": "PUBLIC",
                    }
                }
            }
            json.dump(mock_data, temp_file)
            temp_file_path = temp_file.name

        # Create a temporary output file
        with tempfile.NamedTemporaryFile(delete=False) as output_file:
            output_path = output_file.name

        try:
            # Initialize client with the temp file
            client = MockSamGovClient(mock_data_file=temp_file_path)

            # Create a request for the mock extract
            request = SamExtractRequest(file_name="TEST_EXTRACT_FILE.ZIP")

            # Download the extract
            response = client.download_extract(request, output_path)

            # Verify the extract metadata
            assert response is not None
            assert response.file_name == output_path
            assert response.file_size == 1024 * 1024
            # These fields were removed from the model
            # assert response.content_type == "application/zip"
            # assert response.sensitivity == SensitivityLevel.PUBLIC

            # Verify the file was created
            assert os.path.exists(output_path)
            assert os.path.getsize(output_path) > 0
        finally:
            # Clean up the temporary files
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            if os.path.exists(output_path):
                os.unlink(output_path)
