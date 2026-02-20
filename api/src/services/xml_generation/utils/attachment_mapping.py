"""Utility functions for creating attachment UUID mappings for XML generation."""

import logging
from typing import Any

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


def _collect_referenced_attachment_ids(application: Application) -> set[str]:
    """Collect attachment UUIDs referenced in any form's application_response.

    Uses each form's json_to_xml_schema attachment_fields config to identify
    which fields hold attachment references, then reads those fields from the
    form's application_response.
    """
    referenced: set[str] = set()
    for app_form in application.application_forms:
        schema = app_form.form.json_to_xml_schema or {}
        attachment_fields = schema.get("_xml_config", {}).get("attachment_fields", {})
        response = app_form.application_response
        for field_name in attachment_fields:
            value = response.get(field_name)
            if isinstance(value, str):
                referenced.add(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        referenced.add(item)
    return referenced


def create_attachment_mapping(
    application: Application, filename_overrides: dict[str, str] | None = None
) -> dict[str, AttachmentInfo]:
    filename_overrides = filename_overrides or {}
    mapping: dict[str, AttachmentInfo] = {}

    # Collect all attachment UUIDs referenced across all form responses
    referenced_ids = _collect_referenced_attachment_ids(application)

    # Get all (non-deleted) attachments for this application
    attachments = application.application_attachments

    orphan_count = 0
    for attachment in attachments:
        attachment_id_str = str(attachment.application_attachment_id)

        # Skip attachments that are not referenced in any form's application_response
        if attachment_id_str not in referenced_ids:
            orphan_count += 1
            logger.warning(
                "Orphaned attachment detected and excluded from XML generation - "
                "attachment '%s' (id=%s) is not referenced in any form's application_response",
                attachment.file_name,
                attachment.application_attachment_id,
                extra={
                    "application_id": application.application_id,
                    "attachment_id": attachment.application_attachment_id,
                    "file_name": attachment.file_name,
                    "file_location": attachment.file_location,
                },
            )
            continue

        # Determine the filename to use (override or original)
        filename = filename_overrides.get(attachment_id_str, attachment.file_name)

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

        # Add to mapping keyed by string UUID
        mapping[attachment_id_str] = attachment_info

        logger.debug(f"Mapped attachment {attachment_id_str} with filename {filename}")

    if orphan_count > 0:
        logger.warning(
            f"Excluded {orphan_count} orphaned attachment(s) from XML generation",
            extra={
                "application_id": application.application_id,
                "orphan_count": orphan_count,
                "included_count": len(mapping),
            },
        )

    logger.info(
        f"Created attachment mapping for {len(mapping)} attachments "
        f"({orphan_count} orphaned attachments excluded)",
        extra={"application_id": application.application_id},
    )

    return mapping


def create_attachment_mapping_from_list(
    attachments: list[ApplicationAttachment], filename_overrides: dict[str, str] | None = None
) -> dict[str, AttachmentInfo]:
    filename_overrides = filename_overrides or {}
    mapping: dict[str, AttachmentInfo] = {}

    for attachment in attachments:
        # Convert UUID to string for the mapping key
        attachment_id_str = str(attachment.application_attachment_id)

        # Determine the filename to use (override or original)
        filename = filename_overrides.get(attachment_id_str, attachment.file_name)

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

        # Add to mapping keyed by string UUID
        mapping[attachment_id_str] = attachment_info

        logger.debug(f"Mapped attachment {attachment_id_str} with filename {filename}")

    logger.info(f"Created attachment mapping for {len(mapping)} attachments from list")

    return mapping
