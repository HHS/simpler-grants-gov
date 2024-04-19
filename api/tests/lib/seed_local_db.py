import logging

import click
from sqlalchemy import func

import src.adapters.db as db
import src.logging
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def _build_opportunities(db_session: db.Session, iterations: int) -> None:
    # Just create a variety of opportunities for local testing
    # we can eventually look into creating more specific scenarios

    # Since the factory always starts counting at the same value for the opportunity ID, we
    # need to configure that so it doesn't clash with values already in the DB
    max_opportunity_id = db_session.query(func.max(Opportunity.opportunity_id)).scalar()
    if max_opportunity_id is None:
        max_opportunity_id = 0

    logger.info(f"Creating opportunities starting with opportunity_id {max_opportunity_id + 1}")
    factories.OpportunityFactory.reset_sequence(value=max_opportunity_id + 1)

    for i in range(iterations):
        logger.info(f"Creating opportunity batch number {i}")
        # Create a few opportunities in various scenarios
        factories.OpportunityFactory.create_batch(size=5, is_forecasted_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_posted_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_closed_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_non_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, no_current_summary=True)

        # generate a few opportunities with mostly null values
        all_null_opportunities = factories.OpportunityFactory.create_batch(
            size=5, all_fields_null=True
        )
        for all_null_opportunity in all_null_opportunities:
            summary = factories.OpportunitySummaryFactory.create(
                all_fields_null=True, opportunity=all_null_opportunity
            )
            factories.CurrentOpportunitySummaryFactory.create(
                opportunity=all_null_opportunity, opportunity_summary=summary
            )

    logger.info("Finished creating opportunities")

    logger.info("Creating records in the transfer_topportunity table")
    # Also seed the topportunity table for now in the same way
    max_opportunity_id = db_session.query(func.max(TransferTopportunity.opportunity_id)).scalar()
    if max_opportunity_id is None:
        max_opportunity_id = 0

    factories.TransferTopportunityFactory.reset_sequence(value=max_opportunity_id + 1)
    factories.TransferTopportunityFactory.create_batch(size=25)
    logger.info("Finished creating records in the transfer_topportunity table")


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
