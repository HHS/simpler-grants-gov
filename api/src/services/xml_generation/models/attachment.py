"""Attachment data models for XML generation."""

import base64
import hashlib
import mimetypes
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, field_validator

from src.util import file_util


class AttachmentFile(BaseModel):
    """Model for a single attachment file."""

    filename: str = Field(
        ..., min_length=1, max_length=255, description="Name of the attached file"
    )
    mime_type: str = Field(..., description="MIME type of the file")
    file_location: str = Field(..., description="URI/path to the file location")
    hash_value: str = Field(..., description="Base64-encoded SHA-1 hash of the file")
    hash_algorithm: str = Field(default="SHA-1", description="Hash algorithm used")

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, v: str) -> str:
        """Validate MIME type format."""
        if "/" not in v:
            raise ValueError("MIME type must contain a slash (e.g., 'application/pdf')")
        return v

    @field_validator("hash_algorithm")
    @classmethod
    def validate_hash_algorithm(cls, v: str) -> str:
        """Ensure hash algorithm is SHA-1."""
        if v != "SHA-1":
            raise ValueError("Only SHA-1 hash algorithm is supported by Grants.gov")
        return v

    @classmethod
    def from_file_path(
        cls, file_path: str | Path, file_location: str | None = None
    ) -> "AttachmentFile":
        """Create AttachmentFile from a file path.

        Args:
            file_path: Path to the file
            file_location: Custom file location URI (defaults to relative path)

        Returns:
            AttachmentFile instance with computed hash and MIME type
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Generate base64-encoded SHA-1 hash
        hash_value = cls.compute_base64_sha1(file_path)

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type is None:
            mime_type = "application/octet-stream"  # Default fallback

        # Use provided file_location or generate relative path
        if file_location is None:
            file_location = f"./attachments/{file_path.name}"

        return cls(
            filename=file_path.name,
            mime_type=mime_type,
            file_location=file_location,
            hash_value=hash_value,
            hash_algorithm="SHA-1",
        )

    @staticmethod
    def compute_base64_sha1(file_path: str | Path) -> str:
        """Compute base64-encoded SHA-1 hash of a file.

        Args:
            file_path: Path to the file

        Returns:
            Base64-encoded SHA-1 hash string
        """
        sha1_hash = hashlib.sha1(usedforsecurity=False)

        with file_util.open_stream(file_path, "rb") as f:
            # Read file in chunks to handle large files efficiently
            for chunk in iter(lambda: f.read(4096), b""):
                sha1_hash.update(chunk)

        # Return base64-encoded hash
        return base64.b64encode(sha1_hash.digest()).decode("utf-8")

    @staticmethod
    def compute_base64_sha1_from_content(content: bytes) -> str:
        """Compute base64-encoded SHA-1 hash from file content.

        Args:
            content: File content as bytes

        Returns:
            Base64-encoded SHA-1 hash string
        """
        sha1_hash = hashlib.sha1(content, usedforsecurity=False)
        return base64.b64encode(sha1_hash.digest()).decode("utf-8")


class AttachmentGroup(BaseModel):
    """Model for a group of attachment files (0-100 files)."""

    attached_files: list[AttachmentFile] = Field(
        default_factory=list, max_length=100, description="List of attached files (maximum 100)"
    )

    def add_file(self, attachment_file: AttachmentFile) -> None:
        """Add an attachment file to the group.

        Args:
            attachment_file: The attachment file to add

        Raises:
            ValueError: If adding would exceed the 100 file limit
        """
        if len(self.attached_files) >= 100:
            raise ValueError("Cannot add more than 100 files to an attachment group")
        self.attached_files.append(attachment_file)

    def add_file_from_path(self, file_path: str | Path, file_location: str | None = None) -> None:
        """Add a file from a file path.

        Args:
            file_path: Path to the file
            file_location: Custom file location URI
        """
        attachment_file = AttachmentFile.from_file_path(file_path, file_location)
        self.add_file(attachment_file)


class AttachmentData(BaseModel):
    """Model for all attachment data in an SF-424 form."""

    areas_affected: AttachmentFile | None = Field(None, description="Geographic areas affected")
    additional_project_title: AttachmentGroup | None = Field(
        None, description="Additional project title attachments"
    )
    additional_congressional_districts: AttachmentFile | None = Field(
        None, description="Additional congressional districts"
    )
    debt_explanation: AttachmentFile | None = Field(None, description="Debt explanation document")

    def to_xml_dict(self, attachment_config: dict[str, Any]) -> dict[str, Any]:
        """Convert attachment data to XML-ready dictionary format.

        Returns:
            Dictionary suitable for XML transformation
        """
        result = {}

        for field_name, config in attachment_config.items():
            field_value = getattr(self, field_name, None)
            if field_value is None:
                continue

            xml_element = config["xml_element"]
            field_type = config["type"]

            if field_type == "single":
                # Single attachment
                result[xml_element] = self._attachment_to_dict(field_value)
            elif field_type == "multiple":
                # Multiple attachments (AttachmentGroup)
                if hasattr(field_value, "attached_files") and field_value.attached_files:
                    result[xml_element] = {
                        "AttachedFile": [
                            self._attachment_to_dict(file) for file in field_value.attached_files
                        ]
                    }

        return result

    def _attachment_to_dict(self, attachment: AttachmentFile) -> dict[str, Any]:
        """Convert a single attachment to dictionary format.

        Args:
            attachment: The attachment file

        Returns:
            Dictionary representation for XML
        """
        return {
            "FileName": attachment.filename,
            "MimeType": attachment.mime_type,
            "FileLocation": {"@href": attachment.file_location},
            "HashValue": {
                "@hashAlgorithm": attachment.hash_algorithm,
                "#text": attachment.hash_value,
            },
        }
