import logging
from datetime import datetime
from enum import StrEnum
from typing import Sequence, Tuple, Type, TypeVar, cast

from sqlalchemy import and_, select

from src.adapters import db
from src.data_migration.transformation import transform_util
from src.db.models.base import ApiSchemaTable
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.db.models.staging.forecast import (
    TapplicanttypesForecast,
    TapplicanttypesForecastHist,
    Tforecast,
    TforecastHist,
    TfundactcatForecast,
    TfundactcatForecastHist,
    TfundinstrForecast,
    TfundinstrForecastHist,
)
from src.db.models.staging.opportunity import Topportunity, TopportunityCfda
from src.db.models.staging.staging_base import StagingParamMixin
from src.db.models.staging.synopsis import (
    TapplicanttypesSynopsis,
    TapplicanttypesSynopsisHist,
    TfundactcatSynopsis,
    TfundactcatSynopsisHist,
    TfundinstrSynopsis,
    TfundinstrSynopsisHist,
    Tsynopsis,
    TsynopsisHist,
)
from src.task.task import Task
from src.util import datetime_util

from . import SourceApplicantType, SourceFundingCategory, SourceFundingInstrument, SourceSummary

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

    def fetch_with_opportunity_summary(
        self,
        source_model: Type[S],
        destination_model: Type[D],
        join_clause: Sequence,
        is_forecast: bool,
        is_historical_table: bool,
    ) -> list[Tuple[S, D | None, OpportunitySummary | None]]:
        # setup the join clause for getting the opportunity summary

        opportunity_summary_join_clause = [
            source_model.opportunity_id == OpportunitySummary.opportunity_id,  # type: ignore[attr-defined]
            OpportunitySummary.is_forecast.is_(is_forecast),
        ]

        if is_historical_table:
            opportunity_summary_join_clause.append(
                source_model.revision_number == OpportunitySummary.revision_number  # type: ignore[attr-defined]
            )
        else:
            opportunity_summary_join_clause.append(OpportunitySummary.revision_number.is_(None))

        return cast(
            list[Tuple[S, D | None, OpportunitySummary | None]],
            self.db_session.execute(
                select(source_model, destination_model, OpportunitySummary)
                .join(OpportunitySummary, and_(*opportunity_summary_join_clause), isouter=True)
                .join(destination_model, and_(*join_clause), isouter=True)
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

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_opportunity)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_opportunity)

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

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_assistance_listing)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_assistance_listing)

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

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_opportunity_summary)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_opportunity_summary)

        logger.info("Processed opportunity summary", extra=extra)
        source_summary.transformed_at = self.transform_time

    def process_one_to_many_lookup_tables(self) -> None:
        self.process_link_applicant_types()
        self.process_link_funding_categories()
        self.process_link_funding_categories()

    def process_link_applicant_types(self) -> None:
        forecast_applicant_type_records = self.fetch_with_opportunity_summary(
            TapplicanttypesForecast,
            LinkOpportunitySummaryApplicantType,
            [
                TapplicanttypesForecast.at_frcst_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
        )
        self.process_link_applicant_types_group(forecast_applicant_type_records)

        forecast_applicant_type_hist_records = self.fetch_with_opportunity_summary(
            TapplicanttypesForecastHist,
            LinkOpportunitySummaryApplicantType,
            [
                TapplicanttypesForecastHist.at_frcst_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
        )
        self.process_link_applicant_types_group(forecast_applicant_type_hist_records)

        synopsis_applicant_type_records = self.fetch_with_opportunity_summary(
            TapplicanttypesSynopsis,
            LinkOpportunitySummaryApplicantType,
            [
                TapplicanttypesSynopsis.at_syn_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
        )
        self.process_link_applicant_types_group(synopsis_applicant_type_records)

        synopsis_applicant_type_hist_records = self.fetch_with_opportunity_summary(
            TapplicanttypesSynopsisHist,
            LinkOpportunitySummaryApplicantType,
            [
                TapplicanttypesSynopsisHist.at_syn_id
                == LinkOpportunitySummaryApplicantType.legacy_applicant_type_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryApplicantType.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
        )
        self.process_link_applicant_types_group(synopsis_applicant_type_hist_records)

    def process_link_applicant_types_group(
        self,
        records: Sequence[
            Tuple[
                SourceApplicantType,
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
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process opportunity summary applicant type",
                    extra=transform_util.get_log_extra_applicant_type(source_applicant_type),
                )

    def process_link_applicant_type(
        self,
        source_applicant_type: SourceApplicantType,
        target_applicant_type: LinkOpportunitySummaryApplicantType | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = transform_util.get_log_extra_applicant_type(source_applicant_type)
        logger.info("Processing applicant type", extra=extra)

        if opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Applicant type record cannot be processed as the opportunity summary for it does not exist"
            )

        if source_applicant_type.is_deleted:
            logger.info("Deleting applicant type", extra=extra)

            if target_applicant_type is None:
                raise ValueError("Cannot delete applicant type as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_applicant_type)
        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_applicant_type is None

            logger.info("Transforming and upserting applicant type", extra=extra)
            transformed_applicant_type = transform_util.convert_opportunity_summary_applicant_type(
                source_applicant_type, target_applicant_type, opportunity_summary
            )

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_applicant_type)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_applicant_type)

        logger.info("Processed applicant type", extra=extra)
        source_applicant_type.transformed_at = self.transform_time

    def process_link_funding_categories(self) -> None:
        forecast_funding_category_records = self.fetch_with_opportunity_summary(
            TfundactcatForecast,
            LinkOpportunitySummaryFundingCategory,
            [
                TfundactcatForecast.fac_frcst_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
        )
        self.process_link_funding_categories_group(forecast_funding_category_records)

        forecast_funding_category_hist_records = self.fetch_with_opportunity_summary(
            TfundactcatForecastHist,
            LinkOpportunitySummaryFundingCategory,
            [
                TfundactcatForecastHist.fac_frcst_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
        )
        self.process_link_funding_categories_group(forecast_funding_category_hist_records)

        synopsis_funding_category_records = self.fetch_with_opportunity_summary(
            TfundactcatSynopsis,
            LinkOpportunitySummaryFundingCategory,
            [
                TfundactcatSynopsis.fac_syn_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
        )
        self.process_link_funding_categories_group(synopsis_funding_category_records)

        synopsis_funding_category_hist_records = self.fetch_with_opportunity_summary(
            TfundactcatSynopsisHist,
            LinkOpportunitySummaryFundingCategory,
            [
                TfundactcatSynopsisHist.fac_syn_id
                == LinkOpportunitySummaryFundingCategory.legacy_funding_category_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingCategory.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
        )
        self.process_link_funding_categories_group(synopsis_funding_category_hist_records)

    def process_link_funding_categories_group(
        self,
        records: Sequence[
            Tuple[
                SourceFundingCategory,
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
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process opportunity summary funding category",
                    extra=transform_util.get_log_extra_funding_category(source_funding_category),
                )

    def process_link_funding_category(
        self,
        source_funding_category: SourceFundingCategory,
        target_funding_category: LinkOpportunitySummaryFundingCategory | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = transform_util.get_log_extra_funding_category(source_funding_category)
        logger.info("Processing funding category", extra=extra)

        if opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Funding category record cannot be processed as the opportunity summary for it does not exist"
            )

        if source_funding_category.is_deleted:
            logger.info("Deleting funding category", extra=extra)

            if target_funding_category is None:
                raise ValueError("Cannot delete funding category as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_funding_category)
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
            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_funding_category)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_funding_category)

        logger.info("Processed funding category", extra=extra)
        source_funding_category.transformed_at = self.transform_time

    def process_link_funding_instruments(self) -> None:
        forecast_funding_instrument_records = self.fetch_with_opportunity_summary(
            TfundinstrForecast,
            LinkOpportunitySummaryFundingInstrument,
            [
                TfundinstrForecast.fi_frcst_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=False,
        )
        self.process_link_funding_instruments_group(forecast_funding_instrument_records)

        forecast_funding_instrument_hist_records = self.fetch_with_opportunity_summary(
            TfundinstrForecastHist,
            LinkOpportunitySummaryFundingInstrument,
            [
                TfundinstrForecastHist.fi_frcst_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=True,
            is_historical_table=True,
        )
        self.process_link_funding_instruments_group(forecast_funding_instrument_hist_records)

        synopsis_funding_instrument_records = self.fetch_with_opportunity_summary(
            TfundinstrSynopsis,
            LinkOpportunitySummaryFundingInstrument,
            [
                TfundinstrSynopsis.fi_syn_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=False,
        )
        self.process_link_funding_instruments_group(synopsis_funding_instrument_records)

        synopsis_funding_instrument_hist_records = self.fetch_with_opportunity_summary(
            TfundinstrSynopsisHist,
            LinkOpportunitySummaryFundingInstrument,
            [
                TfundinstrSynopsisHist.fi_syn_id
                == LinkOpportunitySummaryFundingInstrument.legacy_funding_instrument_id,
                OpportunitySummary.opportunity_summary_id
                == LinkOpportunitySummaryFundingInstrument.opportunity_summary_id,
            ],
            is_forecast=False,
            is_historical_table=True,
        )
        self.process_link_funding_instruments_group(synopsis_funding_instrument_hist_records)

    def process_link_funding_instruments_group(
        self,
        records: Sequence[
            Tuple[
                SourceFundingInstrument,
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
                self.increment(self.Metrics.TOTAL_ERROR_COUNT)
                logger.exception(
                    "Failed to process opportunity summary funding instrument",
                    extra=transform_util.get_log_extra_funding_instrument(
                        source_funding_instrument
                    ),
                )

    def process_link_funding_instrument(
        self,
        source_funding_instrument: SourceFundingInstrument,
        target_funding_instrument: LinkOpportunitySummaryFundingInstrument | None,
        opportunity_summary: OpportunitySummary | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = transform_util.get_log_extra_funding_instrument(source_funding_instrument)
        logger.info("Processing funding instrument", extra=extra)

        if opportunity_summary is None:
            # This shouldn't be possible as the incoming data has foreign keys, but as a safety net
            # we'll make sure the opportunity actually exists
            raise ValueError(
                "Funding instrument record cannot be processed as the opportunity summary for it does not exist"
            )

        if source_funding_instrument.is_deleted:
            logger.info("Deleting funding instrument", extra=extra)

            if target_funding_instrument is None:
                raise ValueError("Cannot delete funding instrument as it does not exist")

            self.increment(self.Metrics.TOTAL_RECORDS_DELETED)
            self.db_session.delete(target_funding_instrument)
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
            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
                self.db_session.add(transformed_funding_instrument)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)
                self.db_session.merge(transformed_funding_instrument)

        logger.info("Processed funding instrument", extra=extra)
        source_funding_instrument.transformed_at = self.transform_time
