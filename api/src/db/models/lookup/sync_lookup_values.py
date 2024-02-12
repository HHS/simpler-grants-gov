import logging
from typing import Optional, Type

import src.adapters.db as db
from src.adapters.db import PostgresDBClient
from src.adapters.db.clients.postgres_config import get_db_config
from src.db.models.lookup import Lookup, LookupRegistry, LookupTable

logger = logging.getLogger(__name__)


def sync_lookup_values(db_client: Optional[PostgresDBClient] = None) -> None:
    """
    Sync lookup values to the DB, adding or updating any
    values that aren't already present.

    Sync is based on the primary key integer of the lookup
    tables, so changing the description will work, and adding
    new ones is possible, but you cannot reuse existing numbers
    which the utilities prevent anyways.
    """
    logger.info("Beginning sync of lookup values to DB")

    if not db_client:
        db_client = PostgresDBClient(get_db_config())

    with db_client.get_session() as db_session, db_session.begin():
        sync_values = LookupRegistry.get_sync_values()

        for table, lookup_config in sync_values.items():
            _sync_lookup_for_table(table, lookup_config.get_lookups(), db_session)


def _sync_lookup_for_table(
    table: Type[LookupTable], lookups: list[Lookup], db_session: db.Session
) -> None:
    logger.info("Syncing lookup values for table %s", table.get_table_name())

    # Optimization: Read all rows into the db_session's identity map. This makes
    # the select query that merge does reference the identity map cache instead of
    # making a query individually for every lookup value. Locally this brought the
    # runtime down from 3500ms to 180ms for ~20 tables & ~400 lookup values
    _ = db_session.query(table).all()

    has_modification = False
    for lookup in lookups:
        instance = db_session.merge(table.from_lookup(lookup))
        if db_session.is_modified(instance):
            logger.info("Updated lookup value in table %s to %r", table.get_table_name(), lookup)
            has_modification = True

    if not has_modification:
        # This is just to make the logs clearer instead of seeing
        # several "Syncing lookup values for table .." and then nothing in-between
        logger.info("No modified lookup values for table %s", table.get_table_name())
