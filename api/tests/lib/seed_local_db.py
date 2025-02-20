import logging

import click

import src.adapters.db as db
import src.logging
import src.util.datetime_util as datetime_util
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.util.local import error_if_not_local
from tests.lib.seed_agencies import _build_agencies

logger = logging.getLogger(__name__)


def _build_opportunities(db_session: db.Session, iterations: int) -> None:
    for i in range(iterations):
        logger.info(f"Creating opportunity batch number {i}")

        # Create regular (non-historical) opportunities
        opportunity1 = factories.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )

        # Create current summaries - only one per is_forecast value
        factories.OpportunitySummaryFactory.create(
            is_forecasted_summary=True,
            revision_number=None,  # Current records
            opportunity=opportunity1,
        )
        factories.OpportunitySummaryFactory.create(
            is_posted_summary=True,
            revision_number=None,  # Current records
            opportunity=opportunity1,
        )

        # Create historical summaries with unique revision numbers
        historical_summaries = []

        # Forecast historical records
        for rev_num in range(1, 4):  # Revisions 1, 2, 3
            summary = factories.OpportunitySummaryFactory.create(
                is_forecasted_summary=True, revision_number=rev_num, opportunity=opportunity1
            )
            historical_summaries.append(summary)

        # Posted historical records
        for rev_num in range(4, 7):  # Revisions 4, 5, 6
            summary = factories.OpportunitySummaryFactory.create(
                is_posted_summary=True, revision_number=rev_num, opportunity=opportunity1
            )
            historical_summaries.append(summary)

        all_null_opportunities = factories.OpportunityFactory.create_batch(
            size=2, all_fields_null=True
        )
        for idx, all_null_opportunity in enumerate(all_null_opportunities):
            # Current summary
            current_summary = factories.OpportunitySummaryFactory.create(
                all_fields_null=True,
                opportunity=all_null_opportunity,
                post_date=datetime_util.get_now_us_eastern_date(),
                revision_number=None,  # Current record
                is_forecasted_summary=bool(idx % 2),  # Alternate between forecast and posted
            )
            factories.CurrentOpportunitySummaryFactory.create(
                opportunity=all_null_opportunity, opportunity_summary=current_summary
            )

            # Historical summary - use unique revision numbers
            historical_summary = factories.OpportunitySummaryFactory.create(
                all_fields_null=True,
                opportunity=all_null_opportunity,
                post_date=datetime_util.get_now_us_eastern_date(),
                revision_number=10 + idx,  # Unique revision numbers (10, 11)
                is_forecasted_summary=bool(idx % 2),  # Alternate between forecast and posted
            )

            factories.LinkOpportunitySummaryFundingCategoryFactory.create(
                opportunity_summary=historical_summary
            )

            factories.LinkOpportunitySummaryApplicantTypeFactory.create(
                opportunity_summary=historical_summary
            )

    logger.info("Finished creating opportunities")


@click.command()
@click.option(
    "--iterations",
    default=1,
    help="Number of sets of opportunities to create, note that several are created per iteration",
)
def seed_local_db(iterations: int) -> None:
    with src.logging.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session

            _build_opportunities(db_session, iterations)
            # Need to commit to force any updates made
            # after factories created objects
            db_session.commit()

            _build_agencies(db_session)
