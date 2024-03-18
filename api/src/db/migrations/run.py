# Convenience script for running alembic migration commands through a pyscript
# rather than the command line. This allows poetry to package and alias it for
# running on the production docker image from any directory.
import logging
import os

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
    command.upgrade(alembic_cfg, revision)

    # We want logging for the lookups, but alembic already sets
    # it up in env.py, so set it up again separately for the syncing
    with src.logging.init("sync_lookup_values"):
        sync_lookup_values()


def down(revision: str = "-1") -> None:
    command.downgrade(alembic_cfg, revision)


def downall(revision: str = "base") -> None:
    command.downgrade(alembic_cfg, revision)


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
