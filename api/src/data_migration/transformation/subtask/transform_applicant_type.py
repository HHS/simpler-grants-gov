import logging
from typing import Sequence, Tuple

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import LinkOpportunitySummaryApplicantType, OpportunitySummary
from src.db.models.staging.forecast import TapplicanttypesForecast, TapplicanttypesForecastHist
from src.db.models.staging.synopsis import TapplicanttypesSynopsis, TapplicanttypesSynopsisHist

logger = logging.getLogger(__name__)


class TransformApplicantType(AbstractTransformSubTask):
    def transform_records(self) -> None:
        link_table = LinkOpportunitySummaryApplicantType
        relationship_load_value = OpportunitySummary.link_applicant_types

        logger.info("Processing forecast applicant types")
        forecast_applicant_type_records = self.fetch_with_opportunity_summary(
            TapplicanttypesForecast,
            link_table,
            [
                TapplicanttypesForecast.at_frcst_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_applicant_types_group(forecast_applicant_type_records)

        logger.info("Processing historical forecast applicant types")
        forecast_applicant_type_hist_records = self.fetch_with_opportunity_summary(
            TapplicanttypesForecastHist,
            link_table,
            [
                TapplicanttypesForecastHist.at_frcst_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_applicant_types_group(forecast_applicant_type_hist_records)

        logger.info("Processing synopsis applicant types")
        synopsis_applicant_type_records = self.fetch_with_opportunity_summary(
            TapplicanttypesSynopsis,
            link_table,
            [
                TapplicanttypesSynopsis.at_syn_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_applicant_types_group(synopsis_applicant_type_records)

        logger.info("Processing historical synopsis applicant types")
        synopsis_applicant_type_hist_records = self.fetch_with_opportunity_summary(
            TapplicanttypesSynopsisHist,
            link_table,
            [
                TapplicanttypesSynopsisHist.at_syn_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_applicant_types_group(synopsis_applicant_type_hist_records)

    def process_link_applicant_types_group(
        self,
        records: Sequence[
            Tuple[
                transform_constants.SourceApplicantType,
                LinkOpportunitySummaryApplicantType | None,
                OpportunitySummary | None,
            ]
        ],
    ) -> None:
        for source_applicant_type, target_applicant_type, opportunity_summary in records:
            try:
                self.process_link_applicant_type(
                    source_applicant_type, target_applicant_type, opportunity_summary
                )
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.APPLICANT_TYPE,
                )
                logger.exception(
                    "Failed to process opportunity summary applicant type",
                    extra=transform_util.get_log_extra_applicant_type(source_applicant_type),
                )

    def process_link_applicant_type(
        self,
        source_applicant_type: transform_constants.SourceApplicantType,
        target_applicant_type: LinkOpportunitySummaryApplicantType | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.APPLICANT_TYPE,
        )
        extra = transform_util.get_log_extra_applicant_type(source_applicant_type)
        logger.info("Processing applicant type", extra=extra)

        if source_applicant_type.is_deleted:
            self._handle_delete(
                source_applicant_type,
                target_applicant_type,
                transform_constants.APPLICANT_TYPE,
                extra,
            )

        # Historical records are linked to other historical records, however
        # we don't import historical opportunity records, so if the opportunity
        # was deleted, we won't have created the opportunity summary. Whenever we do
        # support historical opportunities, we'll have these all marked with a
        # flag that we can use to reprocess these.
        elif self._is_orphaned_historical(opportunity_summary, source_applicant_type):
            self._handle_orphaned_historical(
                source_applicant_type, transform_constants.APPLICANT_TYPE, extra
            )

        elif opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Applicant type record cannot be processed as the opportunity summary for it does not exist"
            )
        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_applicant_type is None

            logger.info("Transforming and upserting applicant type", extra=extra)
            transformed_applicant_type = transform_util.convert_opportunity_summary_applicant_type(
                source_applicant_type, target_applicant_type, opportunity_summary
            )

            # Before we insert, we have to still be certain we're not adding a duplicate record
            # because the primary key of the legacy tables is the legacy ID + lookup value + opportunity ID
            # its possible for the same lookup value to appear multiple times because the legacy ID is different
            # This would hit a conflict in our DBs primary key, so we need to verify that won't happen
            if (
                is_insert
                and transformed_applicant_type.applicant_type in opportunity_summary.applicant_types
            ):
                self.increment(
                    transform_constants.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED,
                    prefix=transform_constants.APPLICANT_TYPE,
                )
                logger.warning(
                    "Skipping applicant type record",
                    extra=extra | {"applicant_type": transformed_applicant_type.applicant_type},
                )
            elif is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.APPLICANT_TYPE,
                )
                # We append to the relationship so SQLAlchemy immediately attaches it to its cached
                # opportunity summary object so that the above check works when we receive dupes in the same batch
                opportunity_summary.link_applicant_types.append(transformed_applicant_type)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.APPLICANT_TYPE,
                )
                self.db_session.merge(transformed_applicant_type)

        logger.info("Processed applicant type", extra=extra)
        source_applicant_type.transformed_at = self.transform_time
