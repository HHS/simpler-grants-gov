#
# Populate legacy tables with mock data.
#

import datetime
import logging

import factory
import sqlalchemy

import src.adapters.db
import src.logging
import tests.src.db.models.factories as factories
from src.db.models import foreign

logger = logging.getLogger(__name__)


def seed_local_source_tables() -> None:
    with src.logging.init("seed_local_source_tables"):
        logger.info("populating source tables with mock data")

        db_client = src.adapters.db.PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session
            update_and_append_data(db_session)

        logger.info("populating source tables done")


def update_and_append_data(db_session):
    max_opportunity_id = get_max_opportunity_id(db_session)
    if max_opportunity_id:
        update_existing_data(db_session, max_opportunity_id)
    append_new_data(db_session, max_opportunity_id)
    db_session.commit()


def update_existing_data(db_session, max_opportunity_id):
    """Update a subset of existing opportunities in the source tables."""

    # Every record with id ending in 001:
    update_ids = set(range(1, max_opportunity_id, 100))
    # Plus the 20 most recently created records:
    update_ids |= set(range(max_opportunity_id - 19, max_opportunity_id + 1))

    logger.info("updating rows %r" % sorted(update_ids))

    for opportunity_id in update_ids:
        factory.random.reseed_random(opportunity_id + max_opportunity_id)
        factories.ForeignTopportunityFactory.reset_sequence(opportunity_id, force=True)

        updated_opportunity = factories.ForeignTopportunityFactory.build()._dict()
        updated_opportunity.pop("created_date")
        updated_opportunity["last_upd_date"] = datetime.datetime.now()

        db_session.execute(
            sqlalchemy.update(foreign.opportunity.Topportunity)
            .where(foreign.opportunity.Topportunity.opportunity_id == opportunity_id)
            .values(**updated_opportunity)
        )


def append_new_data(db_session, max_opportunity_id):
    count = 5000 if max_opportunity_id == 0 else 500
    generate_batch(db_session, max_opportunity_id + 1, count)


def generate_batch(db_session, start_id, count):
    """Generate a reproducible batch of opportunities in the source tables."""
    logger.info("appending batch of %i rows starting with id %i" % (count, start_id))

    factory.random.reseed_random(start_id)
    factories.ForeignTopportunityFactory.reset_sequence(start_id, force=True)

    factories.ForeignTopportunityFactory.create_batch(size=count)


def get_max_opportunity_id(db_session):
    max_opportunity_id = db_session.query(
        sqlalchemy.func.max(foreign.opportunity.Topportunity.opportunity_id)
    ).scalar()
    logger.info("max(opportunity_id) = %r" % max_opportunity_id)
    if max_opportunity_id is None:
        return 0
    return int(max_opportunity_id)


if __name__ == "__main__":
    seed_local_source_tables()
