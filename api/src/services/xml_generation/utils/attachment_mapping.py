"""Utility functions for creating attachment UUID mappings for XML generation."""

import logging
from typing import Any
from uuid import UUID

from src.db.models.competition_models import Application, ApplicationAttachment
from src.services.xml_generation.models.attachment import HASH_ALGORITHM, AttachmentFile

logger = logging.getLogger(__name__)


class AttachmentInfo:
    """Container for processed attachment information ready for XML generation."""

    def __init__(
        self,
        filename: str,
        mime_type: str,
        file_location: str,
        hash_value: str,
        hash_algorithm: str = HASH_ALGORITHM,
    ):
        self.filename = filename
        self.mime_type = mime_type
        self.file_location = file_location
        self.hash_value = hash_value
        self.hash_algorithm = hash_algorithm

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format for XML transformation.

        Returns:
            Dictionary representation suitable for XML generation
        """
        return {
            "FileName": self.filename,
            "MimeType": self.mime_type,
            "FileLocation": {"@href": self.file_location},
            "HashValue": {
                "@hashAlgorithm": self.hash_algorithm,
                "#text": self.hash_value,
            },
        }


def create_attachment_mapping(
    application: Application, filename_overrides: dict[UUID, str] | None = None
) -> dict[UUID, AttachmentInfo]:
    filename_overrides = filename_overrides or {}
    mapping: dict[UUID, AttachmentInfo] = {}

    # Get all attachments for this application
    attachments = application.application_attachments

    for attachment in attachments:
        # Determine the filename to use (override or original)
        filename = filename_overrides.get(
            attachment.application_attachment_id, attachment.file_name
        )

        try:
            # Compute hash from file content
            hash_value = AttachmentFile.compute_base64_sha1(attachment.file_location)
        except Exception as e:
            logger.error(
                f"Failed to compute hash for attachment {attachment.application_attachment_id}",
                extra={
                    "application_id": application.application_id,
                    "attachment_id": attachment.application_attachment_id,
                    "file_location": attachment.file_location,
                },
            )
            raise ValueError(
                f"Failed to process attachment {attachment.application_attachment_id} "
                f"(file: {attachment.file_location}): {e}"
            ) from e

        # Create attachment info
        attachment_info = AttachmentInfo(
            filename=filename,
            mime_type=attachment.mime_type,
            file_location=attachment.file_location,
            hash_value=hash_value,
        )

        mapping[attachment.application_attachment_id] = attachment_info

        logger.debug(
            f"Mapped attachment {attachment.application_attachment_id} with filename {filename}"
        )

    logger.info(
        f"Created attachment mapping for {len(mapping)} attachments",
        extra={"application_id": application.application_id},
    )

    return mapping


def create_attachment_mapping_from_list(
    attachments: list[ApplicationAttachment], filename_overrides: dict[UUID, str] | None = None
) -> dict[UUID, AttachmentInfo]:
    filename_overrides = filename_overrides or {}
    mapping: dict[UUID, AttachmentInfo] = {}

    for attachment in attachments:
        # Determine the filename to use (override or original)
        filename = filename_overrides.get(
            attachment.application_attachment_id, attachment.file_name
        )

        try:
            # Compute hash from file content
            hash_value = AttachmentFile.compute_base64_sha1(attachment.file_location)
        except Exception as e:
            logger.error(
                f"Failed to compute hash for attachment {attachment.application_attachment_id}",
                extra={
                    "attachment_id": attachment.application_attachment_id,
                    "file_location": attachment.file_location,
                },
            )
            raise ValueError(
                f"Failed to process attachment {attachment.application_attachment_id} "
                f"(file: {attachment.file_location}): {e}"
            ) from e

        # Create attachment info
        attachment_info = AttachmentInfo(
            filename=filename,
            mime_type=attachment.mime_type,
            file_location=attachment.file_location,
            hash_value=hash_value,
        )

        mapping[attachment.application_attachment_id] = attachment_info

        logger.debug(
            f"Mapped attachment {attachment.application_attachment_id} with filename {filename}"
        )

    logger.info(f"Created attachment mapping for {len(mapping)} attachments from list")

    return mapping
