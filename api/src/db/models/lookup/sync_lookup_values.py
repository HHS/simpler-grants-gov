import logging

import grants_shared.adapters.db as db
import grants_shared.db.models.lookup as grants_shared_lookup
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.adapters.db.clients.postgres_config import get_db_config

logger = logging.getLogger(__name__)


def sync_lookup_values(db_client: PostgresDBClient | None = None) -> None:
    """
    Sync lookup values to the DB, adding or updating any
    values that aren't already present.

    Sync is based on the primary key integer of the lookup
    tables, so changing the description will work, and adding
    new ones is possible, but you cannot reuse existing numbers
    which the utilities prevent anyways.
    """
    if not db_client:
        db_client = PostgresDBClient(get_db_config())

    grants_shared_lookup.sync_lookup_values(db_client)

    with db_client.get_session() as db_session, db_session.begin():
        _sync_roles(db_session)


def _sync_roles(
    db_session: db.Session,
) -> None:
    # Import placed here to avoid circular dependencies
    from src.constants.static_role_values import CORE_ROLES

    logger.info("Syncing static core roles")
    updated_role_count = 0
    for role in CORE_ROLES:
        instance = db_session.merge(role)
        role_name = role.role_name
        if db_session.is_modified(instance):
            logger.info("Updated role: %s", role_name)
            updated_role_count += 1
        else:
            logger.info("No modified values for role `%s`", role_name)

    logger.info("Finished updating roles", extra={"updated_role_count": updated_role_count})
