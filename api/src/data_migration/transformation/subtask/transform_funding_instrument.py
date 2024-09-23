import logging
from typing import Sequence, Tuple

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryFundingInstrument,
    OpportunitySummary,
)
from src.db.models.staging.forecast import TfundinstrForecast, TfundinstrForecastHist
from src.db.models.staging.synopsis import TfundinstrSynopsis, TfundinstrSynopsisHist

logger = logging.getLogger(__name__)


class TransformFundingInstrument(AbstractTransformSubTask):
    def transform_records(self) -> None:
        link_table = LinkOpportunitySummaryFundingInstrument
        relationship_load_value = OpportunitySummary.link_funding_instruments

        logger.info("Processing forecast funding instruments")
        forecast_funding_instrument_records = self.fetch_with_opportunity_summary(
            TfundinstrForecast,
            link_table,
            [
                TfundinstrForecast.fi_frcst_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_instruments_group(forecast_funding_instrument_records)

        logger.info("Processing historical forecast funding instruments")
        forecast_funding_instrument_hist_records = self.fetch_with_opportunity_summary(
            TfundinstrForecastHist,
            link_table,
            [
                TfundinstrForecastHist.fi_frcst_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_instruments_group(forecast_funding_instrument_hist_records)

        logger.info("Processing synopsis funding instruments")
        synopsis_funding_instrument_records = self.fetch_with_opportunity_summary(
            TfundinstrSynopsis,
            link_table,
            [
                TfundinstrSynopsis.fi_syn_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_instruments_group(synopsis_funding_instrument_records)

        logger.info("Processing historical synopsis funding instruments")
        synopsis_funding_instrument_hist_records = self.fetch_with_opportunity_summary(
            TfundinstrSynopsisHist,
            link_table,
            [
                TfundinstrSynopsisHist.fi_syn_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
            relationship_load_value=relationship_load_value,
        )
        self.process_link_funding_instruments_group(synopsis_funding_instrument_hist_records)

    def process_link_funding_instruments_group(
        self,
        records: Sequence[
            Tuple[
                transform_constants.SourceFundingInstrument,
                LinkOpportunitySummaryFundingInstrument | None,
                OpportunitySummary | None,
            ]
        ],
    ) -> None:
        for source_funding_instrument, target_funding_instrument, opportunity_summary in records:
            try:
                self.process_link_funding_instrument(
                    source_funding_instrument, target_funding_instrument, opportunity_summary
                )
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.FUNDING_INSTRUMENT,
                )
                logger.exception(
                    "Failed to process opportunity summary funding instrument",
                    extra=transform_util.get_log_extra_funding_instrument(
                        source_funding_instrument
                    ),
                )

    def process_link_funding_instrument(
        self,
        source_funding_instrument: transform_constants.SourceFundingInstrument,
        target_funding_instrument: LinkOpportunitySummaryFundingInstrument | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.FUNDING_INSTRUMENT,
        )
        extra = transform_util.get_log_extra_funding_instrument(source_funding_instrument)
        logger.info("Processing funding instrument", extra=extra)

        if source_funding_instrument.is_deleted:
            self._handle_delete(
                source_funding_instrument,
                target_funding_instrument,
                transform_constants.FUNDING_INSTRUMENT,
                extra,
            )

        # Historical records are linked to other historical records, however
        # we don't import historical opportunity records, so if the opportunity
        # was deleted, we won't have created the opportunity summary. Whenever we do
        # support historical opportunities, we'll have these all marked with a
        # flag that we can use to reprocess these.
        elif self._is_orphaned_historical(opportunity_summary, source_funding_instrument):
            self._handle_orphaned_historical(
                source_funding_instrument, transform_constants.FUNDING_INSTRUMENT, extra
            )

        elif opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Funding instrument record cannot be processed as the opportunity summary for it does not exist"
            )

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_funding_instrument is None

            logger.info("Transforming and upserting funding instrument", extra=extra)
            transformed_funding_instrument = (
                transform_util.convert_opportunity_summary_funding_instrument(
                    source_funding_instrument, target_funding_instrument, opportunity_summary
                )
            )

            # Before we insert, we have to still be certain we're not adding a duplicate record
            # because the primary key of the legacy tables is the legacy ID + lookup value + opportunity ID
            # its possible for the same lookup value to appear multiple times because the legacy ID is different
            # This would hit a conflict in our DBs primary key, so we need to verify that won't happen
            if (
                is_insert
                and transformed_funding_instrument.funding_instrument
                in opportunity_summary.funding_instruments
            ):
                self.increment(
                    transform_constants.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED,
                    prefix=transform_constants.FUNDING_INSTRUMENT,
                )
                logger.warning(
                    "Skipping funding instrument record",
                    extra=extra
                    | {"funding_instrument": transformed_funding_instrument.funding_instrument},
                )
            elif is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.FUNDING_INSTRUMENT,
                )
                # We append to the relationship so SQLAlchemy immediately attaches it to its cached
                # opportunity summary object so that the above check works when we receive dupes in the same batch
                opportunity_summary.link_funding_instruments.append(transformed_funding_instrument)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.FUNDING_INSTRUMENT,
                )
                self.db_session.merge(transformed_funding_instrument)

        logger.info("Processed funding instrument", extra=extra)
        source_funding_instrument.transformed_at = self.transform_time
