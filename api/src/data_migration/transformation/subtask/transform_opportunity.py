import logging
from typing import cast

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.adapters.aws import S3Config
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAttachment
from src.db.models.staging.opportunity import Topportunity
from src.services.competition_alpha.competition_instruction_util import (
    get_s3_competition_instruction_path,
)
from src.services.opportunity_attachments import attachment_util
from src.task.task import Task
from src.util import file_util

logger = logging.getLogger(__name__)


class TransformOpportunity(AbstractTransformSubTask):

    def __init__(self, task: Task, s3_config: S3Config | None = None):
        super().__init__(task)

        if s3_config is None:
            s3_config = S3Config()

        self.s3_config = s3_config

    def transform_records(self) -> None:
        # Fetch all opportunities that were modified
        # Alongside that, grab the existing opportunity record
        opportunities: list[tuple[Topportunity, Opportunity | None]] = self.fetch(
            Topportunity,
            Opportunity,
            [Topportunity.opportunity_id == Opportunity.legacy_opportunity_id],
        )

        for source_opportunity, target_opportunity in opportunities:
            try:
                self.process_opportunity(source_opportunity, target_opportunity)
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.OPPORTUNITY,
                )
                logger.exception(
                    "Failed to process opportunity",
                    extra={"opportunity_id": source_opportunity.opportunity_id},
                )

    def process_opportunity(
        self, source_opportunity: Topportunity, target_opportunity: Opportunity | None
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.OPPORTUNITY,
        )
        extra = {"opportunity_id": source_opportunity.opportunity_id}
        logger.info("Processing opportunity", extra=extra)

        if source_opportunity.is_deleted:
            self._handle_delete(
                source_opportunity,
                target_opportunity,
                transform_constants.OPPORTUNITY,
                extra,
            )

            # Cleanup the attachments from s3
            if target_opportunity is not None:
                for attachment in target_opportunity.opportunity_attachments:
                    logger.info(
                        "Deleting opportunity attachment as opportunity is being deleted.",
                        extra=extra | {"s3_location": attachment.file_location},
                    )
                    file_util.delete_file(attachment.file_location)

                # Also cleanup competition instruction files
                for competition in target_opportunity.competitions:
                    for competition_instruction in competition.competition_instructions:
                        logger.info(
                            "Deleting competition instruction as opportunity is being deleted.",
                            extra=extra | {"s3_location": competition_instruction.file_location},
                        )
                        file_util.delete_file(competition_instruction.file_location)

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_opportunity is None

            was_draft = target_opportunity.is_draft if target_opportunity else None

            logger.info("Transforming and upserting opportunity", extra=extra)
            transformed_opportunity = transform_util.transform_opportunity(
                source_opportunity, target_opportunity
            )

            if is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.OPPORTUNITY,
                )
                self.db_session.add(transformed_opportunity)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.OPPORTUNITY,
                )
                self.db_session.merge(transformed_opportunity)

                # If the opportunity's draft status has changed (draft ↔ published),
                # move all attachments to the correct S3 bucket (public or draft)
                if was_draft != transformed_opportunity.is_draft:
                    self._move_attachments_to_correct_bucket(
                        cast(Opportunity, target_opportunity).opportunity_attachments,
                        transformed_opportunity,
                    )

                    for competition in cast(Opportunity, target_opportunity).competitions:
                        self._move_competition_instructions_to_correct_bucket(competition)

        logger.info("Processed opportunity", extra=extra)
        source_opportunity.transformed_at = self.transform_time

    def _move_attachments_to_correct_bucket(
        self,
        opportunity_attachments: list[OpportunityAttachment],
        transformed_opportunity: Opportunity,
    ) -> None:
        for attachment in opportunity_attachments:
            file_name = attachment_util.adjust_legacy_file_name(attachment.file_name)
            s3_path = attachment_util.get_s3_attachment_path(
                file_name,
                attachment.attachment_id,
                transformed_opportunity,
                self.s3_config,
            )

            logger.info(
                "Moving opportunity attachment as opportunity is no longer a draft",
                extra={
                    "opportunity_id": transformed_opportunity.opportunity_id,
                    "source_path": attachment.file_location,
                    "destination_path": s3_path,
                },
            )
            file_util.move_file(attachment.file_location, s3_path)
            attachment.file_location = s3_path

    def _move_competition_instructions_to_correct_bucket(self, competition: Competition) -> None:
        for competition_instruction in competition.competition_instructions:
            s3_path = get_s3_competition_instruction_path(
                competition_instruction.file_name,
                competition_instruction.competition_instruction_id,
                competition,
                self.s3_config,
            )

            logger.info(
                "Moving competition instruction as opportunity is no longer a draft",
                extra={
                    "opportunity_id": competition.opportunity_id,
                    "competition_id": competition.competition_id,
                    "source_path": competition_instruction.file_location,
                    "destination_path": s3_path,
                },
            )
            file_util.move_file(competition_instruction.file_location, s3_path)
            competition_instruction.file_location = s3_path
