# Convenience script for running alembic migration commands through a pyscript
# rather than the command line. This allows poetry to package and alias it for
# running on the production docker image from any directory.
import logging
import os
import time
from typing import Any

import alembic.command as command
import alembic.script as script
import sqlalchemy
from alembic.config import Config
from alembic.runtime import migration

import src.logging
from src.db.models.lookup.sync_lookup_values import sync_lookup_values

logger = logging.getLogger(__name__)
alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "./alembic.ini"))

# Override the script_location to be absolute based on this file's directory.
alembic_cfg.set_main_option("script_location", os.path.dirname(__file__))


def up(revision: str = "head") -> None:
    enable_query_logging()
    command.upgrade(alembic_cfg, revision)

    # We want logging for the lookups, but alembic already sets
    # it up in env.py, so set it up again separately for the syncing
    with src.logging.init("sync_lookup_values"):
        sync_lookup_values()


def down(revision: str = "-1") -> None:
    enable_query_logging()
    command.downgrade(alembic_cfg, revision)


def downall(revision: str = "base") -> None:
    enable_query_logging()
    command.downgrade(alembic_cfg, revision)


def enable_query_logging() -> None:
    """Log each migration query as it happens along with timing.

    Based on the example at https://docs.sqlalchemy.org/en/20/faq/performance.html#query-profiling
    """

    @sqlalchemy.event.listens_for(sqlalchemy.engine.Engine, "before_cursor_execute", retval=True)
    def before_execute(
        conn: sqlalchemy.Connection,
        _cursor: Any,
        statement: str,
        _parameters: Any,
        _context: Any,
        _executemany: bool,
    ) -> tuple[str, Any]:
        conn.info.setdefault("query_start_time", []).append(time.monotonic())
        logger.info("before execute", extra={"migrate.sql": statement.strip()})
        return statement, _parameters

    @sqlalchemy.event.listens_for(sqlalchemy.engine.Engine, "after_cursor_execute")
    def after_execute(
        conn: sqlalchemy.Connection,
        _cursor: Any,
        statement: str,
        _parameters: Any,
        _context: Any,
        _executemany: bool,
    ) -> None:
        total = int(1000 * (time.monotonic() - conn.info["query_start_time"].pop(-1)))
        logger.info(
            "after execute", extra={"migrate.sql": statement.strip(), "migrate.time_ms": total}
        )


def have_all_migrations_run(db_engine: sqlalchemy.engine.Engine) -> None:
    directory = script.ScriptDirectory.from_config(alembic_cfg)
    with db_engine.begin() as connection:
        context = migration.MigrationContext.configure(connection)
        current_heads = set(context.get_current_heads())
        expected_heads = set(directory.get_heads())

        # Only throw _if_ it's been migrated and doesn't match expectations.
        # Otherwise, don't bother with this - most likely running in a testing environment.
        if current_heads != expected_heads:
            raise Exception(
                (
                    "The database schema is not in sync with the migrations."
                    "Please verify that the migrations have been"
                    f"run up to {expected_heads}; currently at {current_heads}"
                )
            )

        logger.info(
            f"The current migration head is up to date, {current_heads} and Alembic is expecting {expected_heads}"
        )
