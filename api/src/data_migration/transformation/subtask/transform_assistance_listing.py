import logging
from typing import Tuple

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.db.models.staging.opportunity import TopportunityCfda

logger = logging.getLogger(__name__)


class TransformAssistanceListing(AbstractTransformSubTask):
    def transform_records(self) -> None:
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
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.ASSISTANCE_LISTING,
                )
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
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.ASSISTANCE_LISTING,
        )
        extra = {
            "opportunity_assistance_listing_id": source_assistance_listing.opp_cfda_id,
            "opportunity_id": source_assistance_listing.opportunity_id,
        }
        logger.info("Processing assistance listing", extra=extra)

        if source_assistance_listing.is_deleted:
            self._handle_delete(
                source_assistance_listing,
                target_assistance_listing,
                transform_constants.ASSISTANCE_LISTING,
                extra,
            )

        elif opportunity is None:
            # The Oracle system we're importing these from does not have a foreign key between
            # the opportunity ID in the TOPPORTUNITY_CFDA table and the TOPPORTUNITY table.
            # There are many (2306 as of writing) orphaned CFDA records, created between 2007 and 2011
            # We don't want to continuously process these, so won't error for these, and will just
            # mark them as transformed below.
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_ORPHANED,
                prefix=transform_constants.ASSISTANCE_LISTING,
            )
            logger.info(
                "Assistance listing is orphaned and does not connect to any opportunity",
                extra=extra,
            )
            source_assistance_listing.transformation_notes = transform_constants.ORPHANED_CFDA

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_assistance_listing is None

            logger.info("Transforming and upserting assistance listing", extra=extra)
            transformed_assistance_listing = transform_util.transform_assistance_listing(
                source_assistance_listing, target_assistance_listing
            )

            if is_insert:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                    prefix=transform_constants.ASSISTANCE_LISTING,
                )
                self.db_session.add(transformed_assistance_listing)
            else:
                self.increment(
                    transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                    prefix=transform_constants.ASSISTANCE_LISTING,
                )
                self.db_session.merge(transformed_assistance_listing)

        logger.info("Processed assistance listing", extra=extra)
        source_assistance_listing.transformed_at = self.transform_time
