import logging
from typing import Sequence, Tuple

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryFundingCategory,
    OpportunitySummary,
)
from src.db.models.staging.forecast import TfundactcatForecast, TfundactcatForecastHist
from src.db.models.staging.synopsis import TfundactcatSynopsis, TfundactcatSynopsisHist

logger = logging.getLogger(__name__)


class TransformFundingCategory(AbstractTransformSubTask):
    def transform_records(self) -> None:
        link_table = LinkOpportunitySummaryFundingCategory
        relationship_load_value = OpportunitySummary.link_funding_categories

        logger.info("Processing forecast funding categories")
        forecast_funding_category_records = self.fetch_with_opportunity_summary(
            TfundactcatForecast,
            link_table,
            [
                TfundactcatForecast.fac_frcst_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_categories_group(forecast_funding_category_records)

        logger.info("Processing historical forecast funding categories")
        forecast_funding_category_hist_records = self.fetch_with_opportunity_summary(
            TfundactcatForecastHist,
            link_table,
            [
                TfundactcatForecastHist.fac_frcst_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_categories_group(forecast_funding_category_hist_records)

        logger.info("Processing synopsis funding categories")
        synopsis_funding_category_records = self.fetch_with_opportunity_summary(
            TfundactcatSynopsis,
            link_table,
            [
                TfundactcatSynopsis.fac_syn_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_categories_group(synopsis_funding_category_records)

        logger.info("Processing historical synopsis funding categories")
        synopsis_funding_category_hist_records = self.fetch_with_opportunity_summary(
            TfundactcatSynopsisHist,
            link_table,
            [
                TfundactcatSynopsisHist.fac_syn_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_categories_group(synopsis_funding_category_hist_records)

    def process_link_funding_categories_group(
        self,
        records: Sequence[
            Tuple[
                transform_constants.SourceFundingCategory,
                LinkOpportunitySummaryFundingCategory | None,
                OpportunitySummary | None,
            ]
        ],
    ) -> None:
        for source_funding_category, target_funding_category, opportunity_summary in records:
            try:
                self.process_link_funding_category(
                    source_funding_category, target_funding_category, opportunity_summary
                )
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.FUNDING_CATEGORY,
                )
                logger.exception(
                    "Failed to process opportunity summary funding category",
                    extra=transform_util.get_log_extra_funding_category(source_funding_category),
                )

    def process_link_funding_category(
        self,
        source_funding_category: transform_constants.SourceFundingCategory,
        target_funding_category: LinkOpportunitySummaryFundingCategory | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.FUNDING_CATEGORY,
        )
        extra = transform_util.get_log_extra_funding_category(source_funding_category)
        logger.info("Processing funding category", extra=extra)

        if source_funding_category.is_deleted:
            self._handle_delete(
                source_funding_category,
                target_funding_category,
                transform_constants.FUNDING_CATEGORY,
                extra,
            )

        # Historical records are linked to other historical records, however
        # we don't import historical opportunity records, so if the opportunity
        # was deleted, we won't have created the opportunity summary. Whenever we do
        # support historical opportunities, we'll have these all marked with a
        # flag that we can use to reprocess these.
        elif self._is_orphaned_historical(opportunity_summary, source_funding_category):
            self._handle_orphaned_historical(
                source_funding_category, transform_constants.FUNDING_CATEGORY, extra
            )

        elif opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Funding category record cannot be processed as the opportunity summary for it does not exist"
            )
        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_funding_category is None

            logger.info("Transforming and upserting funding category", extra=extra)
            transformed_funding_category = (
                transform_util.convert_opportunity_summary_funding_category(
                    source_funding_category, target_funding_category, opportunity_summary
                )
            )

            # Before we insert, we have to still be certain we're not adding a duplicate record
            # because the primary key of the legacy tables is the legacy ID + lookup value + opportunity ID
            # its possible for the same lookup value to appear multiple times because the legacy ID is different
            # This would hit a conflict in our DBs primary key, so we need to verify that won't happen
            if (
                is_insert
                and transformed_funding_category.funding_category
                in opportunity_summary.funding_categories
            ):
                self.increment(
                    transform_constants.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED,
                    prefix=transform_constants.FUNDING_CATEGORY,
                )
                logger.warning(
                    "Skipping funding category record",
                    extra=extra
                    | {"funding_category": transformed_funding_category.funding_category},
                )
            elif is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.FUNDING_CATEGORY,
                )
                # We append to the relationship so SQLAlchemy immediately attaches it to its cached
                # opportunity summary object so that the above check works when we receive dupes in the same batch
                opportunity_summary.link_funding_categories.append(transformed_funding_category)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.FUNDING_CATEGORY,
                )
                self.db_session.merge(transformed_funding_category)

        logger.info("Processed funding category", extra=extra)
        source_funding_category.transformed_at = self.transform_time
