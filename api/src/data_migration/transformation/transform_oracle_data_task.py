import logging
from datetime import datetime
from enum import StrEnum
from typing import Sequence, Tuple, Type, TypeVar, cast

from sqlalchemy import and_, select

from src.adapters import db
from src.data_migration.transformation import transform_util
from src.db.models.base import ApiSchemaTable
from src.db.models.opportunity_models import (
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.db.models.staging.forecast import Tforecast, TforecastHist
from src.db.models.staging.opportunity import Topportunity, TopportunityCfda
from src.db.models.staging.staging_base import StagingParamMixin
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist
from src.task.task import Task
from src.util import datetime_util

from . import SourceSummary

S = TypeVar("S", bound=StagingParamMixin)
D = TypeVar("D", bound=ApiSchemaTable)

logger = logging.getLogger(__name__)


class TransformOracleDataTask(Task):
    class Metrics(StrEnum):
        TOTAL_RECORDS_PROCESSED = "total_records_processed"
        TOTAL_RECORDS_DELETED = "total_records_deleted"
        TOTAL_RECORDS_INSERTED = "total_records_inserted"
        TOTAL_RECORDS_UPDATED = "total_records_updated"
        TOTAL_RECORDS_ORPHANED = "total_records_orphaned"

        TOTAL_ERROR_COUNT = "total_error_count"

    def __init__(self, db_session: db.Session, transform_time: datetime | None = None) -> None:
        super().__init__(db_session)

        if transform_time is None:
            transform_time = datetime_util.utcnow()
        self.transform_time = transform_time

    def run_task(self) -> None:
        with self.db_session.begin():
            # Opportunities
            self.process_opportunities()

            # Assistance Listings
            self.process_assistance_listings()

            # Opportunity Summary
            self.process_opportunity_summaries()

            # One-to-many lookups
            self.process_one_to_many_lookup_tables()

    def fetch(
        self, source_model: Type[S], destination_model: Type[D], join_clause: Sequence
    ) -> list[Tuple[S, D | None]]:
        # The real type is: Sequence[Row[Tuple[S, D | None]]]
        # but MyPy is weird about this and the Row+Tuple causes some
        # confusion in the parsing so it ends up assuming everything is Any
        # So just cast it to a simpler type that doesn't confuse anything
        return cast(
            list[Tuple[S, D | None]],
            self.db_session.execute(
                select(source_model, destination_model)
                .join(destination_model, and_(*join_clause), isouter=True)
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ),
        )

    def fetch_with_opportunity(
        self, source_model: Type[S], destination_model: Type[D], join_clause: Sequence
    ) -> list[Tuple[S, D | None, Opportunity | None]]:
        # Similar to the above fetch function, but also grabs an opportunity record
        # Note that this requires your source_model to have an opportunity_id field defined.

        return cast(
            list[Tuple[S, D | None, Opportunity | None]],
            self.db_session.execute(
                select(source_model, destination_model, Opportunity)
                .join(destination_model, and_(*join_clause), isouter=True)
                .join(
                    Opportunity,
                    source_model.opportunity_id == Opportunity.opportunity_id,  # type: ignore[attr-defined]
                    isouter=True,
                )
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ),
        )

    def process_opportunities(self) -> None:
        # Fetch all opportunities that were modified
        # Alongside that, grab the existing opportunity record
        opportunities: list[Tuple[Topportunity, Opportunity | None]] = self.fetch(
            Topportunity,
            Opportunity,
            [Topportunity.opportunity_id == Opportunity.opportunity_id],
        )

        for source_opportunity, target_opportunity in opportunities:
            try:
                self.process_opportunity(source_opportunity, target_opportunity)
            except ValueError:
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process opportunity",
                    extra={"opportunity_id": source_opportunity.opportunity_id},
                )

    def process_opportunity(
        self, source_opportunity: Topportunity, target_opportunity: Opportunity | None
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = {"opportunity_id": source_opportunity.opportunity_id}
        logger.info("Processing opportunity", extra=extra)

        if source_opportunity.is_deleted:
            logger.info("Deleting opportunity", extra=extra)

            if target_opportunity is None:
                raise ValueError("Cannot delete opportunity as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_opportunity)

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_opportunity is None

            logger.info("Transforming and upserting opportunity", extra=extra)
            transformed_opportunity = transform_util.transform_opportunity(
                source_opportunity, target_opportunity
            )
            self.db_session.merge(transformed_opportunity)

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)

        logger.info("Processed opportunity", extra=extra)
        source_opportunity.transformed_at = self.transform_time

    def process_assistance_listings(self) -> None:
        assistance_listings: list[
            Tuple[TopportunityCfda, OpportunityAssistanceListing | None, Opportunity | None]
        ] = self.fetch_with_opportunity(
            TopportunityCfda,
            OpportunityAssistanceListing,
            [
                TopportunityCfda.opp_cfda_id
                == OpportunityAssistanceListing.opportunity_assistance_listing_id
            ],
        )

        for (
            source_assistance_listing,
            target_assistance_listing,
            opportunity,
        ) in assistance_listings:
            try:
                self.process_assistance_listing(
                    source_assistance_listing, target_assistance_listing, opportunity
                )
            except ValueError:
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process assistance listing",
                    extra={
                        "opportunity_assistance_listing_id": source_assistance_listing.opp_cfda_id
                    },
                )

    def process_assistance_listing(
        self,
        source_assistance_listing: TopportunityCfda,
        target_assistance_listing: OpportunityAssistanceListing | None,
        opportunity: Opportunity | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = {
            "opportunity_assistance_listing_id": source_assistance_listing.opp_cfda_id,
            "opportunity_id": source_assistance_listing.opportunity_id,
        }
        logger.info("Processing assistance listing", extra=extra)

        if opportunity is None:
            # The Oracle system we're importing these from does not have a foreign key between
            # the opportunity ID in the TOPPORTUNITY_CFDA table and the TOPPORTUNITY table.
            # There are many (2306 as of writing) orphaned CFDA records, created between 2007 and 2011
            # We don't want to continuously process these, so won't error for these, and will just
            # mark them as transformed below.
            self.increment(self.Metrics.TOTAL_RECORDS_ORPHANED)
            logger.info(
                "Assistance listing is orphaned and does not connect to any opportunity",
                extra=extra,
            )

        elif source_assistance_listing.is_deleted:
            logger.info("Deleting assistance listing", extra=extra)

            if target_assistance_listing is None:
                raise ValueError("Cannot delete assistance listing as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_assistance_listing)

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_assistance_listing is None

            logger.info("Transforming and upserting assistance listing", extra=extra)
            transformed_assistance_listing = transform_util.transform_assistance_listing(
                source_assistance_listing, target_assistance_listing
            )
            self.db_session.merge(transformed_assistance_listing)

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)

        logger.info("Processed assistance listing", extra=extra)
        source_assistance_listing.transformed_at = self.transform_time

    def process_opportunity_summaries(self) -> None:
        logger.info("Processing opportunity summaries")
        logger.info("Processing synopsis records")
        synopsis_records = self.fetch_with_opportunity(
            Tsynopsis,
            OpportunitySummary,
            [
                Tsynopsis.opportunity_id == OpportunitySummary.opportunity_id,
                OpportunitySummary.is_forecast.is_(False),
                OpportunitySummary.revision_number.is_(None),
            ],
        )
        self.process_opportunity_summary_group(synopsis_records)

        logger.info("Processing synopsis hist records")
        synopsis_hist_records = self.fetch_with_opportunity(
            TsynopsisHist,
            OpportunitySummary,
            [
                TsynopsisHist.opportunity_id == OpportunitySummary.opportunity_id,
                TsynopsisHist.revision_number == OpportunitySummary.revision_number,
                OpportunitySummary.is_forecast.is_(False),
            ],
        )
        self.process_opportunity_summary_group(synopsis_hist_records)

        logger.info("Processing forecast records")
        forecast_records = self.fetch_with_opportunity(
            Tforecast,
            OpportunitySummary,
            [
                Tforecast.opportunity_id == OpportunitySummary.opportunity_id,
                OpportunitySummary.is_forecast.is_(True),
                OpportunitySummary.revision_number.is_(None),
            ],
        )
        self.process_opportunity_summary_group(forecast_records)

        logger.info("Processing forecast hist records")
        forecast_hist_records = self.fetch_with_opportunity(
            TforecastHist,
            OpportunitySummary,
            [
                TforecastHist.opportunity_id == OpportunitySummary.opportunity_id,
                TforecastHist.revision_number == OpportunitySummary.revision_number,
                OpportunitySummary.is_forecast.is_(True),
            ],
        )
        self.process_opportunity_summary_group(forecast_hist_records)

    def process_opportunity_summary_group(
        self, records: Sequence[Tuple[SourceSummary, OpportunitySummary | None, Opportunity | None]]
    ) -> None:
        for source_summary, target_summary, opportunity in records:
            try:
                self.process_opportunity_summary(source_summary, target_summary, opportunity)
            except ValueError:
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process opportunity summary",
                    extra=transform_util.get_log_extra_summary(source_summary),
                )

    def process_opportunity_summary(
        self,
        source_summary: SourceSummary,
        target_summary: OpportunitySummary | None,
        opportunity: Opportunity | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = transform_util.get_log_extra_summary(source_summary)
        logger.info("Processing opportunity summary", extra=extra)

        if opportunity is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Opportunity summary cannot be processed as the opportunity for it does not exist"
            )

        if source_summary.is_deleted:
            logger.info("Deleting opportunity summary", extra=extra)

            if target_summary is None:
                raise ValueError("Cannot delete opportunity summary as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_summary)

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_summary is None

            logger.info("Transforming and upserting opportunity summary", extra=extra)
            transformed_opportunity_summary = transform_util.transform_opportunity_summary(
                source_summary, target_summary
            )
            self.db_session.merge(transformed_opportunity_summary)

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)

        logger.info("Processed opportunity summary", extra=extra)
        source_summary.transformed_at = self.transform_time

    def process_one_to_many_lookup_tables(self) -> None:
        # TODO - https://github.com/HHS/simpler-grants-gov/issues/1749
        pass
