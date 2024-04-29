import logging
from datetime import datetime
from enum import StrEnum
from typing import Tuple, Type, TypeVar, cast

from sqlalchemy import select

from src.adapters import db
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.opportunity import Topportunity
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin
from src.task.task import Task
from src.util import datetime_util

S = TypeVar("S", bound=StagingParamMixin)
D = TypeVar("D", bound=ApiSchemaTable)


logger = logging.getLogger(__name__)


class TransformOracleDataTask(Task):
    class Metrics(StrEnum):
        TOTAL_RECORDS_PROCESSED = "total_records_processed"
        TOTAL_RECORDS_DELETED = "total_records_deleted"
        TOTAL_RECORDS_INSERTED = "total_records_inserted"
        TOTAL_RECORDS_UPDATED = "total_records_updated"

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
        # TODO - https://github.com/HHS/simpler-grants-gov/issues/1746
        pass

    def process_opportunity_summaries(self) -> None:
        # TODO - https://github.com/HHS/simpler-grants-gov/issues/1747
        pass

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
