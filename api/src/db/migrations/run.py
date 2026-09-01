# Convenience script for running alembic migration commands through a pyscript
# rather than the command line. This allows us to package and alias it for
# running on the production docker image from any directory.
import logging
import os

import alembic.command as command
import alembic.script as script
import grants_shared.logs
import sqlalchemy
from alembic.config import Config
from alembic.runtime import migration
from grants_shared.logs.flask_logger import init_general_logging

from src.constants.lookup_constants import JobType
from src.db.models.lookup.sync_lookup_values import sync_lookup_values

from grants_shared.task.ecs_background_task import ecs_background_task  # isort:skip

logger = logging.getLogger(__name__)
alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "./alembic.ini"))

# Override the script_location to be absolute based on this file's directory.
alembic_cfg.set_main_option("script_location", os.path.dirname(__file__))

# Initialize the logging - in most scripts
# this would be done when we initialize flask
# but we don't run the Alembic commands via Flask
grants_shared.logs.init("migrations")
init_general_logging(logging.root, "migrations", "simpler-grants")


@ecs_background_task(JobType.MIGRATE_UP)
def up(revision: str = "head") -> None:
    enable_query_error_logging()
    command.upgrade(alembic_cfg, revision)
    # Sync lookup values like enums or other static data
    sync_lookup_values()


@ecs_background_task(JobType.MIGRATE_DOWN)
def down(revision: str = "-1") -> None:
    enable_query_error_logging()
    command.downgrade(alembic_cfg, revision)


@ecs_background_task(JobType.MIGRATE_DOWNALL)
def downall(revision: str = "base") -> None:
    enable_query_error_logging()
    command.downgrade(alembic_cfg, revision)


def escape_sql_newlines(statement: str) -> str:
    """Escape the newlines in a SQL statement so it logs as a single line."""
    return "\\n".join(statement.strip().splitlines())


def log_migration_sql_error(exception_context: sqlalchemy.ExceptionContext) -> None:
    # Errors raised outside of executing a statement (eg. connecting to the DB)
    # don't have a statement attached to them
    if exception_context.statement is None:
        return

    logger.error(
        "Migration SQL failed",
        extra={"migrate.sql": escape_sql_newlines(exception_context.statement)},
    )


def enable_query_error_logging() -> None:
    """Log the SQL of any migration statement that fails."""
    sqlalchemy.event.listen(sqlalchemy.engine.Engine, "handle_error", log_migration_sql_error)


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
                "The database schema is not in sync with the migrations."
                "Please verify that the migrations have been"
                f"run up to {expected_heads}; currently at {current_heads}"
            )

        logger.info(
            f"The current migration head is up to date, {current_heads} and Alembic is expecting {expected_heads}"
        )
