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


def _build_opportunities(
    db_session: db.Session, iterations: int, cover_all_agencies: bool = True
) -> None:
    # Just create a variety of opportunities for local testing
    # we can eventually look into creating more specific scenarios
    for i in range(iterations):
        logger.info(f"Creating opportunity batch number {i}")
        # Create a few opportunities in various scenarios
        factories.OpportunityFactory.create_batch(size=5, is_forecasted_summary=True)
        factories.OpportunityFactory.create_batch(
            size=5, is_posted_summary=True, has_attachments=True
        )
        factories.OpportunityFactory.create_batch(size=5, is_closed_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_non_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, no_current_summary=True)
        factories.OpportunityFactory.create_batch(
            size=2, is_posted_summary=True, has_long_descriptions=True
        )

        # generate a few opportunities with mostly null values
        all_null_opportunities = factories.OpportunityFactory.create_batch(
            size=5, all_fields_null=True
        )
        for all_null_opportunity in all_null_opportunities:
            summary = factories.OpportunitySummaryFactory.create(
                # We  set post_date to something so that running the set-current-opportunities logic
                # won't get rid of it for having a null post date
                all_fields_null=True,
                opportunity=all_null_opportunity,
                post_date=datetime_util.get_now_us_eastern_date(),
            )
            factories.CurrentOpportunitySummaryFactory.create(
                opportunity=all_null_opportunity, opportunity_summary=summary
            )
    if cover_all_agencies:
        for agency in factories.CustomProvider.AGENCIES:
            factories.OpportunityFactory.create(agency_code=agency)
    logger.info("Finished creating opportunities")


@click.command()
@click.option(
    "--iterations",
    default=1,
    help="Number of sets of opportunities to create, note that several are created per iteration",
)
def seed_local_db(iterations: int, cover_all_agencies: bool = True) -> None:
    with src.logging.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session

            _build_opportunities(db_session, iterations, cover_all_agencies)
            # Need to commit to force any updates made
            # after factories created objects
            db_session.commit()

            _build_agencies(db_session)
