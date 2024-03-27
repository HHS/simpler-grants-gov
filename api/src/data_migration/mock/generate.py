#
# Populate source tables with mock data.
#

import logging

import factory
import sqlalchemy

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from tests.src.db.models.factories import ForeignTopportunityFactory

logger = logging.getLogger(__name__)


foreign_metadata = sqlalchemy.MetaData()

foreign_topportunity = sqlalchemy.Table(
    "foreign_topportunity",
    foreign_metadata,
    sqlalchemy.Column("opportunity_id", sqlalchemy.NUMERIC(20), nullable=False, primary_key=True),
    sqlalchemy.Column("oppnumber", sqlalchemy.VARCHAR(40)),
    sqlalchemy.Column("revision_number", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("opptitle", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("owningagency", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("publisheruid", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("listed", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("oppcategory", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("initial_opportunity_id", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("modified_comments", sqlalchemy.VARCHAR(2000)),
    sqlalchemy.Column("created_date", sqlalchemy.DATE),
    sqlalchemy.Column("last_upd_date", sqlalchemy.DATE),
    sqlalchemy.Column("creator_id", sqlalchemy.VARCHAR(50)),
    sqlalchemy.Column("last_upd_id", sqlalchemy.VARCHAR(50)),
    sqlalchemy.Column("flag_2006", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("category_explanation", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("publisher_profile_id", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("is_draft", sqlalchemy.VARCHAR(1)),
)


@data_migration_blueprint.cli.command(
    "mock-generate", help="Populate or update source tables with reproducible mock data"
)
@flask_db.with_db_session()
def generate(db_session: db.Session) -> None:
    logger.info("populating source tables with mock data")

    max_opportunity_id = get_max_opportunity_id(db_session)

    if max_opportunity_id:
        update_existing_data(db_session, max_opportunity_id)

    append_new_data(db_session, max_opportunity_id)

    db_session.commit()

    logger.info("populating source tables done")


def update_existing_data(db_session, max_opportunity_id):
    """Update a subset of existing opportunities in the source tables."""

    # Every record with id ending in 001:
    update_ids = set(range(1, max_opportunity_id, 1000))
    # Plus the 20 most recently created records:
    update_ids |= set(range(max_opportunity_id - 19, max_opportunity_id + 1))

    logger.info("updating rows %r" % sorted(update_ids))

    for opportunity_id in update_ids:
        factory.random.reseed_random(opportunity_id + max_opportunity_id)
        ForeignTopportunityFactory.reset_sequence(opportunity_id, force=True)

        updated_opportunity = ForeignTopportunityFactory.build()
        updated_opportunity.pop("created_date")
        updated_opportunity.pop("last_upd_date")

        db_session.execute(
            sqlalchemy.update(foreign_topportunity)
            .where(foreign_topportunity.c.opportunity_id == opportunity_id)
            .values(**updated_opportunity)
        )


def append_new_data(db_session, max_opportunity_id):
    count = 100000 if max_opportunity_id == 0 else 2000
    generate_batch(db_session, max_opportunity_id + 1, count)


def generate_batch(db_session, start_id, count):
    """Generate a reproducible batch of opportunities in the source tables."""
    logger.info("appending batch of %i rows starting with id %i" % (count, start_id))

    factory.random.reseed_random(start_id)
    ForeignTopportunityFactory.reset_sequence(start_id, force=True)

    opportunity_rows = ForeignTopportunityFactory.build_batch(size=count)

    db_session.execute(sqlalchemy.insert(foreign_topportunity), opportunity_rows)


def get_max_opportunity_id(db_session):
    select_max_id = sqlalchemy.select(sqlalchemy.func.max(foreign_topportunity.c.opportunity_id))
    result = db_session.execute(select_max_id)
    max_opportunity_id = result.scalar()
    logger.info("max(opportunity_id) = %r" % max_opportunity_id)
    if max_opportunity_id is None:
        return 0
    return int(max_opportunity_id)
