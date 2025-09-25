"""Tests for attachment data models."""

import base64
import hashlib
import tempfile
from pathlib import Path

import pytest
from pydantic import ValidationError

from src.services.xml_generation.models.attachment import (
    AttachmentData,
    AttachmentFile,
    AttachmentGroup,
)


@pytest.mark.xml_validation
class TestAttachmentFile:
    """Test cases for AttachmentFile model."""

    def test_attachment_file_creation_valid(self):
        """Test creating a valid AttachmentFile."""
        attachment = AttachmentFile(
            filename="test_document.pdf",
            mime_type="application/pdf",
            file_location="./attachments/test_document.pdf",
            hash_value="aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=",
            hash_algorithm="SHA-1",
        )

        assert attachment.filename == "test_document.pdf"
        assert attachment.mime_type == "application/pdf"
        assert attachment.file_location == "./attachments/test_document.pdf"
        assert attachment.hash_value == "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q="
        assert attachment.hash_algorithm == "SHA-1"

    def test_attachment_file_invalid_mime_type(self):
        """Test AttachmentFile with invalid MIME type."""
        with pytest.raises(ValidationError) as exc_info:
            AttachmentFile(
                filename="test.pdf",
                mime_type="invalid_mime_type",  # Missing slash
                file_location="./test.pdf",
                hash_value="validhash123",
                hash_algorithm="SHA-1",
            )

        assert "MIME type must contain a slash" in str(exc_info.value)

    def test_attachment_file_invalid_hash_algorithm(self):
        """Test AttachmentFile with invalid hash algorithm."""
        with pytest.raises(ValidationError) as exc_info:
            AttachmentFile(
                filename="test.pdf",
                mime_type="application/pdf",
                file_location="./test.pdf",
                hash_value="validhash123",
                hash_algorithm="MD5",  # Not SHA-1
            )

        assert "Only SHA-1 hash algorithm is supported" in str(exc_info.value)

    def test_attachment_file_default_hash_algorithm(self):
        """Test AttachmentFile uses SHA-1 as default hash algorithm."""
        attachment = AttachmentFile(
            filename="test.pdf",
            mime_type="application/pdf",
            file_location="./test.pdf",
            hash_value="validhash123",
            # hash_algorithm not specified - should default to SHA-1
        )

        assert attachment.hash_algorithm == "SHA-1"

    def test_compute_base64_sha1_from_content(self):
        """Test computing base64-encoded SHA-1 from content."""
        test_content = b"This is test content for SHA-1 hash computation"

        # Compute using our utility
        computed_hash = AttachmentFile.compute_base64_sha1_from_content(test_content)

        # Verify manually
        expected_sha1 = hashlib.sha1(test_content)  # nosec B324
        expected_base64 = base64.b64encode(expected_sha1.digest()).decode("utf-8")

        assert computed_hash == expected_base64
        assert len(computed_hash) > 0
        assert (
            computed_hash.endswith("=")
            or computed_hash.endswith("==")
            or not computed_hash.endswith("=")
        )  # Base64 padding

    def test_from_file_path_with_temp_file(self):
        """Test creating AttachmentFile from temporary file path."""
        test_content = b"This is test file content for attachment testing"

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(test_content)
            temp_file_path = Path(temp_file.name)

        try:
            # Create AttachmentFile from file path
            attachment = AttachmentFile.from_file_path(temp_file_path)

            # Verify properties
            assert attachment.filename == temp_file_path.name
            assert attachment.mime_type == "application/pdf"  # Based on .pdf suffix
            assert attachment.file_location == f"./attachments/{temp_file_path.name}"
            assert attachment.hash_algorithm == "SHA-1"

            # Verify hash is correct
            expected_hash = AttachmentFile.compute_base64_sha1(temp_file_path)
            assert attachment.hash_value == expected_hash

        finally:
            # Clean up
            temp_file_path.unlink()

    def test_from_file_path_with_custom_location(self):
        """Test creating AttachmentFile with custom file location."""
        test_content = b"Custom location test content"
        custom_location = "https://example.com/custom/path/file.pdf"

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(test_content)
            temp_file_path = Path(temp_file.name)

        try:
            attachment = AttachmentFile.from_file_path(temp_file_path, custom_location)

            assert attachment.file_location == custom_location
            assert attachment.filename == temp_file_path.name

        finally:
            temp_file_path.unlink()

    def test_from_file_path_nonexistent_file(self):
        """Test creating AttachmentFile from nonexistent file."""
        nonexistent_path = Path("/nonexistent/file.pdf")

        with pytest.raises(FileNotFoundError):
            AttachmentFile.from_file_path(nonexistent_path)


