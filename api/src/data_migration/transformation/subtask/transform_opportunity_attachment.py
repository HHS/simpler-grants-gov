import logging
import uuid
from collections.abc import Sequence

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.adapters.aws import S3Config
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import Opportunity, OpportunityAttachment
from src.db.models.staging.attachment import TsynopsisAttachment
from src.services.opportunity_attachments import attachment_util
from src.task.task import Task
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class TransformOpportunityAttachmentConfig(PydanticBaseEnvConfig):
    # This is just for testing, we want to be able to only
    # import a few attachments when manually testing.
    total_attachments_to_process: int | None = None

    transform_opportunity_attachment_batch_size: int = 100


class TransformOpportunityAttachment(AbstractTransformSubTask):

    def __init__(self, task: Task, s3_config: S3Config | None = None):
        super().__init__(task)

        if s3_config is None:
            s3_config = S3Config()

        self.s3_config = s3_config

        self.attachment_config = TransformOpportunityAttachmentConfig()

        self.total_attachments_processed = 0
        self.has_unprocessed_records = True

    def has_more_to_process(self) -> bool:
        return self.has_unprocessed_records

    def transform_records(self) -> None:

        # Fetch staging attachment / our attachment / opportunity groups
        records = self.fetch_with_opportunity(
            TsynopsisAttachment,
            OpportunityAttachment,
            [TsynopsisAttachment.syn_att_id == OpportunityAttachment.legacy_attachment_id],
            # We load opportunity attachments into memory, so need to process very small batches
            # to avoid running out of memory.
            batch_size=self.attachment_config.transform_opportunity_attachment_batch_size,
            limit=self.attachment_config.transform_opportunity_attachment_batch_size,
            order_by=TsynopsisAttachment.created_at.desc(),
        )

        records_processed = self.process_opportunity_attachment_group(records)

        # If we have processed up to the test config value, stop processing entirely
        if (
            self.attachment_config.total_attachments_to_process is not None
            and self.total_attachments_processed
            >= self.attachment_config.total_attachments_to_process
        ):
            self.has_unprocessed_records = False

        # Assume if we had fewer than the batch size
        # we're probably done
        if records_processed != self.attachment_config.transform_opportunity_attachment_batch_size:
            self.has_unprocessed_records = False

    def process_opportunity_attachment_group(
        self,
        records: Sequence[
            tuple[TsynopsisAttachment, OpportunityAttachment | None, Opportunity | None]
        ],
    ) -> int:

        records_processed = 0
        for source_attachment, target_attachment, opportunity in records:
            try:
                # Note we increment first in case there are errors, want it to always increment
                records_processed += 1
                self.total_attachments_processed += 1

                self.process_opportunity_attachment(
                    source_attachment, target_attachment, opportunity
                )
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.OPPORTUNITY_ATTACHMENT,
                )
                logger.exception(
                    "Failed to process opportunity attachment",
                    extra=transform_util.get_log_extra_opportunity_attachment(source_attachment),
                )

        return records_processed

    def process_opportunity_attachment(
        self,
        source_attachment: TsynopsisAttachment,
        target_attachment: OpportunityAttachment | None,
        opportunity: Opportunity | None,
    ) -> None:

        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.OPPORTUNITY_ATTACHMENT,
        )

        extra = transform_util.get_log_extra_opportunity_attachment(source_attachment)
        logger.info("Processing opportunity attachment", extra=extra)

        if source_attachment.is_deleted:
            self._handle_delete(
                source=source_attachment,
                target=target_attachment,
                record_type=transform_constants.OPPORTUNITY_ATTACHMENT,
                extra=extra,
            )

            # Delete the file from s3 as well
            if target_attachment is not None:
                file_util.delete_file(target_attachment.file_location)

        elif opportunity is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Opportunity attachment cannot be processed as the opportunity for it does not exist"
            )

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_attachment is None

            prior_attachment_location = (
                target_attachment.file_location if target_attachment else None
            )

            logger.info("Transforming and upserting opportunity attachment", extra=extra)

            transformed_opportunity_attachment = transform_opportunity_attachment(
                source_attachment, target_attachment, opportunity, self.s3_config
            )

            # Write the file to s3
            write_file(source_attachment, transformed_opportunity_attachment)

            # If this was an update, and the file name changed
            # Cleanup the old file from s3.
            if (
                prior_attachment_location is not None
                and prior_attachment_location != transformed_opportunity_attachment.file_location
            ):
                file_util.delete_file(prior_attachment_location)

            logger.info("Transforming and upserting opportunity attachment", extra=extra)

            if is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.OPPORTUNITY_ATTACHMENT,
                )
                self.db_session.add(transformed_opportunity_attachment)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.OPPORTUNITY_ATTACHMENT,
                )
                self.db_session.merge(transformed_opportunity_attachment)

        logger.info("Processed opportunity attachment", extra=extra)
        source_attachment.transformed_at = self.transform_time


def transform_opportunity_attachment(
    source_attachment: TsynopsisAttachment,
    incoming_attachment: OpportunityAttachment | None,
    opportunity: Opportunity,
    s3_config: S3Config,
) -> OpportunityAttachment:

    log_extra = transform_util.get_log_extra_opportunity_attachment(source_attachment)

    if incoming_attachment is None:
        logger.info("Creating new opportunity attachment record", extra=log_extra)

    # Adjust the file_name to remove characters clunky in URLs
    if source_attachment.file_name is None:
        raise ValueError("Opportunity attachment does not have a file name, cannot process.")
    file_name = attachment_util.adjust_legacy_file_name(source_attachment.file_name)

    # We should always have a mime type. Raise an error if we don't
    if source_attachment.mime_type is None:
        raise ValueError("Opportunity attachment does not have a mime type, cannot process.")

    # We should always have a file description. Raise an error if we don't
    if source_attachment.file_desc is None:
        raise ValueError("Opportunity attachment does not have a file description, cannot process.")

    # We should always have a file size. Raise an error if we don't
    if source_attachment.file_lob_size is None:
        raise ValueError("Opportunity attachment does not have a file size, cannot process.")

    if incoming_attachment:
        attachment_id = incoming_attachment.attachment_id
    else:
        attachment_id = uuid.uuid4()

    file_location = attachment_util.get_s3_attachment_path(
        file_name, attachment_id, opportunity, s3_config
    )

    # We always create a new record here and merge it in the calling function
    # this way if there is any error doing the transformation, we don't modify the existing one.
    target_attachment = OpportunityAttachment(
        attachment_id=attachment_id,
        legacy_attachment_id=source_attachment.syn_att_id,
        opportunity_id=opportunity.opportunity_id,
        # Note we calculate the file location here, but haven't yet done anything
        # with s3, the calling function, will handle writing the file to s3.
        file_location=file_location,
        mime_type=source_attachment.mime_type,
        file_name=file_name,
        file_description=source_attachment.file_desc,
        file_size_bytes=source_attachment.file_lob_size,
        created_by=source_attachment.creator_id,
        updated_by=source_attachment.last_upd_id,
        legacy_folder_id=source_attachment.syn_att_folder_id,
    )

    transform_util.transform_update_create_timestamp(
        source_attachment, target_attachment, log_extra=log_extra
    )

    return target_attachment


def write_file(
    source_attachment: TsynopsisAttachment, destination_attachment: OpportunityAttachment
) -> None:

    if source_attachment.file_lob is None:
        raise ValueError("Attachment is null, cannot copy")

    with file_util.open_stream(
        destination_attachment.file_location, "wb", content_type=destination_attachment.mime_type
    ) as outfile:
        outfile.write(source_attachment.file_lob)
