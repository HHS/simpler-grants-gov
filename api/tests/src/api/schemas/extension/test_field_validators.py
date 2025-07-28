from io import BytesIO

import pytest
from marshmallow import ValidationError
from werkzeug.datastructures import FileStorage

from src.api.schemas.extension.field_validators import FileSize


class TestFileSizeValidator:
    def test_file_size_validator_accepts_small_file(self):
        """Test that the validator accepts files smaller than the limit"""
        validator = FileSize(max_size_bytes=1024)  # 1 KB limit

        # Create a file storage object with small content
        file_storage = FileStorage(
            stream=BytesIO(b"small content"), filename="small.txt", content_type="text/plain"
        )

        # This should not raise an exception
        result = validator(file_storage)
        assert result == file_storage

    def test_file_size_validator_rejects_large_file(self):
        """Test that the validator rejects files larger than the limit"""
        validator = FileSize(max_size_bytes=1024)  # 1 KB limit

        # Create a file storage object with large content
        _ = FileStorage(
            stream=BytesIO(b"x" * 2048),  # 2 KB content
            filename="large.txt",
            content_type="text/plain",
        )

        # Since we can't easily mock content_length, let's test the validator's logic
        # by creating a custom FileStorage-like object
        class MockFileStorage:
            def __init__(self, content_length):
                self.content_length = content_length
                self.filename = "test.txt"
                self.content_type = "text/plain"

        # Test with a large file
        mock_file = MockFileStorage(2048)  # 2 KB
        with pytest.raises(ValidationError) as exc_info:
            validator(mock_file)

        assert "File size must be less than" in str(exc_info.value)

    def test_file_size_validator_with_no_content_length(self):
        """Test that the validator accepts files when content_length is not set"""
        validator = FileSize(max_size_bytes=1024)  # 1 KB limit

        # Create a file storage object without content_length
        file_storage = FileStorage(
            stream=BytesIO(b"content"), filename="test.txt", content_type="text/plain"
        )

        # This should not raise an exception when content_length is None
        result = validator(file_storage)
        assert result == file_storage

    def test_file_size_validator_with_2gb_limit(self):
        """Test that the validator works with 2 GB limit"""
        max_size = 2 * 1024 * 1024 * 1024  # 2 GB
        validator = FileSize(max_size_bytes=max_size)

        # Create a mock file storage class for testing
        class MockFileStorage:
            def __init__(self, content_length):
                self.content_length = content_length
                self.filename = "test.txt"
                self.content_type = "text/plain"

        # Test with a file just under the limit
        mock_file = MockFileStorage(max_size - 1)
        result = validator(mock_file)
        assert result == mock_file

        # Test with a file at the limit
        mock_file = MockFileStorage(max_size)
        result = validator(mock_file)
        assert result == mock_file

        # Test with a file over the limit
        mock_file = MockFileStorage(max_size + 1)
        with pytest.raises(ValidationError) as exc_info:
            validator(mock_file)
        assert "File size must be less than" in str(exc_info.value)

    def test_file_size_validator_error_message_formatting(self):
        """Test that the error message is properly formatted"""
        max_size = 1024 * 1024  # 1 MB
        validator = FileSize(max_size_bytes=max_size)

        class MockFileStorage:
            def __init__(self, content_length):
                self.content_length = content_length
                self.filename = "test.txt"
                self.content_type = "text/plain"

        # Test with a file over the limit
        mock_file = MockFileStorage(max_size + 1)
        with pytest.raises(ValidationError) as exc_info:
            validator(mock_file)

        error_message = str(exc_info.value)
        assert "File size must be less than" in error_message
        assert "1.0 MB" in error_message  # Should show the size in MB