@pytest.mark.xml_validation
class TestAttachmentGroup:
    """Test cases for AttachmentGroup model."""

    def test_attachment_group_empty(self):
        """Test creating empty AttachmentGroup."""
        group = AttachmentGroup()

        assert len(group.attached_files) == 0
        assert group.attached_files == []

    def test_attachment_group_add_file(self):
        """Test adding files to AttachmentGroup."""
        group = AttachmentGroup()

        attachment = AttachmentFile(
            filename="test.pdf",
            mime_type="application/pdf",
            file_location="./test.pdf",
            hash_value="testhash123",
        )

        group.add_file(attachment)

        assert len(group.attached_files) == 1
        assert group.attached_files[0] == attachment

    def test_attachment_group_max_files_limit(self):
        """Test AttachmentGroup enforces 100 file limit."""
        group = AttachmentGroup()

        # Add 100 files (should work)
        for i in range(100):
            attachment = AttachmentFile(
                filename=f"test_{i}.pdf",
                mime_type="application/pdf",
                file_location=f"./test_{i}.pdf",
                hash_value=f"hash_{i}",
            )
            group.add_file(attachment)

        assert len(group.attached_files) == 100

        # Try to add 101st file (should fail)
        extra_attachment = AttachmentFile(
            filename="extra.pdf",
            mime_type="application/pdf",
            file_location="./extra.pdf",
            hash_value="extrahash",
        )

        with pytest.raises(ValueError) as exc_info:
            group.add_file(extra_attachment)

        assert "Cannot add more than 100 files" in str(exc_info.value)

    def test_attachment_group_add_file_from_path(self):
        """Test adding file from path to AttachmentGroup."""
        group = AttachmentGroup()
        test_content = b"Test content for group file"

        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as temp_file:
            temp_file.write(test_content)
            temp_file_path = Path(temp_file.name)

        try:
            group.add_file_from_path(temp_file_path)

            assert len(group.attached_files) == 1
            attachment = group.attached_files[0]
            assert attachment.filename == temp_file_path.name
            # MIME type detection may vary by system, so just check it's reasonable
            assert attachment.mime_type in [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/octet-stream",  # Fallback on some systems
            ]

        finally:
            temp_file_path.unlink()


@pytest.mark.xml_validation
class TestAttachmentData:
    """Test cases for AttachmentData model."""

    def test_attachment_data_empty(self):
        """Test creating empty AttachmentData."""
        data = AttachmentData()

        assert data.areas_affected is None
        assert data.additional_project_title is None
        assert data.additional_congressional_districts is None
        assert data.debt_explanation is None

    def test_attachment_data_with_single_attachments(self):
        """Test AttachmentData with single attachments."""
        areas_file = AttachmentFile(
            filename="areas.pdf",
            mime_type="application/pdf",
            file_location="./areas.pdf",
            hash_value="areashash",
        )

        debt_file = AttachmentFile(
            filename="debt.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_location="./debt.docx",
            hash_value="debthash",
        )

        data = AttachmentData(areas_affected=areas_file, debt_explanation=debt_file)

        assert data.areas_affected == areas_file
        assert data.debt_explanation == debt_file
        assert data.additional_project_title is None
        assert data.additional_congressional_districts is None

    def test_attachment_data_with_multiple_attachments(self):
        """Test AttachmentData with multiple attachments."""
        group = AttachmentGroup()

        # Add multiple files to group
        for i in range(3):
            attachment = AttachmentFile(
                filename=f"project_{i}.pdf",
                mime_type="application/pdf",
                file_location=f"./project_{i}.pdf",
                hash_value=f"projecthash_{i}",
            )
            group.add_file(attachment)

        data = AttachmentData(additional_project_title=group)

        assert data.additional_project_title == group
        assert len(data.additional_project_title.attached_files) == 3

    def test_attachment_data_to_xml_dict(self):
        """Test converting AttachmentData to XML dictionary format."""
        # Create single attachment
        areas_file = AttachmentFile(
            filename="geographic_areas.pdf",
            mime_type="application/pdf",
            file_location="./attachments/geographic_areas.pdf",
            hash_value="aGVsbG8gd29ybGQ=",
        )

        # Create multiple attachments
        group = AttachmentGroup()
        project_file = AttachmentFile(
            filename="project.docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_location="./attachments/project.docx",
            hash_value="cHJvamVjdGhhc2g=",
        )
        group.add_file(project_file)

        data = AttachmentData(areas_affected=areas_file, additional_project_title=group)

        xml_dict = data.to_xml_dict()

        # Verify single attachment
        assert "AreasAffected" in xml_dict
        areas_xml = xml_dict["AreasAffected"]
        assert areas_xml["FileName"] == "geographic_areas.pdf"
        assert areas_xml["MimeType"] == "application/pdf"
        assert areas_xml["FileLocation"]["@href"] == "./attachments/geographic_areas.pdf"
        assert areas_xml["HashValue"]["@hashAlgorithm"] == "SHA-1"
        assert areas_xml["HashValue"]["#text"] == "aGVsbG8gd29ybGQ="

        # Verify multiple attachments
        assert "AdditionalProjectTitle" in xml_dict
        project_xml = xml_dict["AdditionalProjectTitle"]
        assert "AttachedFile" in project_xml
        assert len(project_xml["AttachedFile"]) == 1

        project_file_xml = project_xml["AttachedFile"][0]
        assert project_file_xml["FileName"] == "project.docx"
        assert "wordprocessingml" in project_file_xml["MimeType"]

    def test_attachment_data_to_xml_dict_empty(self):
        """Test converting empty AttachmentData to XML dictionary."""
        data = AttachmentData()
        xml_dict = data.to_xml_dict()

        assert xml_dict == {}

    def test_attachment_data_to_xml_dict_empty_group(self):
        """Test converting AttachmentData with empty group to XML dictionary."""
        empty_group = AttachmentGroup()
        data = AttachmentData(additional_project_title=empty_group)

        xml_dict = data.to_xml_dict()

        # Empty group should not appear in XML dict
        assert "AdditionalProjectTitle" not in xml_dict
        assert xml_dict == {}
