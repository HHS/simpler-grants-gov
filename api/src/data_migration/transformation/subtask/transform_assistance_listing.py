import logging

from sqlalchemy import select

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.db.models.staging.competition import Tcompetition
from src.db.models.staging.opportunity import TopportunityCfda

logger = logging.getLogger(__name__)


class TransformAssistanceListing(AbstractTransformSubTask):
    def transform_records(self) -> None:
        assistance_listings: list[
            tuple[TopportunityCfda, OpportunityAssistanceListing | None, Opportunity | None]
        ] = self.fetch_with_opportunity(
            TopportunityCfda,
            OpportunityAssistanceListing,
            [
                TopportunityCfda.opp_cfda_id
                == OpportunityAssistanceListing.legacy_opportunity_assistance_listing_id
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
            # Before deleting, handle any competitions that reference this assistance listing
            if target_assistance_listing is not None:
                self._handle_competition_references(target_assistance_listing, extra)

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

        elif not source_assistance_listing.programtitle or not source_assistance_listing.cfdanumber:
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_SKIPPED,
                prefix=transform_constants.ASSISTANCE_LISTING,
            )
            logger.info(
                "Skipping assistance listing with empty required fields",
                extra={
                    **extra,
                    "programtitle": source_assistance_listing.programtitle,
                    "cfdanumber": source_assistance_listing.cfdanumber,
                },
            )
            source_assistance_listing.transformation_notes = "empty_assistance_listing"
            source_assistance_listing.transformed_at = self.transform_time

        else:
            # To avoid incrementing metrics for records we fail to transform, record
            # here whether it's an insert/update and we'll increment after transforming
            is_insert = target_assistance_listing is None

            logger.info("Transforming and upserting assistance listing", extra=extra)
            transformed_assistance_listing = transform_util.transform_assistance_listing(
                source_assistance_listing, target_assistance_listing, opportunity
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

    def _handle_competition_references(
        self, target_assistance_listing: OpportunityAssistanceListing, extra: dict
    ) -> None:
        """
        Handle competitions that reference the assistance listing being deleted, for api tables.

        From api side, when deleting an assistance listing, need to check if any competition(s) reference it.
        If yes, check against to staging competition tables to see if each competition is being deleted there.
        For each competition in staging:
            - If it is being deleted, nullify the reference to avoid foreign key constraint violations.
            - If it is not, same nullify the reference, but also log an error. A conflict is happening though it is not expected.
        """
        # Find all competitions that reference this assistance listing
        competitions_with_reference = (
            self.db_session.execute(
                select(Competition).where(
                    Competition.opportunity_assistance_listing_id
                    == target_assistance_listing.opportunity_assistance_listing_id
                )
            )
            .scalars()
            .all()
        )

        if not competitions_with_reference:
            return

        logger.info(
            "Found competitions referencing assistance listing being deleted",
            extra=extra | {"competition_count": len(competitions_with_reference)},
        )

        for competition in competitions_with_reference:
            # Check if this competition is also being deleted in the staging table
            staging_competition = self.db_session.execute(
                select(Tcompetition).where(
                    Tcompetition.comp_id == competition.legacy_competition_id
                )
            ).scalar_one_or_none()

            is_competition_being_deleted = (
                staging_competition is not None and staging_competition.is_deleted
            )

            if is_competition_being_deleted:
                logger.info(
                    "Nullifying assistance listing reference on competition that is also being deleted",
                    extra=extra
                    | {
                        "competition_id": competition.competition_id,
                        "legacy_competition_id": competition.legacy_competition_id,
                    },
                )
            else:
                logger.error(
                    "Nullifying assistance listing reference on competition that is NOT being deleted on staging - this is unexpected",
                    extra=extra
                    | {
                        "competition_id": competition.competition_id,
                        "legacy_competition_id": competition.legacy_competition_id,
                    },
                )

            # Nullify the reference to allow the assistance listing to be deleted
            competition.opportunity_assistance_listing_id = None
