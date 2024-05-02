import logging
from datetime import datetime
from enum import StrEnum
from typing import Sequence, Tuple, Type, TypeAlias, TypeVar, cast

from sqlalchemy import and_, select

from src.adapters import db
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.opportunity_models import (
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.db.models.staging.forecast import Tforecast, TforecastHist
from src.db.models.staging.opportunity import Topportunity, TopportunityCfda
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist
from src.task.task import Task
from src.util import datetime_util

S = TypeVar("S", bound=StagingParamMixin)
D = TypeVar("D", bound=ApiSchemaTable)

SourceSummary: TypeAlias = Tforecast | Tsynopsis | TforecastHist | TsynopsisHist

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
        self, source_model: Type[S], destination_model: Type[D], join_clause: list
    ) -> list[Tuple[S, D | None]]:
        # The real type is: Sequence[Row[Tuple[S, D | None]]]
        # but MyPy is weird about this and the Row+Tuple causes some
        # confusion in the parsing so it ends up assuming everything is Any
        # So just cast it to a simpler type that doesn't confuse anything
        return cast(
            list[Tuple[S, D | None]],
            self.db_session.execute(
                select(source_model, destination_model)
                .join(destination_model, *join_clause, isouter=True)
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ).all(),
        )

    def fetch_with_opportunity(
        self,
        source_model: Type[S],
        destination_model: Type[D],
        join_clause: list,
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
            ).all(),
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
            transformed_opportunity = transform_opportunity(source_opportunity, target_opportunity)
            self.db_session.add(transformed_opportunity)

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
            transformed_assistance_listing = transform_assistance_listing(
                source_assistance_listing, target_assistance_listing
            )
            self.db_session.add(transformed_assistance_listing)

            if is_insert:
                self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
            else:
                self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)

        logger.info("Processed assistance listing", extra=extra)
        source_assistance_listing.transformed_at = self.transform_time

    def process_opportunity_summaries(self) -> None:
        logger.info("Starting processing of opportunity summaries")
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
                    extra=get_log_extra_summary(source_summary),
                )

    def process_opportunity_summary(
        self,
        source_summary: SourceSummary,
        target_summary: OpportunitySummary | None,
        opportunity: Opportunity | None,
    ) -> None:
        self.increment(self.Metrics.TOTAL_RECORDS_PROCESSED)
        extra = get_log_extra_summary(source_summary)
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
            transformed_opportunity_summary = transform_opportunity_summary(
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


###############################
# Transformations
###############################


def transform_opportunity(
    source_opportunity: Topportunity, target_opportunity: Opportunity | None
) -> Opportunity:
    log_extra = {"opportunity_id": source_opportunity.opportunity_id}

    if target_opportunity is None:
        logger.info("Creating new opportunity record", extra=log_extra)
        target_opportunity = Opportunity(opportunity_id=source_opportunity.opportunity_id)

    target_opportunity.opportunity_number = source_opportunity.oppnumber
    target_opportunity.opportunity_title = source_opportunity.opptitle
    target_opportunity.agency = source_opportunity.owningagency
    target_opportunity.category = transform_opportunity_category(source_opportunity.oppcategory)
    target_opportunity.category_explanation = source_opportunity.category_explanation
    target_opportunity.revision_number = source_opportunity.revision_number
    target_opportunity.modified_comments = source_opportunity.modified_comments
    target_opportunity.publisher_user_id = source_opportunity.publisheruid
    target_opportunity.publisher_profile_id = source_opportunity.publisher_profile_id

    # The legacy system doesn't actually have this value as a boolean. There are several
    # different letter codes. However, their API implementation also does this for their draft flag.
    target_opportunity.is_draft = source_opportunity.is_draft != "N"
    transform_update_create_timestamp(source_opportunity, target_opportunity, log_extra=log_extra)

    return target_opportunity


OPPORTUNITY_CATEGORY_MAP = {
    "D": OpportunityCategory.DISCRETIONARY,
    "M": OpportunityCategory.MANDATORY,
    "C": OpportunityCategory.CONTINUATION,
    "E": OpportunityCategory.EARMARK,
    "O": OpportunityCategory.OTHER,
}


def transform_opportunity_category(value: str | None) -> OpportunityCategory | None:
    if value is None or value == "":
        return None

    transformed_value = OPPORTUNITY_CATEGORY_MAP.get(value)

    if transformed_value is None:
        raise ValueError("Unrecognized opportunity category: %s" % value)

    return transformed_value


def transform_assistance_listing(
    source_assistance_listing: TopportunityCfda,
    target_assistance_listing: OpportunityAssistanceListing | None,
) -> OpportunityAssistanceListing:
    log_extra = {"opportunity_assistance_listing_id": source_assistance_listing.opp_cfda_id}

    if target_assistance_listing is None:
        logger.info("Creating new assistance listing record", extra=log_extra)
        target_assistance_listing = OpportunityAssistanceListing(
            opportunity_assistance_listing_id=source_assistance_listing.opp_cfda_id,
            opportunity_id=source_assistance_listing.opportunity_id,
        )

    target_assistance_listing.assistance_listing_number = source_assistance_listing.cfdanumber
    target_assistance_listing.program_title = source_assistance_listing.programtitle

    transform_update_create_timestamp(
        source_assistance_listing, target_assistance_listing, log_extra=log_extra
    )

    return target_assistance_listing


def transform_opportunity_summary(
    source_summary: SourceSummary, incoming_summary: OpportunitySummary | None
) -> OpportunitySummary:
    log_extra = get_log_extra_summary(source_summary)

    if incoming_summary is None:
        logger.info("Creating new opportunity summary record", extra=log_extra)
        target_summary = OpportunitySummary(
            opportunity_id=source_summary.opportunity_id,
            is_forecast=source_summary.is_forecast,
            revision_number=None,
        )

        # Revision number is only found in the historical table
        if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
            target_summary.revision_number = source_summary.revision_number
    else:
        # We create a new summary object and merge it outside this function
        # that way if any modifications occur on the object and then it errors
        # they aren't actually applied
        target_summary = OpportunitySummary(
            opportunity_summary_id=incoming_summary.opportunity_summary_id
        )

    # Fields in all 4 source tables
    target_summary.version_number = source_summary.version_nbr
    target_summary.is_cost_sharing = convert_yn_bool(source_summary.cost_sharing)
    target_summary.post_date = source_summary.posting_date
    target_summary.archive_date = source_summary.archive_date
    target_summary.expected_number_of_awards = convert_numeric_str_to_int(
        source_summary.number_of_awards
    )
    target_summary.estimated_total_program_funding = convert_numeric_str_to_int(
        source_summary.est_funding
    )
    target_summary.award_floor = convert_numeric_str_to_int(source_summary.award_floor)
    target_summary.award_ceiling = convert_numeric_str_to_int(source_summary.award_ceiling)
    target_summary.additional_info_url = source_summary.fd_link_url
    target_summary.additional_info_url_description = source_summary.fd_link_desc
    target_summary.modification_comments = source_summary.modification_comments
    target_summary.funding_category_description = source_summary.oth_cat_fa_desc
    target_summary.applicant_eligibility_description = source_summary.applicant_elig_desc
    target_summary.agency_name = source_summary.ac_name
    target_summary.agency_email_address = source_summary.ac_email_addr
    target_summary.agency_email_address_description = source_summary.ac_email_desc
    target_summary.can_send_mail = convert_yn_bool(source_summary.sendmail)
    target_summary.publisher_profile_id = source_summary.publisher_profile_id
    target_summary.publisher_user_id = source_summary.publisheruid
    target_summary.updated_by = source_summary.last_upd_id
    target_summary.created_by = source_summary.creator_id

    # Some fields either are named different in synopsis/forecast
    # or only come from one of those tables, so handle those here
    if isinstance(source_summary, (Tsynopsis, TsynopsisHist)):
        target_summary.summary_description = source_summary.syn_desc
        target_summary.agency_code = source_summary.a_sa_code
        target_summary.agency_phone_number = source_summary.ac_phone_number

        # Synopsis only fields
        target_summary.agency_contact_description = source_summary.agency_contact_desc
        target_summary.close_date = source_summary.response_date
        target_summary.close_date_description = source_summary.response_date_desc
        target_summary.unarchive_date = source_summary.unarchive_date

    else:  # TForecast & TForecastHist
        target_summary.summary_description = source_summary.forecast_desc
        target_summary.agency_code = source_summary.agency_code
        target_summary.agency_phone_number = source_summary.ac_phone

        # Forecast only fields
        target_summary.forecasted_post_date = source_summary.est_synopsis_posting_date
        target_summary.forecasted_close_date = source_summary.est_appl_response_date
        target_summary.forecasted_close_date_description = (
            source_summary.est_appl_response_date_desc
        )
        target_summary.forecasted_award_date = source_summary.est_award_date
        target_summary.forecasted_project_start_date = source_summary.est_project_start_date
        target_summary.fiscal_year = source_summary.fiscal_year

    # Historical only
    if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
        target_summary.is_deleted = convert_action_type_to_is_deleted(source_summary.action_type)
    else:
        target_summary.is_deleted = False

    transform_update_create_timestamp(source_summary, target_summary, log_extra=log_extra)

    return target_summary


def convert_est_timestamp_to_utc(timestamp: datetime | None) -> datetime | None:
    if timestamp is None:
        return None

    # The timestamps we get from the legacy system have no timezone info
    # but we know the database uses US Eastern timezone by default
    #
    # First add the America/New_York timezone without any other modification
    aware_timestamp = datetime_util.make_timezone_aware(timestamp, "US/Eastern")
    # Then adjust the timezone to UTC this will handle any DST or other conversion complexities
    return datetime_util.adjust_timezone(aware_timestamp, "UTC")


def transform_update_create_timestamp(
    source: StagingBase, target: TimestampMixin, log_extra: dict | None = None
) -> None:
    # Convert the source timestamps to UTC
    # Note: the type ignores are because created_date/last_upd_date are added
    #       on the individual class definitions, not the base class - due to how
    #       we need to maintain the column order of the legacy system.
    #       Every legacy table does have these columns.
    created_timestamp = convert_est_timestamp_to_utc(source.created_date)  # type: ignore[attr-defined]
    updated_timestamp = convert_est_timestamp_to_utc(source.last_upd_date)  # type: ignore[attr-defined]

    if created_timestamp is not None:
        target.created_at = created_timestamp
    else:
        # This is incredibly rare, but possible - because our system requires
        # we set something, we'll default to the current time and log a warning.
        if log_extra is None:
            log_extra = {}

        logger.warning(
            f"{source.__class__} does not have a created_date timestamp set, setting value to now.",
            extra=log_extra,
        )
        target.created_at = datetime_util.utcnow()

    if updated_timestamp is not None:
        target.updated_at = updated_timestamp
    else:
        # In the legacy system, they don't set whether something was updated
        # until it receives an update. We always set the value, and on initial insert
        # want it to be the same as the created_at.
        target.updated_at = target.created_at


def convert_yn_bool(value: str | None) -> bool | None:
    # Booleans in the Oracle database are stored as varchar/char
    # columns with the values as Y/N
    if value is None or value == "":
        return None

    if value == "Y":
        return True

    if value == "N":
        return False

    # Just in case the column isn't actually a boolean
    raise ValueError("Unexpected Y/N bool value: %s" % value)


def convert_action_type_to_is_deleted(value: str | None) -> bool | None:
    if value is None or value == "":
        return None

    if value == "D":  # D = Delete
        return True

    if value == "U":  # U = Update
        return False

    raise ValueError("Unexpected action type value: %s" % value)


def convert_numeric_str_to_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    if value.isnumeric():
        return int(value)

    # From what we've found in the legacy data, some of these numeric strings
    # are written out as "none", "not available", "n/a" or similar. All of these
    # we're fine with collectively treating as null-equivalent
    return None


def get_log_extra_summary(source_summary: SourceSummary) -> dict:
    return {
        "opportunity_id": source_summary.opportunity_id,
        "is_forecast": source_summary.is_forecast,
        "revision_number": getattr(source_summary, "revision_number", None),
    }


def main():
    import src.logging
    with src.logging.init("tmp"):
        db_client = db.PostgresDBClient()
        with db_client.get_session() as session:
            TransformOracleDataTask(session).run()

main()