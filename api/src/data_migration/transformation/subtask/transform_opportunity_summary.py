import logging
from collections.abc import Sequence

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.staging.forecast import Tforecast
from src.db.models.staging.synopsis import Tsynopsis

logger = logging.getLogger(__name__)


class TransformOpportunitySummary(AbstractTransformSubTask):
    def transform_records(self) -> None:
        logger.info("Processing opportunity summaries")
        logger.info("Processing synopsis records")
        synopsis_records = self.fetch_with_opportunity(
            Tsynopsis,
            OpportunitySummary,
            [
                Tsynopsis.opportunity_id == OpportunitySummary.legacy_opportunity_id,
                OpportunitySummary.is_forecast.is_(False),
            ],
        )
        self.process_opportunity_summary_group(synopsis_records)

        logger.info("Processing forecast records")
        forecast_records = self.fetch_with_opportunity(
            Tforecast,
            OpportunitySummary,
            [
                Tforecast.opportunity_id == OpportunitySummary.legacy_opportunity_id,
                OpportunitySummary.is_forecast.is_(True),
            ],
        )
        self.process_opportunity_summary_group(forecast_records)

    def process_opportunity_summary_group(
        self,
        records: Sequence[
            tuple[transform_constants.SourceSummary, OpportunitySummary | None, Opportunity | None]
        ],
    ) -> None:
        for source_summary, target_summary, opportunity in records:
            try:
                self.process_opportunity_summary(source_summary, target_summary, opportunity)
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.OPPORTUNITY_SUMMARY,
                )
                logger.exception(
                    "Failed to process opportunity summary",
                    extra=transform_util.get_log_extra_summary(source_summary),
                )

    def process_opportunity_summary(
        self,
        source_summary: transform_constants.SourceSummary,
        target_summary: OpportunitySummary | None,
        opportunity: Opportunity | None,
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.OPPORTUNITY_SUMMARY,
        )
        extra = transform_util.get_log_extra_summary(source_summary)
        logger.info("Processing opportunity summary", extra=extra)

        if source_summary.is_deleted:
            self._handle_delete(
                source_summary, target_summary, transform_constants.OPPORTUNITY_SUMMARY, extra
            )
        elif opportunity is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Opportunity summary cannot be processed as the opportunity for it does not exist"
            )

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_summary is None

            logger.info("Transforming and upserting opportunity summary", extra=extra)
            transformed_opportunity_summary = transform_util.transform_opportunity_summary(
                source_summary, target_summary, opportunity
            )

            if is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.OPPORTUNITY_SUMMARY,
                )
                self.db_session.add(transformed_opportunity_summary)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.OPPORTUNITY_SUMMARY,
                )
                self.db_session.merge(transformed_opportunity_summary)

        logger.info("Processed opportunity summary", extra=extra)
        source_summary.transformed_at = self.transform_time
