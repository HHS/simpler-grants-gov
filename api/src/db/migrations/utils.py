import logging
from typing import Protocol

import sqlalchemy as sa

from src.constants.schema import Schemas
from src.db.migrations.constants import opportunity_search_index_queue_trigger_function
from src.util.api_key_gen import hash_api_key_id

logger = logging.getLogger(__name__)

# Defined here rather than importing UserApiKey so the migration that uses it
# keeps working once key_id is removed from the model. Needs to be a full Table
# (not sa.table) for the schema translate map to apply to it.
_user_api_key_table = sa.Table(
    "user_api_key",
    sa.MetaData(),
    sa.Column("api_key_id", sa.UUID(), primary_key=True),
    sa.Column("key_id", sa.Text()),
    sa.Column("key_id_hash", sa.Text()),
    schema=Schemas.API,
)


class OpExecutable(Protocol):
    def execute(self, statement: str) -> None: ...


def setup_opportunity_search_index_queue_trigger_function(
    op: OpExecutable, tables: list[str]
) -> None:
    # Setup the opportunity search index queue trigger function
    op.execute(opportunity_search_index_queue_trigger_function)

    # Create triggers for each table
    for table in tables:
        op.execute(f"""
            CREATE OR REPLACE TRIGGER {table}_queue_trigger
            AFTER INSERT OR UPDATE OR DELETE ON api.{table}
            FOR EACH ROW EXECUTE FUNCTION api.update_opportunity_search_queue();
        """)


def remove_opportunity_search_index_queue_trigger_function(
    op: OpExecutable, tables: list[str]
) -> None:
    # Drop triggers
    for table in tables:
        op.execute(f"DROP TRIGGER IF EXISTS {table}_queue_trigger ON api.{table};")

    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS api.update_opportunity_search_queue();")


def backfill_user_api_key_hashes(connection: sa.Connection, pepper: str) -> None:
    """Set key_id_hash on every user_api_key row that doesn't have one yet.

    Hashes in Python with the same function the application uses so the stored
    values match what the auth lookup computes. Raises if any row is still
    missing a hash afterwards so the migration rolls back before the column
    is made NOT NULL.
    """
    rows = connection.execute(
        sa.select(_user_api_key_table.c.api_key_id, _user_api_key_table.c.key_id).where(
            _user_api_key_table.c.key_id_hash.is_(None)
        )
    ).all()

    if rows:
        connection.execute(
            sa.update(_user_api_key_table)
            .where(_user_api_key_table.c.api_key_id == sa.bindparam("b_api_key_id"))
            .values(key_id_hash=sa.bindparam("b_key_id_hash")),
            [
                {
                    "b_api_key_id": row.api_key_id,
                    "b_key_id_hash": hash_api_key_id(row.key_id, pepper),
                }
                for row in rows
            ],
        )

    logger.info("Backfilled user API key hashes", extra={"backfilled_count": len(rows)})

    remaining_count = connection.execute(
        sa.select(sa.func.count())
        .select_from(_user_api_key_table)
        .where(_user_api_key_table.c.key_id_hash.is_(None))
    ).scalar_one()

    if remaining_count > 0:
        raise Exception(
            f"{remaining_count} user_api_key rows still have no key_id_hash after the backfill"
        )
