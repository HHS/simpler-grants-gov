import logging

from sqlalchemy import func

import src.adapters.db as db
import src.logging
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


def _build_opportunities(db_session: db.Session) -> None:
    # Just create a variety of opportunities for local testing
    # we can eventually look into creating more specific scenarios

    # Since the factory always starts counting at the same value for the opportunity ID, we
    # need to configure that so it doesn't clash with values already in the DB
    max_opportunity_id = db_session.query(func.max(Opportunity.opportunity_id)).scalar()
    if max_opportunity_id is None:
        max_opportunity_id = 0

    factories.OpportunityFactory.reset_sequence(value=max_opportunity_id + 1)
    factories.OpportunityFactory.create_batch(size=25)

    # Also seed the topportunity table for now in the same way
    max_opportunity_id = db_session.query(func.max(TransferTopportunity.opportunity_id)).scalar()
    if max_opportunity_id is None:
        max_opportunity_id = 0

    factories.TransferTopportunityFactory.reset_sequence(value=max_opportunity_id + 1)
    factories.TransferTopportunityFactory.create_batch(size=25)


def seed_local_db() -> None:
    with src.logging.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session

            _build_opportunities(db_session)
            # Need to commit to force any updates made
            # after factories created objects
            db_session.commit()
