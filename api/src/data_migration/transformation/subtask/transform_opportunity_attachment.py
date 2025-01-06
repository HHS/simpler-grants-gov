from typing import Sequence
import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.constants.lookup_constants import OpportunityAttachmentType

from src.data_migration.transformation.subtask.abstract_transform_subtask import AbstractTransformSubTask
import logging

from src.db.models.opportunity_models import OpportunityAttachment, Opportunity
from src.db.models.staging.attachment import TsynopsisAttachment

logger = logging.getLogger(__name__)

class TransformOpportunityAttachment(AbstractTransformSubTask):

    def transform_records(self) -> None:
        records = self.fetch_with_opportunity(TsynopsisAttachment, OpportunityAttachment, [TsynopsisAttachment.syn_att_id == OpportunityAttachment.attachment_id])

        self.process_opportunity_attachment_group(records)

    def process_opportunity_attachment_group(self, records: Sequence[tuple[TsynopsisAttachment, OpportunityAttachment | None, Opportunity | None]]) -> None:
        for source_attachment, target_attachment, opportunity in records:
            try:
                self.process_opportunity_attachment(source_attachment, target_attachment, opportunity)
            except ValueError:
                self.increment(transform_constants.Metrics.TOTAL_ERROR_COUNT, prefix=transform_constants.OPPORTUNITY_ATTACHMENT)
                logger.exception("Failed to process opportunity attachment", extra=transform_util.get_log_extra_opportunity_attachment(source_attachment))

    def process_opportunity_attachment(self, source_attachment: TsynopsisAttachment, target_attachment: OpportunityAttachment | None, opportunity: Opportunity | None) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.OPPORTUNITY_ATTACHMENT,
        )

        extra = transform_util.get_log_extra_opportunity_attachment(source_attachment)
        logger.info("Processing opportunity attachment", extra=extra)

        if source_attachment.is_deleted:
            # TODO - https://github.com/HHS/simpler-grants-gov/issues/3322
            #        deletes are more complex because of s3
            #        this just handles deleting the DB record at the moment
            self._handle_delete(source=source_attachment, target=target_attachment, record_type=transform_constants.OPPORTUNITY_ATTACHMENT, extra=extra)

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

            logger.info("Transforming and upserting opportunity attachment", extra=extra)

            transformed_opportunity_attachment = transform_opportunity_attachment(source_attachment, target_attachment)

            # TODO - we'll need to handle more with the s3 files here
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

def transform_opportunity_attachment(source_attachment: TsynopsisAttachment, incoming_attachment: OpportunityAttachment | None) -> OpportunityAttachment:

    log_extra = transform_util.get_log_extra_opportunity_attachment(source_attachment)

    if incoming_attachment is None:
        logger.info("Creating new opportunity attachment record", extra=log_extra)

    # We always create a new record here and merge it in the calling function
    # this way if there is any error doing the transformation, we don't modify the existing one.
    target_attachment = OpportunityAttachment(
        attachment_id=source_attachment.syn_att_id,
        opportunity_id=source_attachment.opportunity_id,
        opportunity_attachment_type=OpportunityAttachmentType.OTHER,
        # TODO - in https://github.com/HHS/simpler-grants-gov/issues/3322
        #        we'll actually handle the file location logic with s3
        file_location="TODO", # TODO - next PR
        mime_type=source_attachment.mime_type,
        file_name=source_attachment.file_name,
        file_description=source_attachment.file_desc,
        file_size_bytes=source_attachment.file_lob_size,
        created_by=source_attachment.created_by,
        updated_by=source_attachment.updated_by,
        legacy_folder_id=source_attachment.syn_att_folder_id
    )

    transform_util.transform_update_create_timestamp(source_attachment, target_attachment, log_extra=log_extra)

    return target_attachment
